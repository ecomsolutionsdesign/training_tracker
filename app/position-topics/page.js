// app/position-topics/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Search, Save, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { POSITIONS, DEPARTMENTS } from '@/constants/appConstants';

export default function PositionTopicsPage() {
  const [topics, setTopics] = useState([]);
  const [mappings, setMappings] = useState({}); // { position: [topicId, ...] }
  const [selectedPosition, setSelectedPosition] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState({});

  // ── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchTopics();
    fetchMappings();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/topics');
      const data = await res.json();
      if (data.success) setTopics(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/position-topics');
      const data = await res.json();
      if (data.success) {
        const m = {};
        data.data.forEach((map) => {
          m[map.position] = map.topicIds.map((t) => t._id || t);
        });
        setMappings(m);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Selected position's topic IDs ─────────────────────────────────────────

  const selectedTopicIds = useMemo(
    () => (selectedPosition ? mappings[selectedPosition] || [] : []),
    [selectedPosition, mappings]
  );

  const toggleTopic = (topicId) => {
    setMappings((prev) => {
      const current = prev[selectedPosition] || [];
      const next = current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId];
      return { ...prev, [selectedPosition]: next };
    });
  };

  const selectAll = () => {
    const all = filteredTopics.map((t) => t._id);
    setMappings((prev) => {
      const current = prev[selectedPosition] || [];
      const merged = [...new Set([...current, ...all])];
      return { ...prev, [selectedPosition]: merged };
    });
  };

  const clearAll = () => {
    setMappings((prev) => ({ ...prev, [selectedPosition]: [] }));
  };

  // ── Save mapping ──────────────────────────────────────────────────────────

  const saveMapping = async () => {
    if (!selectedPosition) return;
    try {
      setSaving(true);
      const res = await fetch('/api/position-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: selectedPosition,
          topicIds: mappings[selectedPosition] || [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Mapping saved for "${selectedPosition}"`);
        await fetchMappings();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save mapping.');
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered helpers ──────────────────────────────────────────────────────

  const filteredPositions = POSITIONS.filter((p) =>
    p.toLowerCase().includes(positionSearch.toLowerCase())
  );

  const filteredTopics = useMemo(() => {
    let result = topics;
    if (deptFilter !== 'All') result = result.filter((t) => t.department === deptFilter);
    if (topicSearch) {
      const s = topicSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.topic.toLowerCase().includes(s) ||
          t.department.toLowerCase().includes(s)
      );
    }
    return result;
  }, [topics, deptFilter, topicSearch]);

  // Group by department for display
  const groupedTopics = useMemo(() => {
    const groups = {};
    filteredTopics.forEach((t) => {
      if (!groups[t.department]) groups[t.department] = [];
      groups[t.department].push(t);
    });
    return groups;
  }, [filteredTopics]);

  const toggleDept = (dept) =>
    setExpandedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));

  // ── Stats ─────────────────────────────────────────────────────────────────

  const selectedCount = selectedTopicIds.length;
  const totalCount = filteredTopics.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Position → Training Topics</h1>
          <p className="text-gray-600 mt-1">
            Assign required training topics to each job position. New employees inherit these
            topics automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Position list ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold mb-3">Job Positions</h2>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search positions…"
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
                className="w-full px-3 py-2 pl-8 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-1 max-h-130 overflow-y-auto pr-1">
              {filteredPositions.map((pos) => {
                const count = (mappings[pos] || []).length;
                const isSelected = pos === selectedPosition;
                return (
                  <button
                    key={pos}
                    onClick={() => setSelectedPosition(pos)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex justify-between items-center ${
                      isSelected
                        ? 'bg-green-700 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="truncate">{pos}</span>
                    {count > 0 && (
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right: Topic assignment ───────────────────────────────────── */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-4">
            {!selectedPosition ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <CheckSquare className="w-16 h-16 mb-3 opacity-30" />
                <p className="text-lg font-medium">Select a position</p>
                <p className="text-sm mt-1">Choose a job position on the left to assign topics.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedPosition}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedCount} of {totalCount} topics selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAll}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={saveMapping}
                      disabled={saving}
                      className="px-4 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-4 flex-wrap">
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <div className="relative grow max-w-xs">
                    <input
                      type="text"
                      placeholder="Search topics…"
                      value={topicSearch}
                      onChange={(e) => setTopicSearch(e.target.value)}
                      className="w-full px-3 py-2 pl-8 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${totalCount > 0 ? (selectedCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Topics grouped by department */}
                <div className="space-y-2 max-h-107 overflow-y-auto pr-1">
                  {Object.keys(groupedTopics).sort().map((dept) => {
                    const deptTopics = groupedTopics[dept];
                    const isExpanded = expandedDepts[dept] !== false; // default expanded
                    const deptSelected = deptTopics.filter((t) =>
                      selectedTopicIds.includes(t._id)
                    ).length;

                    return (
                      <div key={dept} className="border rounded-lg overflow-hidden">
                        {/* Dept header */}
                        <button
                          onClick={() => toggleDept(dept)}
                          className="w-full flex justify-between items-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700"
                        >
                          <span>{dept}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {deptSelected}/{deptTopics.length} selected
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {/* Topics */}
                        {isExpanded && (
                          <div className="divide-y divide-gray-100">
                            {deptTopics.map((topic) => {
                              const checked = selectedTopicIds.includes(topic._id);
                              return (
                                <label
                                  key={topic._id}
                                  className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-green-50 transition"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleTopic(topic._id)}
                                    className="w-4 h-4 mt-0.5 text-green-600 focus:ring-green-500 rounded shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {topic.topic}
                                    </p>
                                    <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                                      {topic.duration && <span>⏱ {topic.duration}</span>}
                                      {topic.trainerName && <span>👤 {topic.trainerName}</span>}
                                    </div>
                                  </div>
                                  {checked && (
                                    <span className="text-green-600 text-xs font-medium shrink-0">
                                      ✓
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredTopics.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No topics found matching the current filters.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {POSITIONS.slice(0, 8).map((pos) => {
            const count = (mappings[pos] || []).length;
            return (
              <div
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer border-2 transition ${
                  selectedPosition === pos
                    ? 'border-green-500'
                    : 'border-transparent hover:border-green-200'
                }`}
              >
                <p className="text-sm font-medium text-gray-700 truncate">{pos}</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{count}</p>
                <p className="text-xs text-gray-500">topics assigned</p>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}