// app/topics/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { DEPARTMENTS } from '@/constants/appConstants';

export default function TopicsPage() {
    const [topics, setTopics] = useState([]);
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [topicForm, setTopicForm] = useState({ topic: '', department: '' });

    useEffect(() => {
        fetchTopics(selectedDept);
    }, [selectedDept]);

    const fetchTopics = async (department = 'All') => {
        try {
            setLoading(true);
            const url = department !== 'All' ? `/api/topics?department=${department}` : '/api/topics';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setTopics(data.data);
        } catch (error) {
            console.error('Error fetching topics:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item = null) => {
        setEditItem(item);
        setTopicForm(item ? { 
            topic: item.topic, 
            department: item.department || '' 
        } : { topic: '', department: '' });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setTopicForm({ topic: '', department: '' });
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

    const deleteTopic = async (id) => {
        if (!confirm('Are you sure you want to delete this topic?')) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/topics/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                await fetchTopics(selectedDept);
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
        } finally {
            setLoading(false);
        }
    };

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
                            placeholder="Search topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                {/* Topics Table */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Training Topics ({filteredTopics.length})</h2>
                        <button 
                            onClick={() => openModal()} 
                            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />Add Topic
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredTopics.map(topic => (
                                    <tr key={topic._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{topic.topic}</td>
                                        <td className="px-6 py-4">{topic.department}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => openModal(topic)} 
                                                className="text-green-600 hover:text-green-800 mr-3"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => deleteTopic(topic._id)} 
                                                className="text-red-600 hover:text-red-800"
                                            >
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

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold mb-4">
                                    {editItem ? 'Edit' : 'Add'} Topic
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
                                        <input
                                            type="text"
                                            value={topicForm.topic}
                                            onChange={(e) => setTopicForm({ ...topicForm, topic: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                        <select
                                            value={topicForm.department}
                                            onChange={(e) => setTopicForm({ ...topicForm, department: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="">Select Department</option>
                                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={saveTopic}
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
            </div>
        </Layout>
    );
}