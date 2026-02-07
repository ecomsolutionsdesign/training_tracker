// app/attendance/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Search } from 'lucide-react';
import { DEPARTMENTS, RATINGS } from '@/constants/appConstants';

export default function AttendancePage() {
    const router = useRouter();
    const [schedules, setSchedules] = useState([]);
    const [attendances, setAttendances] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedScheduleDetail, setSelectedScheduleDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [attendanceForm, setAttendanceForm] = useState({ scheduleId: '' });
    const [bulkAttendanceRecords, setBulkAttendanceRecords] = useState([]);
    const [selectAllAttendance, setSelectAllAttendance] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        if (attendanceForm.scheduleId) {
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
        } else {
            setBulkAttendanceRecords([]);
        }
    }, [attendanceForm.scheduleId, employees, attendances]);

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchSchedules(),
            fetchAttendances(),
            fetchEmployees(),
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

    const fetchAttendances = async () => {
        try {
            const res = await fetch('/api/attendances');
            const data = await res.json();
            if (data.success) setAttendances(data.data);
        } catch (error) {
            console.error('Error fetching attendances:', error);
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

    const canMarkAttendance = (scheduleDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const schedule = new Date(scheduleDate);
        schedule.setHours(0, 0, 0, 0);
        return schedule <= today;
    };

    const isAttendanceMarked = (scheduleId) => {
        return attendances.some(a => (a.scheduleId?._id || a.scheduleId) === scheduleId);
    };

    const getAssignedEmployeesForSchedule = (scheduleId) => {
        const schedule = schedules.find(s => s._id === scheduleId);
        if (!schedule || !schedule.employeeIds) return [];
        const assignedIds = schedule.employeeIds.map(e => e._id || e);
        return employees.filter(emp => assignedIds.includes(emp._id));
    };

    const openModal = (schedule) => {
        if (!canMarkAttendance(schedule.date)) {
            alert('⚠️ Cannot mark attendance for future training schedules. You can only mark attendance on or after the scheduled date.');
            return;
        }

        const scheduleId = schedule._id || '';
        setAttendanceForm({ scheduleId });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setAttendanceForm({ scheduleId: '' });
        setBulkAttendanceRecords([]);
        setSelectAllAttendance(false);
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

    const updateBulkAttendanceRecord = (employeeId, field, value) => {
        setBulkAttendanceRecords(prev =>
            prev.map(record =>
                record.employeeId === employeeId ? { ...record, [field]: value } : record
            )
        );
    };

    const saveAttendance = async () => {
        if (!attendanceForm.scheduleId) {
            alert('Please select a schedule.');
            return;
        }

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

    const openDetailModal = (schedule) => {
        setSelectedScheduleDetail(schedule);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedScheduleDetail(null);
    };

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
                            placeholder="Search in attendance..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                {/* Attendance Table */}
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
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                                            (schedule.trainerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                                            <tr key={schedule._id} className="hover:bg-gray-50">
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
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {isAttendanceMarked(schedule._id) ? (
                                                            <button
                                                                onClick={() => openDetailModal(schedule)}
                                                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                                                            >
                                                                View
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => openModal(schedule)}
                                                                className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition text-sm font-medium"
                                                            >
                                                                Pending Attendance
                                                            </button>
                                                        )}
                                                    </div>
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

                {/* Attendance Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold mb-4">Mark Attendance</h3>
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

                                            <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-green-100 mb-3 border border-green-300">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAllAttendance}
                                                    onChange={handleSelectAllAttendance}
                                                    className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
                                                />
                                                <span className="font-bold text-green-900">Mark All as Present (Quick Attendance)</span>
                                            </label>

                                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                                {bulkAttendanceRecords.map(record => (
                                                    <div
                                                        key={record.employeeId}
                                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex-1">
                                                                <h5 className="font-semibold text-gray-900">{record.employeeName}</h5>
                                                                <p className="text-sm text-gray-600">{record.employeeDept}</p>
                                                            </div>

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
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={saveAttendance}
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