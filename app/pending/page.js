// app/pending/page.js
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Clock, Search, Upload, X, CheckCircle, XCircle } from 'lucide-react';
import { DEPARTMENTS } from '@/constants/appConstants';

export default function PendingPage() {
    const [pendingData, setPendingData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [topics, setTopics] = useState([]);
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [topicFilter, setTopicFilter] = useState('All');
    const [loading, setLoading] = useState(false);

    // CSV Upload states
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvResults, setCsvResults] = useState([]);
    const [processingCsv, setProcessingCsv] = useState(false);

    useEffect(() => {
        loadAllData();
    }, [selectedDept]);

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchPending(selectedDept),
            fetchEmployees(),
            fetchTopics()
        ]);
        setLoading(false);
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

    const handleCsvFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
        } else {
            alert('Please upload a valid CSV file');
        }
    };

    const processCsvFile = async () => {
        if (!csvFile) {
            alert('Please select a CSV file first');
            return;
        }

        setProcessingCsv(true);

        try {
            const text = await csvFile.text();
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                alert('CSV file is empty or invalid');
                setProcessingCsv(false);
                return;
            }

            // Parse CSV
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const employeeNameIndex = headers.findIndex(h => h.includes('name') || h.includes('employee'));
            const topicIndex = headers.findIndex(h => h.includes('topic') || h.includes('training'));

            if (employeeNameIndex === -1 || topicIndex === -1) {
                alert('CSV must have "Employee Name" and "Training Topic" columns');
                setProcessingCsv(false);
                return;
            }

            // Fetch attendance data
            const attendancesRes = await fetch('/api/attendances');
            const attendancesData = await attendancesRes.json();
            const attendances = attendancesData.success ? attendancesData.data : [];

            const schedulesRes = await fetch('/api/schedules');
            const schedulesData = await schedulesRes.json();
            const schedules = schedulesData.success ? schedulesData.data : [];

            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            const results = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const employeeName = values[employeeNameIndex];
                const topicName = values[topicIndex];

                if (!employeeName || !topicName) continue;

                // Find employee in database
                const employee = employees.find(e =>
                    e.name.trim().toLowerCase() === employeeName.toLowerCase()
                );

                if (!employee) {
                    results.push({
                        employeeName,
                        topicName,
                        status: 'NOT_FOUND',
                        message: 'Employee not found in database',
                        department: 'N/A'
                    });
                    continue;
                }

                // Find topic in database
                const topic = topics.find(t =>
                    t.topic.trim().toLowerCase() === topicName.toLowerCase()
                );

                if (!topic) {
                    results.push({
                        employeeName: employee.name,
                        topicName,
                        status: 'TOPIC_NOT_FOUND',
                        message: 'Training topic not found in database',
                        department: employee.department
                    });
                    continue;
                }

                // Check if attended in last 3 months
                const recentAttendance = attendances.find(att => {
                    if (!att.attended) return false;
                    if ((att.employeeId?._id || att.employeeId) !== employee._id) return false;

                    const schedule = schedules.find(s =>
                        s._id === (att.scheduleId?._id || att.scheduleId)
                    );

                    if (!schedule) return false;
                    if (new Date(schedule.date) < threeMonthsAgo) return false;

                    const scheduleTopics = schedule.topicIds || [];
                    return scheduleTopics.some(t =>
                        (t._id || t) === topic._id
                    );
                });

                if (recentAttendance) {
                    const schedule = schedules.find(s =>
                        s._id === (recentAttendance.scheduleId?._id || recentAttendance.scheduleId)
                    );

                    results.push({
                        employeeName: employee.name,
                        topicName: topic.topic,
                        status: 'ATTENDED',
                        date: schedule ? new Date(schedule.date).toLocaleDateString() : 'N/A',
                        department: employee.department,
                        rating: recentAttendance.rating
                    });
                } else {
                    results.push({
                        employeeName: employee.name,
                        topicName: topic.topic,
                        status: 'PENDING',
                        message: 'Not attended in last 3 months',
                        department: employee.department
                    });
                }
            }

            setCsvResults(results);
        } catch (error) {
            console.error('Error processing CSV:', error);
            alert('Error processing CSV file. Please check the format.');
        } finally {
            setProcessingCsv(false);
        }
    };

    const downloadCsvResults = () => {
        const headers = ['Employee Name', 'Department', 'Training Topic', 'Status', 'Date/Message', 'Rating'];
        const rows = csvResults.map(r => [
            r.employeeName,
            r.department,
            r.topicName,
            r.status,
            r.date || r.message || '',
            r.rating || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-status-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter pending data by topic and employee name
    const filteredPendingData = pendingData
        .map(item => {
            let filteredTopics = item.pendingTopics;

            // Filter by topic
            if (topicFilter !== 'All') {
                filteredTopics = filteredTopics.filter(t => t._id === topicFilter);
            }

            // Filter by search term (employee name or topic)
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const employeeNameMatch = item.employee.name.toLowerCase().includes(searchLower);
                const departmentMatch = item.employee.department.toLowerCase().includes(searchLower);

                if (!employeeNameMatch && !departmentMatch) {
                    filteredTopics = filteredTopics.filter(t =>
                        t.topic.toLowerCase().includes(searchLower)
                    );
                }

                if (!employeeNameMatch && !departmentMatch && filteredTopics.length === 0) {
                    return null;
                }
            }

            if (filteredTopics.length === 0) return null;

            return { ...item, pendingTopics: filteredTopics };
        })
        .filter(item => item !== null);

    const totalPendingEmployees = filteredPendingData.length;
    const allTopics = [...new Set(pendingData.flatMap(pd => pd.pendingTopics.map(t => t._id)))];

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

                    <select
                        value={topicFilter}
                        onChange={(e) => setTopicFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-white"
                    >
                        <option value="All">All Topics</option>
                        {topics.map(topic => <option key={topic._id} value={topic._id}>{topic.topic}</option>)}
                    </select>

                    <div className="relative grow max-w-sm">
                        <input
                            type="text"
                            placeholder="Search employee or topic..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>

                    <button
                        onClick={() => setShowCsvModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Check CSV File
                    </button>
                </div>

                {/* Pending Topics */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Pending Training Topics</h2>
                        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold">
                            {totalPendingEmployees} Employees with Pending Topics
                        </div>
                    </div>

                    <div className="space-y-6">
                        {filteredPendingData.length > 0 ? (
                            filteredPendingData.map(item => (
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
                                                {topic.topic} ({topic.department})
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

                {/* CSV Upload Modal */}
                {showCsvModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold">Check Training Status from CSV</h3>
                                    <button
                                        onClick={() => {
                                            setShowCsvModal(false);
                                            setCsvFile(null);
                                            setCsvResults([]);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">CSV Format Required:</p>
                                    <p className="text-xs text-blue-800">Your CSV must have these columns: <strong>Employee Name, Training Topic</strong></p>
                                    <p className="text-xs text-blue-700 mt-1">Example:</p>
                                    <pre className="text-xs bg-blue-100 p-2 rounded mt-1">
                                        Employee Name,Training Topic
                                        John Doe,Fire Safety Training
                                        Jane Smith,First Aid Training</pre>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload CSV File
                                    </label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCsvFileChange}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                    {csvFile && (
                                        <p className="text-sm text-green-600 mt-2">
                                            ✓ File selected: {csvFile.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={processCsvFile}
                                        disabled={!csvFile || processingCsv}
                                        className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingCsv ? 'Processing...' : 'Check Status'}
                                    </button>
                                    {csvResults.length > 0 && (
                                        <button
                                            onClick={downloadCsvResults}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Download Results
                                        </button>
                                    )}
                                </div>

                                {/* Results */}
                                {csvResults.length > 0 && (
                                    <div>
                                        <h4 className="text-lg font-bold mb-3">
                                            Results ({csvResults.length} records)
                                        </h4>

                                        {/* Summary */}
                                        <div className="grid grid-cols-4 gap-4 mb-4">
                                            <div className="bg-green-50 p-3 rounded-lg">
                                                <p className="text-sm text-green-700">Attended</p>
                                                <p className="text-2xl font-bold text-green-900">
                                                    {csvResults.filter(r => r.status === 'ATTENDED').length}
                                                </p>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded-lg">
                                                <p className="text-sm text-red-700">Pending</p>
                                                <p className="text-2xl font-bold text-red-900">
                                                    {csvResults.filter(r => r.status === 'PENDING').length}
                                                </p>
                                            </div>
                                            <div className="bg-yellow-50 p-3 rounded-lg">
                                                <p className="text-sm text-yellow-700">Not Found</p>
                                                <p className="text-2xl font-bold text-yellow-900">
                                                    {csvResults.filter(r => r.status === 'NOT_FOUND').length}
                                                </p>
                                            </div>
                                            <div className="bg-orange-50 p-3 rounded-lg">
                                                <p className="text-sm text-orange-700">Topic Not Found</p>
                                                <p className="text-2xl font-bold text-orange-900">
                                                    {csvResults.filter(r => r.status === 'TOPIC_NOT_FOUND').length}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Results Table */}
                                        <div className="overflow-x-auto max-h-96">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {csvResults.map((result, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium">{result.employeeName}</td>
                                                            <td className="px-4 py-3 text-sm">{result.department}</td>
                                                            <td className="px-4 py-3 text-sm">{result.topicName}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                {result.status === 'ATTENDED' && (
                                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium inline-flex items-center gap-1">
                                                                        <CheckCircle className="w-4 h-4" />Attended
                                                                    </span>
                                                                )}
                                                                {result.status === 'PENDING' && (
                                                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium inline-flex items-center gap-1">
                                                                        <XCircle className="w-4 h-4" />Pending
                                                                    </span>
                                                                )}
                                                                {result.status === 'NOT_FOUND' && (
                                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                                                        Not Found
                                                                    </span>
                                                                )}
                                                                {result.status === 'TOPIC_NOT_FOUND' && (
                                                                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                                                                        Topic Missing
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                {result.date && (
                                                                    <span>Date: {result.date} | Rating: {result.rating}/5</span>
                                                                )}
                                                                {result.message && (
                                                                    <span className="text-gray-600">{result.message}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}