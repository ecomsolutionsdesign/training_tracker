// app/schedules/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, Search, Calendar } from 'lucide-react';
import { DEPARTMENTS, RATINGS } from '@/constants/appConstants';

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [topics, setTopics] = useState([]);
    const [attendances, setAttendances] = useState([]);
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedScheduleDetail, setSelectedScheduleDetail] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        date: '',
        topicIds: [],
        trainerName: '',
        employeeIds: []
    });
    const [topicSearchTerm, setTopicSearchTerm] = useState('');
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [selectAllTopics, setSelectAllTopics] = useState(false);
    const [selectAllEmployees, setSelectAllEmployees] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchSchedules(),
            fetchEmployees(),
            fetchTopics(),
            fetchAttendances(),
        ]);
        setLoading(false);
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

    const fetchAttendances = async () => {
        try {
            const res = await fetch('/api/attendances');
            const data = await res.json();
            if (data.success) setAttendances(data.data);
        } catch (error) {
            console.error('Error fetching attendances:', error);
        }
    };

    const isAttendanceMarked = (scheduleId) => {
        return attendances.some(a => (a.scheduleId?._id || a.scheduleId) === scheduleId);
    };

    const canMarkAttendance = (scheduleDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const schedule = new Date(scheduleDate);
        schedule.setHours(0, 0, 0, 0);
        return schedule <= today;
    };

    const openModal = (item = null) => {
        if (item) {
            const scheduleDate = new Date(item.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (scheduleDate < today) {
                alert('⚠️ Cannot edit past training schedules. You can only modify today or future schedules.');
                return;
            }
        }

        setEditItem(item);
        setScheduleForm(item ? {
            date: new Date(item.date).toISOString().split('T')[0],
            topicIds: item.topicIds?.map(t => t._id || t) || [],
            trainerName: item.trainerName || '',
            employeeIds: item.employeeIds?.map(e => e._id || e) || []
        } : { date: '', topicIds: [], trainerName: '', employeeIds: [] });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setScheduleForm({ date: '', topicIds: [], trainerName: '', employeeIds: [] });
        setTopicSearchTerm('');
        setEmployeeSearchTerm('');
        setSelectAllTopics(false);
        setSelectAllEmployees(false);
    };

    const handleSelectAllTopics = (e) => {
        const checked = e.target.checked;
        setSelectAllTopics(checked);
        if (checked) {
            setScheduleForm(prevForm => ({
                ...prevForm,
                topicIds: topics.map(t => t._id)
            }));
        } else {
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
            setScheduleForm(prevForm => ({
                ...prevForm,
                employeeIds: employees.map(e => e._id)
            }));
        } else {
            setScheduleForm(prevForm => ({
                ...prevForm,
                employeeIds: []
            }));
        }
    };

    const saveSchedule = async () => {
        const selectedDate = new Date(scheduleForm.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert('❌ Cannot schedule training for a past date. Please select today or a future date.');
            return;
        }

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

    const deleteSchedule = async (id) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                await fetchSchedules();
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const openDetailModal = (schedule) => {
        setSelectedScheduleDetail(schedule);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedScheduleDetail(null);
    };

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            const topicMatches = s.topicIds?.some(t => t.topic?.toLowerCase().includes(searchTerm.toLowerCase()));
            const deptMatches = selectedDept === 'All' || s.topicIds?.some(t => t.department === selectedDept);
            return topicMatches && deptMatches;
        });
    }, [schedules, selectedDept, searchTerm]);

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

    return (
        <Layout>
            <div className="max-w-7xl mx-auto p-6">
                {/* Filters */}
                <div className="mb-6 flex gap-4 items-center flex-wrap">
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-white"
                    >
                        <option value="All">All Departments</option>
                        {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>

                    <div className="relative grow max-w-sm">
                        <input
                            type="text"
                            placeholder="Search schedules..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                {/* Schedules */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Training Schedules</h2>
                        <button
                            onClick={() => openModal()}
                            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
                        >
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
                                                        onClick={attendanceIsLocked ? undefined : () => openModal(schedule)}
                                                        disabled={attendanceIsLocked}
                                                        className={attendanceIsLocked ? "text-gray-400 cursor-not-allowed" : "text-green-600 hover:text-green-800"}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={attendanceIsLocked ? undefined : () => deleteSchedule(schedule._id)}
                                                        disabled={attendanceIsLocked}
                                                        className={attendanceIsLocked ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                                <Calendar className='w-4 h-4' /> {dateFormatted}
                                            </p>
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

                                        {/* <div className="flex gap-2 mt-4">
                                            <button 
                                                onClick={() => openDetailModal(schedule)} 
                                                className="flex-1 px-3 py-2 text-lg bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
                                            >
                                                View Details
                                            </button>
                                        </div> */}
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => openDetailModal(schedule)}
                                                className={`flex-1 px-3 py-2 text-lg text-white rounded-lg transition ${isAttendanceMarked(schedule._id)
                                                    ? "bg-green-700 hover:bg-green-800"  // Default color
                                                    : "bg-orange-600 hover:bg-orange-700" // Color for pending attendance
                                                    }`}
                                            >
                                                {isAttendanceMarked(schedule._id) ? "View Details" : "View Details (Attendance Pending)"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Schedule Form Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold mb-4">
                                    {editItem ? 'Edit' : 'Add'} Schedule
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={scheduleForm.date}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
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
                                                                setSelectAllTopics(false);
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
                                                                setSelectAllEmployees(false);
                                                                setScheduleForm({
                                                                    ...scheduleForm,
                                                                    employeeIds: scheduleForm.employeeIds.filter(id => id !== emp._id)
                                                                });
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
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
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={saveSchedule}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition disabled:opacity-50"
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
                        </div>
                    </div>
                )}

                {/* Detail Modal */}
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
                                                        {topics.slice(0, 5).map(t => t.topic).join(', ') || 'Unknown Topic'}
                                                        {topics.length > 5 && ` (+${topics.length - 5} more)`}
                                                    </h3>
                                                    <p className="text-gray-600 mt-1">Trainer: {selectedScheduleDetail.trainerName || 'N/A'}</p>
                                                    <p className="text-gray-600">Date: {new Date(selectedScheduleDetail.date).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}</p>
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
                )}
            </div>
        </Layout>
    );
}