// // FILE: app/page.js
// // ============================================
// import TrainingTracker from '@/components/TrainingTracker';

// export default function Home() {
//   return <TrainingTracker />;
// }

// app/page.js
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Calendar, Users, BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { DEPARTMENTS } from '@/constants/appConstants';

export default function Dashboard() {
    const [employees, setEmployees] = useState([]);
    const [topics, setTopics] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const getDashboardStats = () => {
        const totalSchedules = schedules.length;
        const completedTrainings = attendances.filter(a => a.attended).length;
        const avgRating = attendances.length > 0
            ? (attendances.reduce((sum, a) => sum + a.rating, 0) / attendances.length).toFixed(1)
            : 0;

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentlyCompletedTopicIds = new Set();
        attendances.forEach(a => {
            if (!a.attended) return;
            const schedule = schedules.find(s => s._id === (a.scheduleId?._id || a.scheduleId));
            if (!schedule) return;
            const scheduleDate = new Date(schedule.date);
            if (scheduleDate >= threeMonthsAgo) {
                schedule.topicIds?.forEach(topic => {
                    recentlyCompletedTopicIds.add(topic._id || topic);
                });
            }
        });

        const pendingCount = topics.filter(t => !recentlyCompletedTopicIds.has(t._id)).length;

        return { totalSchedules, completedTrainings, avgRating, pendingCount };
    };

    const getUpcomingSchedules = () => {
        const today = new Date().setHours(0, 0, 0, 0);
        return schedules
            .filter(s => new Date(s.date).setHours(0, 0, 0, 0) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);
    };

    const getSuggestedTopics = () => {
        const scheduleCount = topics.reduce((acc, t) => ({ ...acc, [t._id]: 0 }), {});
        schedules.forEach(s => {
            s.topicIds?.forEach(topic => {
                const topicId = topic._id || topic;
                if (scheduleCount[topicId] !== undefined) {
                    scheduleCount[topicId]++;
                }
            });
        });

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
                    if (scheduleAttendances.some(a => a.attended)) {
                        attendanceStats[topicId].attendedSchedules++;
                    }
                }
            });
        });

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
            .filter(t => !(t.scheduleCount > 0 && t.hasAttendance));

        return topicData
            .sort((a, b) => a.scheduleCount - b.scheduleCount || a.avgAttendance - b.avgAttendance)
            .slice(0, 5);
    };

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

    const stats = getDashboardStats();
    const upcomingSchedules = getUpcomingSchedules();
    const suggestedTopics = getSuggestedTopics();

    return (
        <Layout>
            <div className="max-w-7xl mx-auto p-6">
                {/* Stats Cards */}
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
                    {/* Upcoming Schedules */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold mb-4">Upcoming Schedules 📅</h3>
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

                    {/* Suggested Topics */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold mb-4">Suggested Training Topics 💡</h3>
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

                    {/* Department Overview */}
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
                                            <span className="text-green-700">{empCount} employees</span>
                                            <span className="text-lime-600">{topicCount} topics</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}