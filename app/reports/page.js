// app/reports/page.js
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Download } from 'lucide-react';
import { UNIVERSAL_DEPARTMENTS } from '@/constants/appConstants';

const doesTopicApplyToEmployee = (topic, employee) => {
    if (UNIVERSAL_DEPARTMENTS.includes(topic.department)) {
        return true;
    }
    return topic.department === employee.department;
};

// Helper function to format dates as DD/MM/YYYY
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

export default function ReportsPage() {
    const [employees, setEmployees] = useState([]);
    const [topics, setTopics] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchEmployees(),
            fetchTopics(),
            fetchSchedules(),
            fetchAttendances(),
        ]);
        setLoading(false);
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            if (data.success) setEmployees(data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchTopics = async () => {
        try {
            const res = await fetch('/api/topics');
            const data = await res.json();
            if (data.success) setTopics(data.data);
        } catch (error) {
            console.error('Error fetching topics:', error);
        }
    };

    const fetchSchedules = async () => {
        try {
            const res = await fetch('/api/schedules');
            const data = await res.json();
            if (data.success) setSchedules(data.data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    const fetchAttendances = async () => {
        try {
            const res = await fetch('/api/attendances');
            const data = await res.json();
            if (data.success) setAttendances(data.data);
        } catch (error) {
            console.error('Error fetching attendances:', error);
        }
    };

    const generateEmployeeReport = () => {
        const report = employees.map(emp => {
            const empAttendances = attendances.filter(a =>
                (a.employeeId?._id || a.employeeId) === emp._id && a.attended
            );

            const completedTrainings = empAttendances.map(att => {
                const schedule = schedules.find(s => s._id === (att.scheduleId?._id || att.scheduleId));
                return {
                    topic: schedule?.topicIds?.map(t => t.topic).join(', ') || 'Unknown',
                    date: schedule ? formatDate(schedule.date) : 'N/A',
                    rating: att.rating
                };
            });

            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            const recentTopicIds = empAttendances
                .filter(a => {
                    const schedule = schedules.find(s => s._id === (a.scheduleId?._id || a.scheduleId));
                    return schedule && new Date(schedule.date) >= threeMonthsAgo;
                })
                .map(a => {
                    const schedule = schedules.find(s => s._id === (a.scheduleId?._id || a.scheduleId));
                    return schedule?.topicIds?.map(t => t._id);
                })
                .flat();

            const applicableTopics = topics.filter(t => doesTopicApplyToEmployee(t, emp));
            const pendingTopics = applicableTopics.filter(t => !recentTopicIds.includes(t._id));

            return {
                employeeName: emp.name,
                department: emp.department,
                completedTrainings,
                pendingTopics: pendingTopics.map(t => `${t.topic} (${t.department})`)
            };
        });

        return report;
    };

    const exportEmployeeReport = () => {
        const report = generateEmployeeReport();
        const rows = [];

        report.forEach(emp => {
            if (emp.completedTrainings.length > 0) {
                emp.completedTrainings.forEach((training, idx) => {
                    rows.push([
                        idx === 0 ? emp.employeeName : '',
                        idx === 0 ? emp.department : '',
                        training.topic,
                        training.date,
                        training.rating,
                        idx === 0 ? emp.pendingTopics.join('; ') : ''
                    ]);
                });
            } else {
                rows.push([
                    emp.employeeName,
                    emp.department,
                    'No trainings completed',
                    '-',
                    '-',
                    emp.pendingTopics.join('; ')
                ]);
            }
        });

        const headers = ["Employee Name", "Department", "Training Topic", "Date Completed", "Rating", "Pending Topics"];
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        downloadCSV(csvContent, `employee-training-report-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const generateMonthlyReport = () => {
        const monthlyData = {};

        schedules.forEach(schedule => {
            const date = new Date(schedule.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = [];
            }

            const topics = schedule.topicIds;
            const assignedEmps = schedule.employeeIds || [];
            const scheduleAttendances = attendances.filter(a =>
                (a.scheduleId?._id || a.scheduleId) === schedule._id
            );
            const attendedRecords = scheduleAttendances.filter(a => a.attended);
            const avgRating = attendedRecords.length > 0
                ? (attendedRecords.reduce((sum, a) => sum + a.rating, 0) / attendedRecords.length).toFixed(1)
                : 'N/A';

            monthlyData[monthKey].push({
                date: formatDate(date),
                topics: topics.map(t => t.topic).join(', '),
                trainer: schedule.trainerName || 'N/A',
                departments: [...new Set(topics.map(t => t.department))].join(', '),
                totalParticipants: assignedEmps.length,
                attended: attendedRecords.length,
                attendanceRate: assignedEmps.length > 0
                    ? ((attendedRecords.length / assignedEmps.length) * 100).toFixed(0) + '%'
                    : '0%',
                avgRating
            });
        });

        return monthlyData;
    };

    const exportMonthlyReport = () => {
        const monthlyData = generateMonthlyReport();
        const rows = [];

        Object.keys(monthlyData).sort().reverse().forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            rows.push([monthName, '', '', '', '', '', '', '']);

            monthlyData[month].forEach(training => {
                rows.push([
                    '',
                    training.date,
                    training.topics,
                    training.trainer,
                    training.departments,
                    training.totalParticipants,
                    training.attended,
                    training.attendanceRate,
                    training.avgRating
                ]);
            });

            rows.push(['', '', '', '', '', '', '', '']);
        });

        const headers = ["Month", "Date", "Training Topics", "Trainer", "Departments", "Total Participants", "Attended", "Attendance Rate", "Avg Rating"];
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        downloadCSV(csvContent, `monthly-training-report-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const generateDateRangeReport = () => {
        if (!dateRange.from || !dateRange.to) {
            alert('Please select both start and end dates.');
            return null;
        }

        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        const filteredSchedules = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= fromDate && scheduleDate <= toDate;
        });

        if (filteredSchedules.length === 0) {
            alert('No training schedules found in the selected date range.');
            return null;
        }

        const report = [];
        const allEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));

        allEmployees.forEach(emp => {
            filteredSchedules.forEach(schedule => {
                const scheduleDate = formatDate(schedule.date);
                const topics = schedule.topicIds?.map(t => t.topic).join(', ') || 'Unknown Topic';
                const trainerName = schedule.trainerName || 'N/A';

                const wasInvited = schedule.employeeIds?.some(e => (e._id || e) === emp._id);
                const invitedStatus = wasInvited ? 'Yes' : 'No';

                let attendanceStatus = 'N/A';
                if (wasInvited) {
                    const attendance = attendances.find(a =>
                        (a.scheduleId?._id || a.scheduleId) === schedule._id &&
                        (a.employeeId?._id || a.employeeId) === emp._id
                    );

                    if (attendance) {
                        attendanceStatus = attendance.attended ? 'Present' : 'Absent';
                    } else {
                        attendanceStatus = 'Not Marked';
                    }
                }

                // Only add to report if attendance status is not N/A
                if (attendanceStatus !== 'N/A') {
                    report.push({
                        employeeName: emp.name,
                        department: emp.department,
                        trainingDate: scheduleDate,
                        trainingTopic: topics,
                        trainer: trainerName,
                        invited: invitedStatus,
                        attendance: attendanceStatus
                    });
                }
            });
        });

        return report;
    };

    const exportDateRangeReport = () => {
        const report = generateDateRangeReport();
        if (!report || report.length === 0) return;

        const headers = [
            "Employee Name",
            "Department",
            "Training Date",
            "Training Topic",
            "Trainer",
            "Invited",
            "Attendance Status"
        ];

        const csvContent = [
            headers.join(','),
            ...report.map(row => [
                `"${row.employeeName}"`,
                `"${row.department}"`,
                `"${row.trainingDate}"`,
                `"${row.trainingTopic.replace(/"/g, '""')}"`,
                `"${row.trainer}"`,
                `"${row.invited}"`,
                `"${row.attendance}"`
            ].join(','))
        ].join('\n');

        downloadCSV(csvContent, `training-attendance-report-${dateRange.from}-to-${dateRange.to}.csv`);
    };

    const generateRefresherTrainingReport = () => {
        const refresherPeriodDays = 90;
        const today = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(today.getDate() - refresherPeriodDays);

        const report = [];

        employees.forEach(emp => {
            const applicableTopics = topics.filter(t => doesTopicApplyToEmployee(t, emp));

            applicableTopics.forEach(topic => {
                const topicAttendances = attendances.filter(a => {
                    if ((a.employeeId?._id || a.employeeId) !== emp._id || !a.attended) {
                        return false;
                    }

                    const schedule = schedules.find(s => s._id === (a.scheduleId?._id || a.scheduleId));
                    if (!schedule) return false;

                    const scheduleTopics = schedule.topicIds || [];
                    return scheduleTopics.some(t => (t._id || t) === topic._id);
                }).map(a => {
                    const schedule = schedules.find(s => s._id === (a.scheduleId?._id || a.scheduleId));
                    return {
                        date: schedule ? new Date(schedule.date) : null,
                        rating: a.rating
                    };
                }).filter(a => a.date !== null)
                    .sort((a, b) => b.date - a.date);

                if (topicAttendances.length === 0) {
                    report.push({
                        employeeName: emp.name,
                        department: emp.department,
                        topic: `${topic.topic} (${topic.department})`,
                        lastTrainingDate: 'Never',
                        daysSinceLastTraining: 'N/A',
                        status: 'Initial Training Required',
                        priority: 'High',
                        lastRating: 'N/A'
                    });
                } else {
                    const lastAttendance = topicAttendances[0];
                    const daysSinceLast = Math.floor((today - lastAttendance.date) / (1000 * 60 * 60 * 24));

                    if (daysSinceLast > refresherPeriodDays) {
                        const daysOverdue = daysSinceLast - refresherPeriodDays;
                        report.push({
                            employeeName: emp.name,
                            department: emp.department,
                            topic: topic.topic,
                            lastTrainingDate: formatDate(lastAttendance.date),
                            daysSinceLastTraining: daysSinceLast,
                            status: `Overdue by ${daysOverdue} days`,
                            priority: daysOverdue > 30 ? 'Critical' : 'High',
                            lastRating: lastAttendance.rating
                        });
                    } else if (daysSinceLast > (refresherPeriodDays - 30)) {
                        const daysUntilDue = refresherPeriodDays - daysSinceLast;
                        report.push({
                            employeeName: emp.name,
                            department: emp.department,
                            topic: topic.topic,
                            lastTrainingDate: formatDate(lastAttendance.date),
                            daysSinceLastTraining: daysSinceLast,
                            status: `Due in ${daysUntilDue} days`,
                            priority: 'Medium',
                            lastRating: lastAttendance.rating
                        });
                    }
                }
            });
        });

        const priorityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3 };
        report.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.employeeName.localeCompare(b.employeeName);
        });

        return report;
    };

    const exportRefresherTrainingReport = () => {
        const report = generateRefresherTrainingReport();

        if (report.length === 0) {
            alert('✅ Great! All employees are up-to-date with their refresher trainings.');
            return;
        }

        const headers = [
            "Employee Name",
            "Department",
            "Training Topic",
            "Last Training Date",
            "Days Since Last Training",
            "Status",
            "Priority",
            "Last Rating"
        ];

        const csvContent = [
            headers.join(','),
            ...report.map(row => [
                `"${row.employeeName}"`,
                `"${row.department}"`,
                `"${row.topic.replace(/"/g, '""')}"`,
                `"${row.lastTrainingDate}"`,
                `"${row.daysSinceLastTraining}"`,
                `"${row.status}"`,
                `"${row.priority}"`,
                `"${row.lastRating}"`
            ].join(','))
        ].join('\n');

        downloadCSV(csvContent, `refresher-training-report-${new Date().toISOString().split('T')[0]}.csv`);
        alert(`Report generated with ${report.length} training requirements.`);
    };

    const downloadCSV = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold mb-6">Training Reports</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={exportEmployeeReport}
                            className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition text-left"
                        >
                            <div className="flex items-start gap-3">
                                <Download className="w-6 h-6 text-blue-600 mt-1" />
                                <div>
                                    <div className="font-semibold text-lg text-blue-900">📊 Employee-wise Training Report</div>
                                    <div className="text-sm text-blue-700 mt-1">Completed & pending trainings per employee</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={exportMonthlyReport}
                            className="p-6 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition text-left"
                        >
                            <div className="flex items-start gap-3">
                                <Download className="w-6 h-6 text-purple-600 mt-1" />
                                <div>
                                    <div className="font-semibold text-lg text-purple-900">📅 Monthly Training Report</div>
                                    <div className="text-sm text-purple-700 mt-1">Monthly schedule, attendance & ratings summary</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setShowDateRangeModal(true)}
                            className="p-6 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 transition text-left"
                        >
                            <div className="flex items-start gap-3">
                                <Download className="w-6 h-6 text-orange-600 mt-1" />
                                <div>
                                    <div className="font-semibold text-lg text-orange-900">📋 Date Range Attendance Report</div>
                                    <div className="text-sm text-orange-700 mt-1">Employee-wise invitation & attendance by date range</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={exportRefresherTrainingReport}
                            className="p-6 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition text-left"
                        >
                            <div className="flex items-start gap-3">
                                <Download className="w-6 h-6 text-red-600 mt-1" />
                                <div>
                                    <div className="font-semibold text-lg text-red-900">🔄 Refresher Training Report (90-Day Cycle)</div>
                                    <div className="text-sm text-red-700 mt-1">Overdue & upcoming refresher trainings</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Date Range Modal */}
                {showDateRangeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-2xl font-bold mb-4">Select Date Range</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> This report shows all employees, their invitation status,
                                        and attendance for all trainings within the selected date range.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        exportDateRangeReport();
                                        setShowDateRangeModal(false);
                                        setDateRange({ from: '', to: '' });
                                    }}
                                    className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
                                >
                                    Generate Report
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDateRangeModal(false);
                                        setDateRange({ from: '', to: '' });
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}