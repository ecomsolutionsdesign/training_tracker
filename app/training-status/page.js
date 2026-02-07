// app/training-status/page.js
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { CheckCircle, XCircle, Search, ChevronDown } from 'lucide-react';
import { DEPARTMENTS } from '@/constants/appConstants';

export default function TrainingStatusPage() {
    const [employees, setEmployees] = useState([]);
    const [topics, setTopics] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [topicSearchTerm, setTopicSearchTerm] = useState('');
    const [isTopicOpen, setIsTopicOpen] = useState(false);

    const [attendedEmployees, setAttendedEmployees] = useState([]);
    const [pendingEmployees, setPendingEmployees] = useState([]);

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        if (selectedTopic) {
            checkTrainingStatus();
        } else {
            setAttendedEmployees([]);
            setPendingEmployees([]);
        }
    }, [selectedTopic, selectedDepartment, employees, attendances, schedules]);

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

    const selectedTopicLabel = topics.find(t => t._id === selectedTopic)?.topic || '';

    const filteredTopics = topics.filter(t =>
        t.topic.toLowerCase().includes(topicSearchTerm.toLowerCase()) ||
        t.department.toLowerCase().includes(topicSearchTerm.toLowerCase())
    );


    const checkTrainingStatus = () => {
        if (!selectedTopic) return;

        const topic = topics.find(t => t._id === selectedTopic);
        if (!topic) return;

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Filter employees by department
        let filteredEmployees = employees;
        if (selectedDepartment !== 'All') {
            filteredEmployees = employees.filter(e => e.department === selectedDepartment);
        }

        const attended = [];
        const pending = [];

        filteredEmployees.forEach(employee => {
            // Check if this topic is applicable to this employee
            const topicDepartments = ['Top Management', 'HSE', 'HR']; // Universal departments
            const isTopicApplicable =
                topic.department === employee.department ||
                topicDepartments.includes(topic.department);

            if (!isTopicApplicable) return;

            // Find if employee attended this topic in last 3 months
            const recentAttendance = attendances.find(att => {
                if (!att.attended) return false;
                if ((att.employeeId?._id || att.employeeId) !== employee._id) return false;

                const schedule = schedules.find(s =>
                    s._id === (att.scheduleId?._id || att.scheduleId)
                );

                if (!schedule) return false;
                if (new Date(schedule.date) < threeMonthsAgo) return false;

                const scheduleTopics = schedule.topicIds || [];
                return scheduleTopics.some(t => (t._id || t) === topic._id);
            });

            if (recentAttendance) {
                const schedule = schedules.find(s =>
                    s._id === (recentAttendance.scheduleId?._id || recentAttendance.scheduleId)
                );

                attended.push({
                    ...employee,
                    attendanceDate: schedule ? new Date(schedule.date).toLocaleDateString() : 'N/A',
                    rating: recentAttendance.rating,
                    trainerName: schedule?.trainerName || 'N/A'
                });
            } else {
                pending.push(employee);
            }
        });

        setAttendedEmployees(attended);
        setPendingEmployees(pending);
    };

    const filterEmployeesBySearch = (employeeList) => {
        if (!searchTerm) return employeeList;

        const searchLower = searchTerm.toLowerCase();
        return employeeList.filter(emp =>
            emp.name.toLowerCase().includes(searchLower) ||
            emp.department.toLowerCase().includes(searchLower)
        );
    };

    const filteredAttended = filterEmployeesBySearch(attendedEmployees);
    const filteredPending = filterEmployeesBySearch(pendingEmployees);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-700 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Training Status Checker</h1>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Training Topic <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                {/* The Search/Select Input */}
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                                    placeholder={selectedTopicLabel || "Search or select a topic..."}
                                    value={isTopicOpen ? topicSearchTerm : selectedTopicLabel}
                                    onChange={(e) => {
                                        setTopicSearchTerm(e.target.value);
                                        if (!isTopicOpen) setIsTopicOpen(true);
                                    }}
                                    onFocus={() => {
                                        setIsTopicOpen(true);
                                        setTopicSearchTerm(''); // Clear to show all options on click
                                    }}
                                />
                                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />

                                {/* The Dropdown List */}
                                {isTopicOpen && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-height-60 overflow-y-auto max-h-64">
                                        {filteredTopics.length > 0 ? (
                                            filteredTopics.map((topic) => (
                                                <div
                                                    key={topic._id}
                                                    className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b last:border-none"
                                                    onClick={() => {
                                                        setSelectedTopic(topic._id);
                                                        setTopicSearchTerm(topic.topic);
                                                        setIsTopicOpen(false);
                                                    }}
                                                >
                                                    <div className="font-medium text-gray-900">{topic.topic}</div>
                                                    <div className="text-xs text-gray-500">{topic.department}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 italic">
                                                No topics found matching "{topicSearchTerm}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Close dropdown when clicking outside */}
                            {isTopicOpen && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsTopicOpen(false)}
                                ></div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Department
                            </label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            >
                                <option value="All">All Departments</option>
                                {DEPARTMENTS.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search Employee
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            </div>
                        </div>
                    </div>

                    {selectedTopic && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-900">
                                <strong>Selected Topic:</strong> {topics.find(t => t._id === selectedTopic)?.topic}
                                {' '}<span className="text-blue-700">({topics.find(t => t._id === selectedTopic)?.department})</span>
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                                Checking attendance for last 3 months (since {new Date(new Date().setMonth(new Date().getMonth() - 3)).toLocaleDateString()})
                            </p>
                        </div>
                    )}
                </div>

                {selectedTopic ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attended Employees */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    Attended Employees
                                </h2>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                                    {filteredAttended.length}
                                </span>
                            </div>

                            <div className="space-y-3 max-h-150 overflow-y-auto">
                                {filteredAttended.length > 0 ? (
                                    filteredAttended.map(emp => (
                                        <div key={emp._id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-green-900">{emp.name}</h3>
                                                    <p className="text-sm text-green-700">{emp.department} - {emp.role}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-green-200 text-green-900 rounded text-xs font-medium">
                                                    {emp.rating}/5 ⭐
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm text-green-800">
                                                <p><strong>Date:</strong> {emp.attendanceDate}</p>
                                                <p><strong>Trainer:</strong> {emp.trainerName}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>No employees have attended this training in the last 3 months</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Employees */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                    Pending Employees
                                </h2>
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                                    {filteredPending.length}
                                </span>
                            </div>

                            <div className="space-y-3 max-h-150 overflow-y-auto">
                                {filteredPending.length > 0 ? (
                                    filteredPending.map(emp => (
                                        <div key={emp._id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-red-900">{emp.name}</h3>
                                                    <p className="text-sm text-red-700">{emp.department} - {emp.role}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-red-200 text-red-900 rounded text-xs font-medium">
                                                    Not Attended
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-red-600">
                                                ⚠️ Training required - Not attended in last 3 months
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <XCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>All applicable employees have attended this training!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Select a Training Topic to Begin
                        </h3>
                        <p className="text-gray-500">
                            Choose a training topic from the dropdown above to see which employees have attended
                            and which ones are pending for that training.
                        </p>
                    </div>
                )}

                {/* Statistics */}
                {selectedTopic && (
                    <div className="mt-6 bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4">Quick Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-700">Total Applicable</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {filteredAttended.length + filteredPending.length}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-700">Attended</p>
                                <p className="text-2xl font-bold text-green-900">{filteredAttended.length}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-red-700">Pending</p>
                                <p className="text-2xl font-bold text-red-900">{filteredPending.length}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-purple-700">Completion Rate</p>
                                <p className="text-2xl font-bold text-purple-900">
                                    {filteredAttended.length + filteredPending.length > 0
                                        ? Math.round((filteredAttended.length / (filteredAttended.length + filteredPending.length)) * 100)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}