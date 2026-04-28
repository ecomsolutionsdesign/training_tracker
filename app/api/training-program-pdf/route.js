// app/api/training-program-pdf/route.js
/**
 * GET /api/training-program-pdf?employeeId=<id>
 *
 * Generates a combined Training Program + Job Description PDF for the given employee.
 *
 * Page 1+  : Training topics table (same as before)
 * Last page: Job Description section (reporting to, employment type,
 *            qualifications, experience, responsibilities, requirements)
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import PositionTopicMap from '@/models/PositionTopicMap';
import Attendance from '@/models/Attendance';
import Schedule from '@/models/Schedule';

// ─── Pure-JS PDF Builder ───────────────────────────────────────────────────────

class TrainingPDF {
  constructor() {
    this.W = 595.28;
    this.H = 841.89;
    this.ML = 28;
    this.MR = 28;
    this.MT = 28;
    this.MB = 28;
    this.TW = this.W - this.ML - this.MR;
    this.pages = [];
    this.currentPageOps = [];
  }

  _s(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  _c(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r.toFixed(3), g.toFixed(3), b.toFixed(3)].join(' ');
  }

  op(cmd) { this.currentPageOps.push(cmd); }

  // Flush current page ops and start a fresh page; returns top Y
  newPage() {
    if (this.currentPageOps.length > 0) {
      this.pages.push(this.currentPageOps);
    }
    this.currentPageOps = [];
    return this.H - this.MT;
  }

  fillRect(x, y, w, h, hex) {
    this.op(`${this._c(hex)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f 0 0 0 rg`);
  }

  strokeRect(x, y, w, h, hex = '#cccccc', lw = 0.4) {
    this.op(`${this._c(hex)} RG ${lw} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S 0 0 0 RG`);
  }

  hLine(x1, x2, y, hex = '#cccccc', lw = 0.4) {
    this.op(`${this._c(hex)} RG ${lw} w ${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S 0 0 0 RG`);
  }

  vLine(x, y1, y2, hex = '#cccccc', lw = 0.4) {
    this.op(`${this._c(hex)} RG ${lw} w ${x.toFixed(2)} ${y1.toFixed(2)} m ${x.toFixed(2)} ${y2.toFixed(2)} l S 0 0 0 RG`);
  }

  text(x, y, str, size = 9, bold = false, hex = '#000000') {
    if (!str) return;
    const font = bold ? 'F2' : 'F1';
    this.op(`${this._c(hex)} rg BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${this._s(str)}) Tj ET 0 0 0 rg`);
  }

  textClip(x, y, str, size, bold, hex, maxW) {
    const maxChars = Math.floor(maxW / (size * 0.55));
    let s = String(str || '');
    if (s.length > maxChars) s = s.slice(0, Math.max(maxChars - 1, 1)) + '~';
    this.text(x, y, s, size, bold, hex);
  }

  // ── Word-wrap helper ─────────────────────────────────────────────────────────
  // Returns array of lines that fit within maxW at given font size
  wrapText(str, size, maxW) {
    const charW = size * 0.52;
    const maxChars = Math.floor(maxW / charW);
    const words = String(str || '').split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (test.length <= maxChars) {
        current = test;
      } else {
        if (current) lines.push(current);
        // If the single word itself is too long, clip it
        current = word.length > maxChars ? word.slice(0, maxChars - 1) + '~' : word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // ── Training section (unchanged logic) ──────────────────────────────────────
  generateTraining(emp, rows, stats) {
    const { W, H, ML, MB, TW } = this;

    const GREEN       = '#166534';
    const GREEN_LIGHT = '#dcfce7';
    const GREEN_PALE  = '#f0fdf4';
    const AMBER       = '#fef3c7';
    const AMBER_TEXT  = '#92400e';
    const DONE_TEXT   = '#14532d';
    const GREY        = '#4b5563';
    const GREY_LIGHT  = '#9ca3af';

    const today = new Date().toLocaleDateString('en-GB');
    const docNo = 'TP-' + String(Date.now()).slice(-8);

    let y = this.newPage();

    // ── HEADER ──
    const hdrH = 36;
    this.fillRect(ML, y - hdrH, TW, hdrH, GREEN);
    this.text(ML + 8, y - hdrH + 14, 'KTEX EMPLOYEE TRAINING PROGRAM', 14, true, '#bbf7d0');
    this.text(ML + 8, y - hdrH + 4,  'Training Management System', 8, false, '#bbf7d0');
    this.text(ML + TW - 100, y - hdrH + 14, today, 8, false, '#bbf7d0');
    this.text(ML + TW - 100, y - hdrH + 4,  docNo, 8, false, '#bbf7d0');
    y -= hdrH + 6;

    // ── EMPLOYEE INFO ──
    const infoH = 55;
    this.fillRect(ML, y - infoH, TW, infoH, GREEN_PALE);
    this.strokeRect(ML, y - infoH, TW, infoH, GREEN, 0.6);
    this.vLine(ML + TW / 2, y - infoH, y, '#86efac', 0.4);

    this.text(ML + 8,           y - 14, 'Employee:',   9, true);
    this.text(ML + 80,          y - 14, emp.name,       9);
    this.text(ML + 8,           y - 28, 'Department:',  9, true);
    this.text(ML + 80,          y - 28, emp.department, 9);
    this.text(ML + 8,           y - 42, 'Position:',    9, true);
    this.text(ML + 80,          y - 42, emp.position || '-', 9);

    this.text(ML + TW / 2 + 8,  y - 14, 'Doc No:', 9, true);
    this.text(ML + TW / 2 + 70, y - 14, docNo,     9);
    this.text(ML + TW / 2 + 8,  y - 28, 'Date:',   9, true);
    this.text(ML + TW / 2 + 70, y - 28, today,     9);

    const qual = stats.pending === 0 ? 'Fully Qualified' : `${stats.pending} Pending`;
    this.text(ML + TW / 2 + 8,  y - 42, 'Status:', 9, true);
    this.text(ML + TW / 2 + 70, y - 42, qual, 9, true,
      stats.pending ? AMBER_TEXT : DONE_TEXT);

    y -= infoH + 10;

    // ── TABLE HEADER ──
    const C = [
      { x: ML,          w: 22     },
      { x: ML + 22,     w: 150    },
      { x: ML + 172,    w: 72     },
      { x: ML + 244,    w: 52     },
      { x: ML + 296,    w: 104    },
      { x: ML + 400,    w: 68     },
      { x: ML + 468,    w: 71.28  },
    ];
    const labels = ['#', 'Topic', 'Dept', 'Dur', 'Trainer', 'Date', 'Status'];

    const renderHeader = (yy) => {
      this.fillRect(ML, yy - 20, TW, 20, GREEN);
      let hx = ML;
      labels.forEach((l, i) => {
        if (i > 0) this.vLine(hx, yy - 20, yy, '#4ade80', 0.3);
        this.text(hx + 4, yy - 13, l, 7.5, true, '#bbf7d0');
        hx += C[i].w;
      });
      return yy - 20;
    };

    y = renderHeader(y);

    // ── TABLE ROWS ──
    const rowH = 18;
    rows.forEach((row, idx) => {
      if (y - rowH < MB + 140) {
        y = this.newPage();
        y = renderHeader(y);
      }

      const bg = row.attended ? '#f0fdf4' : '#ffffff';
      this.fillRect(ML, y - rowH, TW, rowH, bg);
      this.strokeRect(ML, y - rowH, TW, rowH, '#e5e7eb', 0.3);

      const ty = y - rowH / 2 - 3;

      C.forEach((col, i) => {
        if (i > 0) this.vLine(col.x, y - rowH, y, '#e5e7eb', 0.3);
        const px = col.x + 4;

        if (i === 0) this.text(px, ty, String(idx + 1), 7.5, true);
        if (i === 1) this.textClip(px, ty, row.topic,       8, false, '#111', col.w - 8);
        if (i === 2) this.textClip(px, ty, row.dept,        7, false, GREY,   col.w - 8);
        if (i === 3) this.text(px, ty, row.duration || '-', 7, false, GREY);
        if (i === 4) this.textClip(px, ty, row.trainerName || '-', 7, false, GREY, col.w - 8);
        if (i === 5) this.text(px, ty, row.attended ? row.attendedDate : '', 7, false, DONE_TEXT);

        if (i === 6) {
          const bx = col.x + 3;
          const bw = col.w - 6;
          const by = y - rowH + 3;
          if (row.attended) {
            this.fillRect(bx, by, bw, rowH - 6, '#dcfce7');
            this.text(px, ty, 'Done', 7, true, DONE_TEXT);
          } else {
            this.fillRect(bx, by, bw, rowH - 6, AMBER);
            this.text(px, ty, 'Pending', 7, true, AMBER_TEXT);
          }
        }
      });

      y -= rowH;
    });

    this.hLine(ML, ML + TW, y, GREEN, 0.7);
    y -= 10;

    // ── PROGRESS BAR ──
    const pct = stats.total ? stats.attended / stats.total : 0;
    this.fillRect(ML, y - 6, TW, 6, '#e5e7eb');
    this.fillRect(ML, y - 6, TW * pct, 6, GREEN);
    y -= 18;

    // ── SUMMARY ──
    this.fillRect(ML, y - 20, TW, 20, GREEN_LIGHT);
    this.text(ML + 8,   y - 13, `Total: ${stats.total}`,         8, true, GREEN);
    this.text(ML + 120, y - 13, `Done: ${stats.attended}`,       8, true, GREEN);
    this.text(ML + 220, y - 13, `Pending: ${stats.pending}`,     8, true, stats.pending ? AMBER_TEXT : GREEN);
    this.text(ML + 350, y - 13, `Completion: ${Math.round(pct * 100)}%`, 8, true, GREEN);
    y -= 30;

    // ── SIGNATURES ──
    const sigW = (TW - 10) / 3;
    ['HR Manager', 'Employee', 'Dept Head'].forEach((t, i) => {
      const sx = ML + i * (sigW + 5);
      this.strokeRect(sx, y - 60, sigW, 60, GREEN, 0.6);
      this.text(sx + 5, y - 12, t, 8, true, GREEN);
      this.hLine(sx + 5, sx + sigW - 5, y - 30);
    });

    // ── FOOTER ──
    this.text(ML, MB, `Generated on ${today} | KTEX System`, 6, false, GREY_LIGHT);

    // Flush training pages — don't call newPage() yet; JD section will do it
    this.pages.push(this.currentPageOps);
    this.currentPageOps = [];

    return docNo;
  }

  // ── JD section ───────────────────────────────────────────────────────────────
  generateJD(emp, positionDoc, docNo) {
    const { ML, MB, TW } = this;

    const GREEN        = '#166534';
    const GREEN_LIGHT  = '#dcfce7';
    const GREEN_PALE   = '#f0fdf4';
    const BLUE         = '#1e40af';
    const BLUE_LIGHT   = '#dbeafe';
    const BLUE_PALE    = '#eff6ff';
    const GREY         = '#4b5563';
    const GREY_LIGHT   = '#9ca3af';
    const DIVIDER      = '#e5e7eb';

    const today = new Date().toLocaleDateString('en-GB');

    // Always start JD on a fresh page
    let y = this.newPage();

    // ── JD HEADER ──
    const hdrH = 42;
    this.fillRect(ML, y - hdrH, TW, hdrH, GREEN);
    this.text(ML + 8, y - hdrH + 22, 'JOB DESCRIPTION', 14, true, '#bfdbfe');
    this.text(ML + 8, y - hdrH + 10, `${emp.position || 'Position'} — ${emp.department}`, 9, false, '#bfdbfe');
    this.text(ML + TW - 100, y - hdrH + 22, today,  8, false, '#bfdbfe');
    this.text(ML + TW - 100, y - hdrH + 10, docNo,  8, false, '#bfdbfe');
    y -= hdrH + 6;

    // ── EMPLOYEE INFO STRIP ──
    const stripH = 22;
    this.fillRect(ML, y - stripH, TW, stripH, GREEN_PALE);
    this.strokeRect(ML, y - stripH, TW, stripH, '#93c5fd', 0.5);
    this.text(ML + 8,           y - 14, 'Employee:', 8, true, GREEN);
    this.text(ML + 65,          y - 14, emp.name,    8, false, '#111');
    this.text(ML + TW / 2,      y - 14, 'Position:', 8, true, GREEN);
    this.text(ML + TW / 2 + 55, y - 14, emp.position || '—', 8, false, '#111');
    y -= stripH + 10;

    // ── META GRID (4 cells: 2×2) ──
    const hasAnySummary = positionDoc.reportingTo || positionDoc.employmentType ||
      positionDoc.qualifications || positionDoc.experienceRequired;

    if (hasAnySummary) {
      const cellW  = (TW - 6) / 2;
      const cellH  = 34;
      const metaItems = [
        { label: 'Reporting To',     value: positionDoc.reportingTo      || '—' },
        { label: 'Employment Type',  value: positionDoc.employmentType   || '—' },
        { label: 'Qualification',    value: positionDoc.qualifications    || '—' },
        { label: 'Experience Required', value: positionDoc.experienceRequired || '—' },
      ];

      for (let i = 0; i < metaItems.length; i += 2) {
        // ensure enough space for the row
        if (y - cellH < MB + 80) {
          y = this.newPage();
        }
        for (let j = 0; j < 2; j++) {
          const item = metaItems[i + j];
          if (!item) continue;
          const cx = ML + j * (cellW + 6);
          this.fillRect(cx, y - cellH, cellW, cellH, GREEN_PALE);
          this.strokeRect(cx, y - cellH, cellW, cellH, '#86efac', 0.4);
          this.text(cx + 8, y - 10, item.label, 7, true, GREY);
          this.textClip(cx + 8, y - 23, item.value, 8.5, false, '#111', cellW - 16);
        }
        y -= cellH + 4;
      }
      y -= 6;
    }

    // ── SECTION RENDERER helper ─────────────────────────────────────────────
    // Renders a titled list (responsibilities / requirements)
    const renderSection = (title, items, accentHex, bgHex) => {
      if (!items || items.length === 0) return;

      // Section title bar
      if (y - 22 < MB + 60) { y = this.newPage(); }
      this.fillRect(ML, y - 22, TW, 22, accentHex);
      this.text(ML + 10, y - 14, title, 9, true, '#ffffff');
      y -= 22 + 4;

      const lineH   = 14;   // height per wrapped line
      const itemGap = 4;    // gap between bullet items
      const padX    = 14;   // left indent inside box
      const dotX    = ML + 8;
      const textX   = ML + padX + 4;
      const textW   = TW - padX - 12;

      items.forEach((item, idx) => {
        const lines = this.wrapText(item, 8, textW);
        const blockH = lines.length * lineH + itemGap;

        if (y - blockH < MB + 40) { y = this.newPage(); }

        // Alternating row background
        const rowBg = idx % 2 === 0 ? bgHex : '#ffffff';
        this.fillRect(ML, y - blockH, TW, blockH, rowBg);
        this.strokeRect(ML, y - blockH, TW, blockH, DIVIDER, 0.3);

        // Bullet dot
        this.fillRect(dotX - 2, y - lineH / 2 - 2.5, 4, 4, accentHex);

        // Text lines
        lines.forEach((line, li) => {
          this.text(textX, y - lineH * (li + 1) + 4, line, 8, false, '#1f2937');
        });

        y -= blockH;
      });

      y -= 8;
    };

    // ── RESPONSIBILITIES ──
    renderSection(
      'Responsibilities',
      positionDoc.responsibilities,
      GREEN,
      GREEN_PALE
    );

    // ── REQUIREMENTS & SKILLS ──
    renderSection(
      'Requirements & Skills',
      positionDoc.requirements,
      GREEN,
      GREEN_PALE
    );

    // If no JD data at all, show a placeholder
    const hasAnyJD = hasAnySummary ||
      (positionDoc.responsibilities && positionDoc.responsibilities.length > 0) ||
      (positionDoc.requirements     && positionDoc.requirements.length > 0);

    if (!hasAnyJD) {
      this.fillRect(ML, y - 50, TW, 50, '#f9fafb');
      this.strokeRect(ML, y - 50, TW, 50, DIVIDER, 0.5);
      this.text(ML + TW / 2 - 80, y - 22, 'No Job Description has been configured for this position.', 8, false, GREY_LIGHT);
      y -= 60;
    }

    // ── JD FOOTER ──
    this.hLine(ML, ML + TW, MB + 16, GREEN, 0.5);
    this.text(ML, MB + 6, `Job Description — ${emp.position || ''} | Generated on ${today} | KTEX System`, 6, false, GREY_LIGHT);

    // Flush last JD page
    this.pages.push(this.currentPageOps);
    this.currentPageOps = [];
  }

  toBuffer() {
    const objects = [];
    let id = 0;
    const add = (content) => { id++; objects.push({ id, content }); return id; };

    const f1 = add('<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>');
    const f2 = add('<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>');

    const pageIds = [];
    this.pages.forEach(ops => {
      const stream    = ops.join('\n');
      const streamBuf = Buffer.from(stream, 'latin1');
      const cid = add(`<</Length ${streamBuf.length}>>\nstream\n${stream}\nendstream`);
      const pid = add(
        `<</Type /Page /Parent 5 0 R /MediaBox [0 0 ${this.W} ${this.H}] ` +
        `/Contents ${cid} 0 R /Resources <</Font <</F1 ${f1} 0 R /F2 ${f2} 0 R>>>>>>`
      );
      pageIds.push(`${pid} 0 R`);
    });

    const gid = add(`<</Type /Pages /Kids [${pageIds.join(' ')}] /Count ${this.pages.length}>>`);
    const cat = add(`<</Type /Catalog /Pages ${gid} 0 R>>`);

    const header = Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1');
    const parts  = [header];
    const xrefOffsets = [];
    let off = header.length;

    objects.forEach((obj) => {
      xrefOffsets.push(off);
      const chunk = Buffer.from(`${obj.id} 0 obj\n${obj.content}\nendobj\n`, 'latin1');
      parts.push(chunk);
      off += chunk.length;
    });

    const xrefStart = off;
    let xref = `xref\n0 ${id + 1}\n0000000000 65535 f \n`;
    xrefOffsets.forEach(o => { xref += String(o).padStart(10, '0') + ' 00000 n \n'; });
    parts.push(Buffer.from(xref, 'latin1'));

    const trailer = `trailer\n<</Size ${id + 1} /Root ${cat} 0 R>>\nstartxref\n${xrefStart}\n%%EOF\n`;
    parts.push(Buffer.from(trailer, 'latin1'));

    return Buffer.concat(parts);
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId is required' },
        { status: 400 }
      );
    }

    // Populate position so we have both _id and all JD fields
    const employee = await Employee.findById(employeeId).populate('position');
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const positionDoc = employee.position; // full Position document (with JD fields)

    const posMap = positionDoc
      ? await PositionTopicMap.findOne({ position: positionDoc._id })
          .populate({ path: 'topicIds', populate: { path: 'trainer', select: 'name' } })
      : null;

    const allTopics = posMap?.topicIds || [];

    if (allTopics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            `No training topics are assigned for position "${positionDoc?.name || '(none)'}". ` +
            'Please configure the Position → Topics mapping first.',
        },
        { status: 400 }
      );
    }

    // ── Attendance lookup ──
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const attendances = await Attendance.find({
      employeeId: employee._id,
      attended: true,
    });

    const schedules = await Schedule.find({})
      .populate('topicIds')
      .populate('trainer', 'name email role');

    const completedTopicIds = new Set();
    const topicDateMap = {};

    attendances.forEach((att) => {
      const sch = schedules.find(
        (s) => s._id.toString() === att.scheduleId?.toString()
      );
      if (!sch || new Date(sch.date) < threeMonthsAgo) return;
      sch.topicIds.forEach((t) => {
        const tid = t._id.toString();
        completedTopicIds.add(tid);
        if (!topicDateMap[tid]) {
          topicDateMap[tid] = new Date(sch.date).toLocaleDateString('en-GB');
        }
      });
    });

    // ── Build rows ──
    const rows = allTopics
      .map((t) => {
        const tid = t._id.toString();
        const matchedSchedule = schedules.find(s =>
          completedTopicIds.has(tid) &&
          s.topicIds.some(st => (st._id || st).toString() === tid)
        );
        return {
          topic:        t.topic,
          dept:         t.department,
          duration:     t.duration || '',
          trainerName:  t.trainer?.name || matchedSchedule?.trainer?.name || '',
          attended:     completedTopicIds.has(tid),
          attendedDate: topicDateMap[tid] || '',
        };
      })
      .sort((a, b) => {
        if (a.attended !== b.attended) return a.attended ? -1 : 1;
        return a.topic.localeCompare(b.topic);
      });

    const stats = {
      total:    rows.length,
      attended: rows.filter((r) => r.attended).length,
      pending:  rows.filter((r) => !r.attended).length,
    };

    // ── Build PDF ──
    const pdf = new TrainingPDF();

    // Page(s) 1+: training table
    const docNo = pdf.generateTraining(
      {
        name:       employee.name,
        department: employee.department,
        position:   positionDoc?.name || '',
      },
      rows,
      stats
    );

    // Last page: JD
    pdf.generateJD(
      {
        name:       employee.name,
        department: employee.department,
        position:   positionDoc?.name || '',
      },
      positionDoc || {},   // pass full position doc (includes JD fields)
      docNo
    );

    const pdfBytes = pdf.toBuffer();

    const safeName = employee.name.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    const filename  = `Training-Program-${safeName}.pdf`;

    return new Response(pdfBytes, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBytes.length),
        'Cache-Control':       'no-store',
      },
    });
  } catch (error) {
    console.error('Training PDF error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}