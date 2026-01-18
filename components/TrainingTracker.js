//components/TrainingTracker.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, BookOpen, CheckCircle, Download, Plus, Edit2, Trash2, Clock, TrendingUp, Search } from 'lucide-react'; // Added Search icon
import { DEPARTMENTS, ROLES, RATINGS, UNIVERSAL_DEPARTMENTS } from '@/constants/appConstants';

// Helper function to check if a topic applies to an employee
const doesTopicApplyToEmployee = (topic, employee) => {
    // Universal topics apply to everyone
    if (UNIVERSAL_DEPARTMENTS.includes(topic.department)) {
        return true;
    }
    // Department-specific topics only apply to that department
    return topic.department === employee.department;
};

export default function TrainingTracker() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [employees, setEmployees] = useState([]);
    const [topics, setTopics] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [attendances, setAttendances] = useState([]);
    const [pendingData, setPendingData] = useState([]);
    const [selectedDept, setSelectedDept] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedScheduleDetail, setSelectedScheduleDetail] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [employeeForm, setEmployeeForm] = useState({ name: '', department: '', role: 'user' });
    const [topicForm, setTopicForm] = useState({ topic: '', department: '' });
    const [scheduleForm, setScheduleForm] = useState({ date: '', topicIds: [], trainerName: '', employeeIds: [] });
    const [attendanceForm, setAttendanceForm] = useState({ scheduleId: '' });
    const [bulkAttendanceRecords, setBulkAttendanceRecords] = useState([]);
    const [topicSearchTerm, setTopicSearchTerm] = useState('');
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectAllTopics, setSelectAllTopics] = useState(false);
    const [selectAllEmployees, setSelectAllEmployees] = useState(false);
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [selectAllAttendance, setSelectAllAttendance] = useState(false);
    // Header Component
    const Header = ({ activeTab, setActiveTab }) => {
        return (
            <div className="bg-linear-to-r from-green-900 to-green-700 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-8xl mx-auto px-2 py-2">
                    {/* Title */}
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-8 h-8" />
                        <h1 className="text-3xl font-bold">
                            Employee Training Management System
                        </h1>


                        {/* Navigation Tabs */}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'dashboard'
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                                    }`}
                            >
                                <TrendingUp className="w-4 h-4 inline mr-2" />Dashboard
                            </button>
                            <button
                                onClick={() => setActiveTab('employees')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'employees'
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                                    }`}
                            >
                                <Users className="w-4 h-4 inline mr-2" />Employees
                            </button>
                            <button
                                onClick={() => setActiveTab('topics')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'topics'
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4 inline mr-2" />Topics
                            </button>
                            <button
                                onClick={() => setActiveTab('schedules')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'schedules'
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                                    }`}
                            >
                                <Calendar className="w-4 h-4 inline mr-2" />Schedules
                            </button>
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'attendance'
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4 inline mr-2" />Attendance
                            </button>
                            <button
                                onClick={() => { setActiveTab('pending'); }}
                                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'pending'
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                                    }`}
                            >
                                <Clock className="w-4 h-4 inline mr-2" />Pending
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Footer Component
    const Footer = () => {
        return (
            <footer className="bg-linear-to-r from-green-900 to-green-700 text-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                        <p className="text-sm">
                            © {new Date().getFullYear()} Employee Training Management System. All rights reserved.
                        </p>
                        <p className="text-sm">
                            Developed by <span className="font-semibold">Mustanshir Vohra</span>
                        </p>
                    </div>
                </div>
            </footer>
        );
    };

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        if (activeTab === 'employees') fetchEmployees(selectedDept);
        else if (activeTab === 'topics') fetchTopics(selectedDept);
        else if (activeTab === 'pending') fetchPending(selectedDept);
    }, [selectedDept, activeTab]);

    useEffect(() => {
        if (attendanceForm.scheduleId && modalType === 'attendance') {
            const assignedEmployees = getAssignedEmployeesForSchedule(attendanceForm.scheduleId);
            const records = assignedEmployees.map(emp => {
                const existingAtt = attendances.find(
                    a => String(a.scheduleId?._id || a.scheduleId) === String(attendanceForm.scheduleId) &&
                        String(a.employeeId?._id || a.employeeId) === emp._id
                );
                return {
                    employeeId: emp._id,
                    employeeName: emp.name,
                    employeeDept: emp.department,
                    attended: existingAtt?.attended || false,
                    rating: existingAtt?.rating || 5,
                    attendanceRecordId: existingAtt?._id || null,
                };
            });
            setBulkAttendanceRecords(records);
        } else if (modalType !== 'attendance') {
            setBulkAttendanceRecords([]);
        }
    }, [attendanceForm.scheduleId, employees, attendances, modalType]);



    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchEmployees(),
            fetchTopics(),
            fetchSchedules(),
            fetchAttendances(),
            fetchPending(),
        ]);
        setLoading(false);
    };

    const fetchEmployees = async (department = 'All') => {
        try {
            const url = department !== 'All' ? `/api/employees?department=${department}` : '/api/employees';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setEmployees(data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchTopics = async (department = 'All') => {
        try {
            const url = department !== 'All' ? `/api/topics?department=${department}` : '/api/topics';
            const res = await fetch(url);
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

    const fetchPending = async (department = 'All') => {
        try {
            const url = department !== 'All' ? `/api/pending?department=${department}` : '/api/pending';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setPendingData(data.data);
        } catch (error) {
            console.error('Error fetching pending:', error);
        }
    };

    const handleSelectAllAttendance = (e) => {
        const checked = e.target.checked;
        setSelectAllAttendance(checked);
        setBulkAttendanceRecords(prev =>
            prev.map(record => ({
                ...record,
                attended: checked
            }))
        );
    };

    const openModal = (type, item = null) => {
        setModalType(type);
        setEditItem(item);

        if (type === 'employee') {
            setEmployeeForm(item ? { name: item.name, department: item.department, role: item.role } : { name: '', department: '', role: 'user' });
        } else if (type === 'topic') {
            setTopicForm(item ? { topic: item.topic, department: item.department || '' } : { topic: '', department: '' });
        } else if (type === 'schedule') {
            if (item) {
                const scheduleDate = new Date(item.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Check if trying to edit a past schedule
                if (scheduleDate < today) {
                    alert('⚠️ Cannot edit past training schedules. You can only modify today or future schedules.');
                    return;
                }
            }

            setScheduleForm(item ? {
                date: new Date(item.date).toISOString().split('T')[0],
                topicIds: item.topicIds?.map(t => t._id || t) || [],
                trainerName: item.trainerName || '',
                employeeIds: item.employeeIds?.map(e => e._id || e) || []
            } : { date: '', topicIds: [], trainerName: '', employeeIds: [] });
        } else if (type === 'attendance') {
            const schedule = item?.scheduleId ? schedules.find(s => s._id === (item.scheduleId._id || item.scheduleId)) : item;

            if (schedule && !canMarkAttendance(schedule.date)) {
                alert('⚠️ Cannot mark attendance for future training schedules. You can only mark attendance on or after the scheduled date.');
                return;
            }

            const scheduleId = item?.scheduleId || item?._id || '';
            setAttendanceForm({ scheduleId });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setEmployeeForm({ name: '', department: '', role: 'user' });
        setTopicForm({ topic: '', department: '' });
        setScheduleForm({ date: '', topicIds: [], trainerName: '', employeeIds: [] });
        setAttendanceForm({ scheduleId: '' });
        setBulkAttendanceRecords([]);
        setTopicSearchTerm('');
        setEmployeeSearchTerm('');
        setSelectAllTopics(false); // ADDED
        setSelectAllEmployees(false); // ADDED
        setSelectAllAttendance(false); // Add this line with other resets
    };

    const canMarkAttendance = (scheduleDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const schedule = new Date(scheduleDate);
        schedule.setHours(0, 0, 0, 0);
        return schedule <= today; // Can only mark if schedule date is today or in the past
    };

    // ... after closeModal function (around line 140)
    const handleSelectAllTopics = (e) => {
        const checked = e.target.checked;
        setSelectAllTopics(checked);
        if (checked) {
            // Select all topics' IDs
            setScheduleForm(prevForm => ({
                ...prevForm,
                topicIds: topics.map(t => t._id)
            }));
        } else {
            // Deselect all topics
            setScheduleForm(prevForm => ({
                ...prevForm,
                topicIds: []
            }));
        }
    };

    const handleSelectAllEmployees = (e) => {
        const checked = e.target.checked;
        setSelectAllEmployees(checked);
        if (checked) {
            // Select all employees' IDs
            setScheduleForm(prevForm => ({
                ...prevForm,
                employeeIds: employees.map(e => e._id)
            }));
        } else {
            // Deselect all employees
            setScheduleForm(prevForm => ({
                ...prevForm,
                employeeIds: []
            }));
        }
    };

    const saveEmployee = async () => {
        try {
            setLoading(true);
            const method = editItem ? 'PUT' : 'POST';
            const url = editItem ? `/api/employees/${editItem._id}` : '/api/employees';

            const payload = {
                name: employeeForm.name,
                department: employeeForm.department,
                role: employeeForm.role
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                await fetchEmployees(selectedDept);
                closeModal();
            } else {
                alert(`Failed to save employee: ${data.error}`);
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Error saving employee. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const saveTopic = async () => {
        try {
            setLoading(true);
            const method = editItem ? 'PUT' : 'POST';
            const url = editItem ? `/api/topics/${editItem._id}` : '/api/topics';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(topicForm),
            });

            const data = await res.json();
            if (data.success) {
                await fetchTopics(selectedDept);
                closeModal();
            }
        } catch (error) {
            console.error('Error saving topic:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSchedule = async () => {
        // Validate date is not in the past
        const selectedDate = new Date(scheduleForm.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day for comparison

        if (selectedDate < today) {
            alert('❌ Cannot schedule training for a past date. Please select today or a future date.');
            return;
        }

        // Validate all required fields
        if (!scheduleForm.date || scheduleForm.topicIds.length === 0 || !scheduleForm.trainerName || scheduleForm.employeeIds.length === 0) {
            alert('⚠️ Please fill in all required fields:\n- Date\n- At least one topic\n- Trainer name\n- At least one employee');
            return;
        }
        try {
            setLoading(true);
            const method = editItem ? 'PUT' : 'POST';
            const url = editItem ? `/api/schedules/${editItem._id}` : '/api/schedules';

            const payload = {
                date: scheduleForm.date,
                topicIds: scheduleForm.topicIds,
                trainerName: scheduleForm.trainerName,
                employeeIds: scheduleForm.employeeIds,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                await fetchSchedules();
                closeModal();
                alert(`✅ Training schedule ${editItem ? 'updated' : 'created'} successfully!`);
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('❌ An error occurred while saving the schedule. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (type, id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            setLoading(true);
            let url = '';
            if (type === 'employee') url = `/api/employees/${id}`;
            else if (type === 'topic') url = `/api/topics/${id}`;
            else if (type === 'schedule') url = `/api/schedules/${id}`;
            else if (type === 'attendance') url = `/api/attendances/${id}`;

            const res = await fetch(url, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                if (type === 'employee') await fetchEmployees(selectedDept);
                else if (type === 'topic') await fetchTopics(selectedDept);
                else if (type === 'schedule') await fetchSchedules();
                else if (type === 'attendance') await fetchAttendances();
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveAttendance = async () => {
        if (!attendanceForm.scheduleId) {
            alert('Please select a schedule.');
            return;
        }

        console.log('🚀 Starting attendance save...');
        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const record of bulkAttendanceRecords) {
            const payload = {
                scheduleId: attendanceForm.scheduleId,
                employeeId: record.employeeId,
                attended: record.attended,
                rating: record.rating || 1,
            };

            try {
                let url;
                let method;

                if (record.attendanceRecordId) {
                    url = `/api/attendances/${record.attendanceRecordId}`;
                    method = 'PUT';
                } else {
                    url = '/api/attendances';
                    method = 'POST';
                }

                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (data.success) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`❌ FAILED for ${record.employeeName}:`, data.error);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ ERROR for ${record.employeeName}:`, error);
            }
        }

        if (errorCount > 0) {
            alert(`Attendance saved for ${successCount} employees.\n${errorCount} failed. Check console for details.`);
        } else {
            alert(`✅ Attendance successfully saved for ${successCount} employees!`);
        }

        await fetchAttendances();
        setLoading(false);
        closeModal();
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
                    date: schedule ? new Date(schedule.date).toLocaleDateString() : 'N/A',
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

            // CORRECTED: Use helper function for applicable topics
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

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employee-training-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
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
                date: date.toLocaleDateString(),
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

    const generateDateRangeReport = () => {
        if (!dateRange.from || !dateRange.to) {
            alert('Please select both start and end dates.');
            return;
        }

        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Include end of day

        // Filter schedules within date range
        const filteredSchedules = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= fromDate && scheduleDate <= toDate;
        });

        if (filteredSchedules.length === 0) {
            alert('No training schedules found in the selected date range.');
            return;
        }

        const report = [];

        // Get all unique employees
        const allEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));

        allEmployees.forEach(emp => {
            filteredSchedules.forEach(schedule => {
                const scheduleDate = new Date(schedule.date).toLocaleDateString();
                const topics = schedule.topicIds?.map(t => t.topic).join(', ') || 'Unknown Topic';
                const trainerName = schedule.trainerName || 'N/A';

                // Check if employee was invited
                const wasInvited = schedule.employeeIds?.some(e => (e._id || e) === emp._id);
                const invitedStatus = wasInvited ? 'Yes' : 'No';

                // Check attendance
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

                report.push({
                    employeeName: emp.name,
                    department: emp.department,
                    trainingDate: scheduleDate,
                    trainingTopic: topics,
                    trainer: trainerName,
                    invited: invitedStatus,
                    attendance: attendanceStatus
                });
            });
        });

        return report;
    };

    const exportDateRangeReport = () => {
        const report = generateDateRangeReport();

        if (!report || report.length === 0) {
            return;
        }

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

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-attendance-report-${dateRange.from}-to-${dateRange.to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateRefresherTrainingReport = () => {
        const refresherPeriodDays = 90;
        const today = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(today.getDate() - refresherPeriodDays);

        const report = [];

        employees.forEach(emp => {
            // Get all topics for employee's department
            // const departmentTopics = topics.filter(t => t.department === emp.department);
            const applicableTopics = topics.filter(t => doesTopicApplyToEmployee(t, emp));

            applicableTopics.forEach(topic => {
                // Find all attendances for this employee and topic
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
                    .sort((a, b) => b.date - a.date); // Sort by most recent first

                if (topicAttendances.length === 0) {
                    // Never attended - needs initial training
                    report.push({
                        employeeName: emp.name,
                        department: emp.department,
                        // topic: topic.topic,
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
                        // Overdue for refresher
                        const daysOverdue = daysSinceLast - refresherPeriodDays;
                        report.push({
                            employeeName: emp.name,
                            department: emp.department,
                            topic: topic.topic,
                            lastTrainingDate: lastAttendance.date.toLocaleDateString(),
                            daysSinceLastTraining: daysSinceLast,
                            status: `Overdue by ${daysOverdue} days`,
                            priority: daysOverdue > 30 ? 'Critical' : 'High',
                            lastRating: lastAttendance.rating
                        });
                    } else if (daysSinceLast > (refresherPeriodDays - 30)) {
                        // Due soon (within 30 days)
                        const daysUntilDue = refresherPeriodDays - daysSinceLast;
                        report.push({
                            employeeName: emp.name,
                            department: emp.department,
                            topic: topic.topic,
                            lastTrainingDate: lastAttendance.date.toLocaleDateString(),
                            daysSinceLastTraining: daysSinceLast,
                            status: `Due in ${daysUntilDue} days`,
                            priority: 'Medium',
                            lastRating: lastAttendance.rating
                        });
                    }
                }
            });
        });

        // Sort by priority: Critical > High > Medium
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

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `refresher-training-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        alert(`Report generated with ${report.length} training requirements.`);
    };


    const exportMonthlyReport = () => {
        const monthlyData = generateMonthlyReport();
        const rows = [];

        Object.keys(monthlyData).sort().reverse().forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            rows.push([monthName, '', '', '', '', '', '', '']); // Month header

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

            rows.push(['', '', '', '', '', '', '', '']); // Empty row between months
        });

        const headers = ["Month", "Date", "Training Topics", "Trainer", "Departments", "Total Participants", "Attended", "Attendance Rate", "Avg Rating"];
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monthly-training-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const updateBulkAttendanceRecord = (employeeId, field, value) => {
        setBulkAttendanceRecords(prev =>
            prev.map(record =>
                record.employeeId === employeeId ? { ...record, [field]: value } : record
            )
        );
    };

    const exportData = () => {
        const report = schedules.map(schedule => {
            const topics = schedule.topicIds;
            const assignedEmps = schedule.employeeIds || [];

            const scheduleAttendances = attendances.filter(a => (a.scheduleId?._id || a.scheduleId) === schedule._id);
            const attendedCount = scheduleAttendances.filter(a => a.attended).length;
            const totalRatingSum = scheduleAttendances.reduce((sum, a) => sum + a.rating, 0);
            const avgRating = scheduleAttendances.length > 0
                ? (totalRatingSum / scheduleAttendances.length).toFixed(1)
                : 'N/A';
            return {
                date: new Date(schedule.date).toLocaleDateString('en-US'),
                trainingTopic: topics?.map(t => t.topic).join(', ') || 'Unknown Topic',
                trainerName: schedule.trainerName || 'N/A',
                numberOfParticipants: assignedEmps.length,
                numberOfAttendees: attendedCount,
                averageRating: avgRating,
            };
        });
        const headers = ["Date", "Training Topic", "Trainer Name", "Number of Participants", "Number of Attendees", "Average Rating"];
        const csvContent = [
            headers.join(','),
            ...report.map(row =>
                [
                    row.date,
                    `"${row.trainingTopic.replace(/"/g, '""')}"`, // Handle commas/quotes in topic name
                    `"${row.trainerName.replace(/"/g, '""')}"`,
                    row.numberOfParticipants,
                    row.numberOfAttendees,
                    row.averageRating
                ].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getUpcomingSchedules = () => {
        const today = new Date().setHours(0, 0, 0, 0);
        return schedules
            .filter(s => new Date(s.date).setHours(0, 0, 0, 0) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5); // Show next 5 upcoming
    };

    const getSuggestedTopics = () => {
        // Count how many times each topic has been scheduled
        const scheduleCount = topics.reduce((acc, t) => ({ ...acc, [t._id]: 0 }), {});
        schedules.forEach(s => {
            s.topicIds?.forEach(topic => {
                const topicId = topic._id || topic;
                if (scheduleCount[topicId] !== undefined) {
                    scheduleCount[topicId]++;
                }
            });
        });

        // Calculate attendance stats for each topic
        const attendanceStats = topics.reduce((acc, t) => ({
            ...acc,
            [t._id]: { totalSchedules: 0, attendedSchedules: 0, avgAttendance: 0 }
        }), {});

        schedules.forEach(schedule => {
            const scheduleTopicIds = schedule.topicIds?.map(t => t._id || t) || [];
            const scheduleAttendances = attendances.filter(a =>
                (a.scheduleId?._id || a.scheduleId) === schedule._id
            );

            scheduleTopicIds.forEach(topicId => {
                if (attendanceStats[topicId]) {
                    attendanceStats[topicId].totalSchedules++;
                    // If any attendance is marked for this schedule, count it
                    if (scheduleAttendances.some(a => a.attended)) {
                        attendanceStats[topicId].attendedSchedules++;
                    }
                }
            });
        });

        // Calculate average attendance rate
        Object.keys(attendanceStats).forEach(topicId => {
            const stats = attendanceStats[topicId];
            stats.avgAttendance = stats.totalSchedules > 0
                ? (stats.attendedSchedules / stats.totalSchedules)
                : 0;
        });

        const topicData = topics
            .map(t => ({
                ...t,
                scheduleCount: scheduleCount[t._id] || 0,
                avgAttendance: attendanceStats[t._id]?.avgAttendance || 0,
                hasAttendance: attendanceStats[t._id]?.attendedSchedules > 0
            }))
            // Filter out topics that have been scheduled AND have attendance marked
            .filter(t => !(t.scheduleCount > 0 && t.hasAttendance));

        return topicData
            .sort((a, b) => a.scheduleCount - b.scheduleCount || a.avgAttendance - b.avgAttendance)
            .slice(0, 5);
    };

    const getDashboardStats = () => {
        const totalSchedules = schedules.length;
        const completedTrainings = attendances.filter(a => a.attended).length;
        const avgRating = attendances.length > 0
            ? (attendances.reduce((sum, a) => sum + a.rating, 0) / attendances.length).toFixed(1)
            : 0;

        // Count unique pending topics across all departments
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Get all topic IDs that have been completed in last 3 months
        const recentlyCompletedTopicIds = new Set();
        attendances.forEach(a => {
            if (!a.attended) return;
            const schedule = schedules.find(s => s._id === (a.scheduleId?._id || a.scheduleId));
            if (!schedule) return;
            const scheduleDate = new Date(schedule.date);
            if (scheduleDate >= threeMonthsAgo) {
                // Add all topics from this schedule
                schedule.topicIds?.forEach(topic => {
                    recentlyCompletedTopicIds.add(topic._id || topic);
                });
            }
        });

        // Count topics that haven't been completed recently
        const pendingCount = topics.filter(t => !recentlyCompletedTopicIds.has(t._id)).length;

        return { totalSchedules, completedTrainings, avgRating, pendingCount };
    };

    const stats = getDashboardStats();
    const upcomingSchedules = getUpcomingSchedules();
    const suggestedTopics = getSuggestedTopics();
    const filteredEmployees = useMemo(() => {
        let result = selectedDept === 'All'
            ? employees
            : employees.filter(e => e.department === selectedDept);

        if (searchTerm) {
            result = result.filter(e =>
                e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.department.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return result;
    }, [employees, selectedDept, searchTerm]);

    const filteredTopics = useMemo(() => {
        let result = selectedDept === 'All'
            ? topics
            : topics.filter(t => t.department === selectedDept);

        if (searchTerm) {
            result = result.filter(t =>
                t.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.department.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return result;
    }, [topics, selectedDept, searchTerm]);

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            const topicMatches = s.topicIds?.some(t => t.topic?.toLowerCase().includes(searchTerm.toLowerCase()));
            const deptMatches = selectedDept === 'All' || s.topicIds?.some(t => t.department === selectedDept);
            return topicMatches && deptMatches;
        });
    }, [schedules, selectedDept, searchTerm]);

    const getAssignedEmployeesForSchedule = (scheduleId) => {
        const schedule = schedules.find(s => s._id === scheduleId);
        if (!schedule || !schedule.employeeIds) return [];
        const assignedIds = schedule.employeeIds.map(e => e._id || e);
        return employees.filter(emp => assignedIds.includes(emp._id));
    }

    const openDetailModal = (schedule) => {
        setSelectedScheduleDetail(schedule);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedScheduleDetail(null);
    };

    const filteredModalTopics = useMemo(() => {
        return topics.filter(t =>
            t.topic.toLowerCase().includes(topicSearchTerm.toLowerCase()) ||
            t.department.toLowerCase().includes(topicSearchTerm.toLowerCase())
        );
    }, [topics, topicSearchTerm]);

    const filteredModalEmployees = useMemo(() => {
        return employees.filter(e =>
            e.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
            e.department.toLowerCase().includes(employeeSearchTerm.toLowerCase())
        );
    }, [employees, employeeSearchTerm]);

    if (loading && employees.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-700 mx-auto"></div> {/* Theme change */}
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const isAttendanceMarked = (scheduleId) => {
        return attendances.some(a => (a.scheduleId?._id || a.scheduleId) === scheduleId);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="grow">
                <div className="max-w-7xl mx-auto p-6">

                    {/* Department Filter, Search & Export (existing code from line 839) */}
                    {activeTab !== 'dashboard' && (
                        <div className="mb-6 flex gap-4 items-center flex-wrap">
                            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="px-4 py-2 border rounded-lg bg-white">
                                <option value="All">All Departments</option>
                                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                            </select>

                            {(activeTab === 'employees' || activeTab === 'topics' || activeTab === 'schedules' || activeTab === 'attendance' || activeTab === 'pending') && (
                                <div className="relative grow max-w-sm">
                                    <input
                                        type="text"
                                        // placeholder={`Search in ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}...`}
                                        placeholder={activeTab === 'pending'
                                            ? 'Search by employee name, department, or topic...'
                                            : `Search in ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}...`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                                    />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                </div>
                            )}
                            <div className="relative">
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Reports
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'dashboard' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-600 text-sm">Total Schedules</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalSchedules}</p>
                                    </div>
                                    <Calendar className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-lime-600">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-600 text-sm">No. of Employees Attended</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.completedTrainings}</p>
                                    </div>
                                    <CheckCircle className="w-8 h-8 text-lime-600" />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-600 text-sm">Avg Rating</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.avgRating}</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-yellow-500" />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-600 text-sm">Pending Topics</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pendingCount}</p>
                                    </div>
                                    <Clock className="w-8 h-8 text-red-500" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold mb-4">Upcoming Schedules 📅</h3> {/* NEW */}
                                <div className="space-y-3">
                                    {upcomingSchedules.length > 0 ? (
                                        upcomingSchedules.map(schedule => {
                                            const topics = schedule.topicIds;
                                            return (
                                                <div key={schedule._id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <div>
                                                        <p className="font-medium text-green-800">
                                                            {topics.slice(0, 5).map(t => t.topic).join(', ') || 'Unknown Topic'}
                                                            {topics.length > 5 && ` (+${topics.length - 5} more)`}
                                                        </p>
                                                        <p className="text-sm text-gray-600">Trainer: {schedule.trainerName || 'N/A'}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-700 font-bold">{new Date(schedule.date).toLocaleDateString()}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 italic">No upcoming training schedules.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold mb-4">Suggested Training Topics 💡</h3> {/* NEW */}
                                <div className="space-y-3">
                                    {suggestedTopics.map((topic, index) => (
                                        <div key={topic._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                                            <div>
                                                <p className="font-medium text-red-800">{topic.topic}</p>
                                                <p className="text-xs text-gray-600">Scheduled: {topic.scheduleCount} times | Avg Attendance: {(topic.avgAttendance * 100).toFixed(0)}%</p>
                                            </div>
                                            <span className="text-xs font-bold text-red-700">Priority: {index + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
                                <h3 className="text-xl font-bold mb-4">Department Overview</h3>
                                <div className="space-y-3">
                                    {DEPARTMENTS.map(dept => {
                                        const empCount = employees.filter(e => e.department === dept).length;
                                        const topicCount = topics.filter(t => t.department === dept).length;
                                        return (
                                            <div key={dept} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium">{dept}</span>
                                                <div className="flex gap-4 text-sm">
                                                    <span className="text-green-700">{empCount} employees</span> {/* Theme change */}
                                                    <span className="text-lime-600">{topicCount} topics</span> {/* Theme change */}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'employees' && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Employees ({filteredEmployees.length})</h2>
                            <button onClick={() => openModal('employee')} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2">
                                <Plus className="w-4 h-4" />Add Employee
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredEmployees.map(emp => (
                                        <tr key={emp._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">{emp.name}</td>
                                            <td className="px-6 py-4">{emp.department}</td>
                                            <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{emp.role}</span></td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => openModal('employee', emp)} className="text-green-600 hover:text-green-800 mr-3">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteItem('employee', emp._id)} className="text-red-600 hover:text-red-800">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredEmployees.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No employees found matching the current filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'topics' && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Training Topics ({filteredTopics.length})</h2>
                            <button onClick={() => openModal('topic')} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2">
                                <Plus className="w-4 h-4" />Add Topic
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredTopics.map(topic => (
                                        <tr key={topic._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{topic.topic}</td>
                                            <td className="px-6 py-4">{topic.department}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => openModal('topic', topic)} className="text-green-600 hover:text-green-800 mr-3">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteItem('topic', topic._id)} className="text-red-600 hover:text-red-800">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTopics.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No topics found matching the current filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'schedules' && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Training Schedules</h2>
                            <button onClick={() => openModal('schedule')} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2">
                                <Plus className="w-4 h-4" />Add Schedule
                            </button>
                        </div>
                        <div className="space-y-4">
                            {filteredSchedules.length === 0 ? (
                                <p className="text-gray-500 md:col-span-3">No schedules found matching your criteria.</p>
                            ) : (
                                filteredSchedules.map(schedule => {
                                    const { topicIds: topics, employeeIds: employeesInvited } = schedule;
                                    const attendedCount = attendances.filter(att => att.scheduleId?._id === schedule._id && att.attended).length;
                                    const attendanceRate = employeesInvited.length > 0 ?
                                        ((attendedCount / employeesInvited.length) * 100).toFixed(0) : 0;
                                    const dateFormatted = new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                                    const attendanceIsLocked = isAttendanceMarked(schedule._id);
                                    return (
                                        <div key={schedule._id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between">
                                            <div>
                                                <div className="flex gap-2">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                        {topics.slice(0, 5).map(t => t.topic).join(', ')}
                                                        {topics.length > 5 && ` (+${topics.length - 5} more)`}
                                                    </h3>
                                                    <span className="flex gap-2">
                                                        <button
                                                            onClick={attendanceIsLocked ? undefined : () => openModal('schedule', schedule)}
                                                            disabled={attendanceIsLocked}
                                                            className={attendanceIsLocked ? "text-gray-400 cursor-not-allowed" : "text-green-600 hover:text-green-800"}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={attendanceIsLocked ? undefined : () => deleteItem('schedule', schedule._id)}
                                                            disabled={attendanceIsLocked}
                                                            className={attendanceIsLocked ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2"><Calendar className='w-4 h-4' /> {dateFormatted}</p>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <p className="text-sm text-gray-600">Trainer: {schedule.trainerName || 'N/A'}</p>
                                                    <span className="text-sm font-medium text-gray-700">Departments:</span>
                                                    {[...new Set(topics.map(t => t.department))].map((dept, idx) => (
                                                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{dept}</span>
                                                    ))}
                                                </div>

                                                <div className="text-sm text-gray-700 mb-4">
                                                    <p>Invited: <span className="font-semibold">{employeesInvited.length}</span></p>
                                                    <p>Attended: <span className="font-semibold">{attendedCount}</span></p>
                                                    <p>Completion: <span className={`font-semibold ${attendanceRate >= 75 ? 'text-green-600' : 'text-orange-600'}`}>{attendanceRate}%</span></p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                <button onClick={() => openDetailModal(schedule)} className="flex-1 px-3 py-2 text-lg bg-green-700 text-white rounded-lg hover:bg-green-800 transition">
                                                    View Details
                                                </button>
                                                {!isAttendanceMarked(schedule._id) && canMarkAttendance(schedule.date) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openModal('attendance', schedule);
                                                        }}
                                                        className="flex-1 px-3 py-2 text-lg bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
                                                    >
                                                        Mark Attendance
                                                    </button>
                                                )}
                                                {!isAttendanceMarked(schedule._id) && !canMarkAttendance(schedule.date) && (
                                                    <button
                                                        disabled
                                                        className="flex-1 px-3 py-2 text-lg bg-gray-400 text-white rounded-lg cursor-not-allowed"
                                                    >
                                                        Future Training
                                                    </button>
                                                )}
                                                <div className="flex gap-3 mt-6">
                                                    {selectedScheduleDetail && !isAttendanceMarked(selectedScheduleDetail._id) && canMarkAttendance(selectedScheduleDetail.date) && (
                                                        <button
                                                            onClick={() => {
                                                                closeDetailModal();
                                                                openModal('attendance', { scheduleId: selectedScheduleDetail?._id });
                                                            }}
                                                            className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
                                                        >
                                                            Mark Attendance
                                                        </button>
                                                    )}
                                                    {selectedScheduleDetail && !isAttendanceMarked(selectedScheduleDetail._id) && !canMarkAttendance(selectedScheduleDetail.date) && (
                                                        <button
                                                            disabled
                                                            className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                                                        >
                                                            Future Training - Cannot Mark Yet
                                                        </button>
                                                    )}
                                                    {selectedScheduleDetail && isAttendanceMarked(selectedScheduleDetail._id) && (
                                                        <button
                                                            disabled
                                                            className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                                                        >
                                                            Final Attendance Marked
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Training Attendance</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Training Topic</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Participants</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendees</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {schedules
                                        .filter(schedule => {
                                            if (!searchTerm) return true;
                                            const topics = schedule.topicIds;
                                            const dateString = new Date(schedule.date).toLocaleDateString();
                                            return (
                                                (topics[0]?.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (topics?.trainerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                dateString.includes(searchTerm)
                                            );
                                        })
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map(schedule => {
                                            const topics = schedule.topicIds;
                                            const assignedEmps = schedule.employeeIds || [];
                                            const scheduleAttendances = attendances.filter(a => (a.scheduleId?._id || a.scheduleId) === schedule._id);
                                            const attendedCount = scheduleAttendances.filter(a => a.attended).length;
                                            const attendedRecords = scheduleAttendances.filter(a => a.attended);
                                            const totalRatingSum = attendedRecords.reduce((sum, a) => sum + a.rating, 0);
                                            const avgRating = attendedRecords.length > 0
                                                ? (totalRatingSum / attendedRecords.length).toFixed(1)
                                                : 'N/A';

                                            return (
                                                <tr key={schedule._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetailModal(schedule)}>
                                                    <td className="px-6 py-4 font-medium">{new Date(schedule.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {topics.slice(0, 5).map(t => t.topic).join(', ') || 'Unknown Topic'}
                                                                {topics.length > 5 && ` (+${topics.length - 5} more)`}
                                                            </p>
                                                            <p className="text-sm text-gray-600">Trainer: {schedule.trainerName || 'N/A'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                            {assignedEmps.length}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${attendedCount === assignedEmps.length && assignedEmps.length > 0 ? 'bg-green-100 text-green-800' :
                                                            attendedCount > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {attendedCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${avgRating === 'N/A' ? 'bg-gray-100 text-gray-800' :
                                                            parseFloat(avgRating) >= 4 ? 'bg-green-100 text-green-800' :
                                                                parseFloat(avgRating) >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {avgRating}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                            {schedules.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No training schedules found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Pending Training Topics</h2>
                            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold">
                                {pendingData
                                    .map(item => {
                                        if (searchTerm) {
                                            const searchLower = searchTerm.toLowerCase();
                                            const employeeNameMatch = item.employee.name.toLowerCase().includes(searchLower);
                                            const departmentMatch = item.employee.department.toLowerCase().includes(searchLower);
                                            if (employeeNameMatch || departmentMatch) {
                                                return 1;
                                            }
                                            const filteredPendingTopics = item.pendingTopics.filter(t =>
                                                t.topic.toLowerCase().includes(searchLower)
                                            );
                                            return filteredPendingTopics.length > 0 ? 1 : 0;
                                        }
                                        return item.pendingTopics.length > 0 ? 1 : 0;
                                    })
                                    .reduce((sum, count) => sum + count, 0)} Employees with Pending Topics
                            </div>
                        </div>

                        <div className="space-y-6">
                            {pendingData.length > 0 ? (
                                pendingData
                                    .map(item => {
                                        if (searchTerm) {
                                            const searchLower = searchTerm.toLowerCase();
                                            const employeeNameMatch = item.employee.name.toLowerCase().includes(searchLower);
                                            const departmentMatch = item.employee.department.toLowerCase().includes(searchLower);

                                            // If employee name or department matches, show all their pending topics
                                            if (employeeNameMatch || departmentMatch) {
                                                return item;
                                            }

                                            // Otherwise, filter topics that match the search term
                                            const filteredPendingTopics = item.pendingTopics.filter(t =>
                                                t.topic.toLowerCase().includes(searchLower)
                                            );

                                            // Return null if no matching topics
                                            if (filteredPendingTopics.length === 0) {
                                                return null;
                                            }

                                            return { ...item, pendingTopics: filteredPendingTopics };
                                        }

                                        // No search term - return all
                                        return item;
                                    })
                                    .filter(item => item !== null) // Remove null entries
                                    .map(item => (
                                        <div key={item.employee._id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="text-lg font-bold">{item.employee.name}</h3>
                                                    <p className="text-gray-600 text-sm">{item.employee.department} - {item.employee.role}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                                    {item.pendingTopics.length} pending
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {item.pendingTopics.map(topic => (
                                                    <div key={topic._id} className="px-3 py-2 bg-red-50 text-red-800 rounded-lg text-sm">
                                                        {topic.topic}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No pending training topics found matching the current filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-2xl font-bold mb-4">Select Report Type</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    exportEmployeeReport();
                                    setShowReportModal(false);
                                }}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-left"
                            >
                                <div className="font-semibold">📊 Employee-wise Training Report</div>
                                <div className="text-sm text-blue-100">Completed & pending trainings per employee</div>
                            </button>

                            <button
                                onClick={() => {
                                    exportMonthlyReport();
                                    setShowReportModal(false);
                                }}
                                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-left"
                            >
                                <div className="font-semibold">📅 Monthly Training Report</div>
                                <div className="text-sm text-purple-100">Monthly schedule, attendance & ratings summary</div>
                            </button>

                            <button
                                onClick={() => {
                                    exportData();
                                    setShowReportModal(false);
                                }}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-left"
                            >
                                <div className="font-semibold">📈 Training Summary Report</div>
                                <div className="text-sm text-green-100">Overall training statistics</div>
                            </button>

                            {/* NEW REPORTS */}
                            <button
                                onClick={() => {
                                    setShowReportModal(false);
                                    setShowDateRangeModal(true);
                                }}
                                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-left"
                            >
                                <div className="font-semibold">📋 Date Range Attendance Report</div>
                                <div className="text-sm text-orange-100">Employee-wise invitation & attendance by date range</div>
                            </button>

                            <button
                                onClick={() => {
                                    exportRefresherTrainingReport();
                                    setShowReportModal(false);
                                }}
                                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-left"
                            >
                                <div className="font-semibold">🔄 Refresher Training Report (90-Day Cycle)</div>
                                <div className="text-sm text-red-100">Overdue & upcoming refresher trainings</div>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowReportModal(false)}
                            className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ADD THIS NEW DATE RANGE MODAL after the report modal */}
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

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className={`bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto ${modalType === 'attendance' ? 'max-w-3xl' : 'max-w-2xl'
                        }`}>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold mb-4">
                                {editItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                            </h3>
                            {modalType === 'employee' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={employeeForm.name}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" // Theme change
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                        <select
                                            value={employeeForm.department}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" // Theme change
                                        >
                                            <option value="">Select Department</option>
                                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                        <select
                                            value={employeeForm.role}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" // Theme change
                                        >
                                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {modalType === 'topic' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
                                        <input
                                            type="text"
                                            value={topicForm.topic}
                                            onChange={(e) => setTopicForm({ ...topicForm, topic: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" // Theme change
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                        <select
                                            value={topicForm.department}
                                            onChange={(e) => setTopicForm({ ...topicForm, department: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" // Theme change
                                        >
                                            <option value="">Select Department</option>
                                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {modalType === 'schedule' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={scheduleForm.date}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            ℹ️ You can only schedule trainings for today or future dates
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Trainer Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter trainer name"
                                            value={scheduleForm.trainerName}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, trainerName: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Topics</label>
                                        <input
                                            type="text"
                                            placeholder="Search Topic..."
                                            value={topicSearchTerm}
                                            onChange={(e) => setTopicSearchTerm(e.target.value)}
                                            className="w-full px-4 py-2 mb-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                        {/* NEW: Select All Topics Checkbox */}
                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-gray-100 mb-2 border border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={selectAllTopics}
                                                onChange={handleSelectAllTopics}
                                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                                            />
                                            <span className="font-bold">Select/Deselect All Topics ({topics.length})</span>
                                        </label>
                                        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                                            {filteredModalTopics.map(topic => (
                                                <label
                                                    key={topic._id}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={scheduleForm.topicIds.includes(topic._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setScheduleForm(prevForm => ({ ...prevForm, topicIds: [...prevForm.topicIds, topic._id] }));
                                                            } else {
                                                                setSelectAllTopics(false); // Deselect 'Select All' if one is manually deselected
                                                                setScheduleForm(prevForm => ({
                                                                    ...prevForm,
                                                                    topicIds: prevForm.topicIds.filter(id => id !== topic._id)
                                                                }));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                    />
                                                    <span>{topic.topic} - <span className="font-medium text-gray-700">{topic.department}</span></span>
                                                </label>
                                            ))}

                                            {filteredModalTopics.length === 0 && (
                                                <p className="text-center text-sm text-gray-500">No topics found.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign Employees</label>
                                        <input
                                            type="text"
                                            placeholder="Search Employee..."
                                            value={employeeSearchTerm}
                                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                            className="w-full px-4 py-2 mb-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                        {/* NEW: Select All Employees Checkbox */}
                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-gray-100 mb-2 border border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={selectAllEmployees}
                                                onChange={handleSelectAllEmployees}
                                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                                            />
                                            <span className="font-bold">Select/Deselect All Employees ({employees.length})</span>
                                        </label>
                                        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                                            {filteredModalEmployees.map(emp => (
                                                <label
                                                    key={emp._id}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={scheduleForm.employeeIds.includes(emp._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setScheduleForm({ ...scheduleForm, employeeIds: [...scheduleForm.employeeIds, emp._id] });
                                                            } else {
                                                                setSelectAllEmployees(false); // Deselect 'Select All' if one is manually deselected
                                                                setScheduleForm({
                                                                    ...scheduleForm,
                                                                    employeeIds: scheduleForm.employeeIds.filter(id => id !== emp._id)
                                                                });
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-green-600 focus:ring-green-500" // Theme change
                                                    />
                                                    <span>{emp.name} - {emp.department}</span>
                                                </label>
                                            ))}
                                            {filteredModalEmployees.length === 0 && (
                                                <p className="text-center text-sm text-gray-500">No employees found.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalType === 'attendance' && (
                                <div className="space-y-4">
                                    {attendanceForm.scheduleId && (() => {
                                        const schedule = schedules.find(s => s._id === attendanceForm.scheduleId);
                                        const topics = schedule?.topicIds || [];
                                        const scheduleDate = schedule ? new Date(schedule.date).toLocaleDateString() : 'N/A';
                                        const trainerName = schedule?.trainerName || 'N/A';

                                        return (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                                <h4 className="font-semibold text-green-900 mb-2">Training Schedule</h4>
                                                <p className="text-sm text-green-800">
                                                    <strong>Topic:</strong> {topics.slice(0, 3).map(t => t.topic).join(', ')}
                                                    {topics.length > 3 && ` (+${topics.length - 3} more)`}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    <strong>Date:</strong> {scheduleDate}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    <strong>Trainer:</strong> {trainerName}
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {attendanceForm.scheduleId && bulkAttendanceRecords.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-lg font-bold mb-3 border-b pb-2">
                                                Attendance and Rating for Participants ({bulkAttendanceRecords.length})
                                            </h4>

                                            {/* Select All Attendance Checkbox */}
                                            <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-green-100 mb-3 border border-green-300">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAllAttendance}
                                                    onChange={handleSelectAllAttendance}
                                                    className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
                                                />
                                                <span className="font-bold text-green-900">Mark All as Present (Quick Attendance)</span>
                                            </label>

                                            {/* Mobile-Responsive Card Layout */}
                                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                                {bulkAttendanceRecords.map(record => (
                                                    <div
                                                        key={record.employeeId}
                                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                                                    >
                                                        {/* Employee Info */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex-1">
                                                                <h5 className="font-semibold text-gray-900">{record.employeeName}</h5>
                                                                <p className="text-sm text-gray-600">{record.employeeDept}</p>
                                                            </div>

                                                            {/* Attendance Checkbox */}
                                                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={record.attended}
                                                                    onChange={(e) => updateBulkAttendanceRecord(record.employeeId, 'attended', e.target.checked)}
                                                                    className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
                                                                />
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {record.attended ? 'Present' : 'Absent'}
                                                                </span>
                                                            </label>
                                                        </div>

                                                        {/* Rating Selector */}
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Training Rating
                                                            </label>
                                                            <select
                                                                value={record.rating}
                                                                onChange={(e) => updateBulkAttendanceRecord(record.employeeId, 'rating', parseInt(e.target.value))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                                disabled={!record.attended}
                                                            >
                                                                {RATINGS.map(rating => (
                                                                    <option key={rating.value} value={rating.value}>
                                                                        {rating.value} - {rating.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {!record.attended && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Mark as present to enable rating
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Summary Bar */}
                                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                                                <div className="text-sm">
                                                    <span className="font-semibold text-blue-900">Summary: </span>
                                                    <span className="text-blue-800">
                                                        {bulkAttendanceRecords.filter(r => r.attended).length} Present / {bulkAttendanceRecords.length} Total
                                                    </span>
                                                </div>
                                                <div className="text-sm text-blue-700">
                                                    Attendance Rate: <span className="font-bold">
                                                        {bulkAttendanceRecords.length > 0
                                                            ? Math.round((bulkAttendanceRecords.filter(r => r.attended).length / bulkAttendanceRecords.length) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {attendanceForm.scheduleId && bulkAttendanceRecords.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="text-4xl mb-2">📋</div>
                                            <p className="font-medium">No employees assigned</p>
                                            <p className="text-sm mt-1">No employees are assigned to this training schedule.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        if (modalType === 'employee') saveEmployee();
                                        else if (modalType === 'topic') saveTopic();
                                        else if (modalType === 'schedule') saveSchedule();
                                        else if (modalType === 'attendance') saveAttendance();
                                    }}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition disabled:opacity-50" // Theme change
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={closeModal}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div >
                </div >
            )
            }

            {showDetailModal && selectedScheduleDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {(() => {
                                const topics = selectedScheduleDetail.topicIds || [];
                                const assignedEmps = selectedScheduleDetail.employeeIds || [];
                                const scheduleAttendances = attendances.filter(a =>
                                    (a.scheduleId?._id || a.scheduleId) === selectedScheduleDetail._id
                                );
                                const attendedRecords = scheduleAttendances.filter(a => a.attended);
                                const avgRating = attendedRecords.length > 0
                                    ? (attendedRecords.reduce((sum, a) => sum + a.rating, 0) / attendedRecords.length).toFixed(1)
                                    : 'N/A';

                                return (
                                    <>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900">
                                                    {/* {topics[0]?.topic || 'Unknown Topic'} */}
                                                    {topics.slice(0, 5).map(t => t.topic).join(', ') || 'Unknown Topic'}
                                                    {topics.length > 5 && ` (+${topics.length - 5} more)`}
                                                </h3>
                                                <p className="text-gray-600 mt-1">Trainer: {selectedScheduleDetail.trainerName || 'N/A'}</p>
                                                <p className="text-gray-600">Date: {new Date(selectedScheduleDetail.date).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={closeDetailModal}
                                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Total Participants</p>
                                                <p className="text-2xl font-bold text-blue-800">{assignedEmps.length}</p>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Attended</p>
                                                <p className="text-2xl font-bold text-green-800">{attendedRecords.length}</p>
                                            </div>
                                            <div className="bg-yellow-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Average Rating</p>
                                                <p className="text-2xl font-bold text-yellow-800">{avgRating}</p>
                                            </div>
                                        </div>

                                        <h4 className="text-lg font-bold mb-3">Employee Attendance Details</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rating</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {assignedEmps.map(emp => {
                                                        const attendance = scheduleAttendances.find(a =>
                                                            (a.employeeId?._id || a.employeeId) === emp._id
                                                        );
                                                        const rating = RATINGS.find(r => r.value === (attendance?.rating || 1));

                                                        return (
                                                            <tr key={emp._id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 font-medium">{emp.name}</td>
                                                                <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {attendance?.attended ? (
                                                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                                            Present
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                                                            Absent
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {attendance?.attended ? (
                                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${rating?.color || 'bg-gray-500'}`}>
                                                                            {rating?.label || 'N/A'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-sm">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            {selectedScheduleDetail && !isAttendanceMarked(selectedScheduleDetail._id) && canMarkAttendance(selectedScheduleDetail.date) && (
                                                <button
                                                    onClick={() => {
                                                        closeDetailModal();
                                                        openModal('attendance', { scheduleId: selectedScheduleDetail?._id });
                                                    }}
                                                    className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
                                                >
                                                    Mark Attendance
                                                </button>
                                            )}
                                            {selectedScheduleDetail && !isAttendanceMarked(selectedScheduleDetail._id) && !canMarkAttendance(selectedScheduleDetail.date) && (
                                                <button
                                                    disabled
                                                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                                                >
                                                    Future Training - Cannot Mark Yet
                                                </button>
                                            )}
                                            {selectedScheduleDetail && isAttendanceMarked(selectedScheduleDetail._id) && (
                                                <button
                                                    disabled
                                                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                                                >
                                                    Final Attendance Marked
                                                </button>
                                            )}
                                            <button
                                                onClick={closeDetailModal}
                                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )
            }
            <Footer />
        </div >
    );
}