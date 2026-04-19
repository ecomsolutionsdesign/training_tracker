// app/topics/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, Search, Clock, User } from 'lucide-react';
import { DEPARTMENTS, TRAINING_DURATIONS } from '@/constants/appConstants';

export default function TopicsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const [topics, setTopics] = useState([]);
  const [trainers, setTrainers] = useState([]);           // NEW
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topicForm, setTopicForm] = useState({
    topic: '',
    department: '',
    duration: '',
    trainer: '',
  });
  const isQaOfficer = session?.user?.role === 'qa-officer';
  const canEdit = isAdmin || isQaOfficer;
  const canDelete = isAdmin;
  const canAdd = isAdmin || isQaOfficer;

  useEffect(() => {
    fetchTopics(selectedDept);
    fetchTrainers();             // NEW
  }, [selectedDept]);

  const fetchTrainers = async () => {
    try {
      const res = await fetch('/api/users/trainers');
      const data = await res.json();
      if (data.success) setTrainers(data.data);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

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
    setTopicForm(
      item
        ? {
          topic: item.topic,
          department: item.department || '',
          duration: item.duration || '',
          trainer: item.trainer?._id?.toString() || '',  // populate gives object
        }
        : { topic: '', department: '', duration: '', trainer: '' }
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setTopicForm({ topic: '', department: '', duration: '', trainer: '' });
  };

  const saveTopic = async () => {
    if (!topicForm.topic || !topicForm.department) {
      alert('Topic name and Department are required.');
      return;
    }
    try {
      setLoading(true);
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `/api/topics/${editItem._id}` : '/api/topics';

      // Send null if no trainer selected so MongoDB stores null not empty string
      const payload = {
        ...topicForm,
        trainer: topicForm.trainer || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTopics(selectedDept);
        closeModal();
      } else {
        alert(`Failed to save topic: ${data.error}`);
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
      if (data.success) await fetchTopics(selectedDept);
    } catch (error) {
      console.error('Error deleting topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = useMemo(() => {
    let result = selectedDept === 'All' ? topics : topics.filter((t) => t.department === selectedDept);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.topic.toLowerCase().includes(s) ||
          t.department.toLowerCase().includes(s) ||
          (t.trainer?.name || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [topics, selectedDept, searchTerm]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex gap-4 items-center flex-wrap">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <div className="relative grow max-w-sm">
            <input
              type="text"
              placeholder="Search topics…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Training Topics ({filteredTopics.length})</h2>
            {canAdd && (
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Topic
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Trainer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTopics.map((topic) => (
                  <tr key={topic._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{topic.topic}</td>
                    <td className="px-4 py-3 text-gray-600">{topic.department}</td>
                    <td className="px-4 py-3">
                      {topic.duration ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                          <Clock className="w-3 h-3" /> {topic.duration}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {topic.trainer?.name ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                          <User className="w-3 h-3 text-gray-400" /> {topic.trainer.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <button onClick={() => openModal(topic)} className="text-green-600 hover:text-green-800 mr-3">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => deleteTopic(topic._id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTopics.length === 0 && (
              <div className="text-center py-8 text-gray-500">No topics found matching the current filters.</div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-4">{editItem ? 'Edit' : 'Add'} Topic</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={topicForm.topic}
                      onChange={(e) => setTopicForm({ ...topicForm, topic: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={topicForm.department}
                      onChange={(e) => {
                        const dept = e.target.value;
                        const defaultTrainer = trainers.find(t => t.department === dept);
                        setTopicForm({
                          ...topicForm,
                          department: dept,
                          trainer: defaultTrainer?._id || topicForm.trainer || ''
                        });
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Duration</label>
                    <select
                      value={topicForm.duration}
                      onChange={(e) => setTopicForm({ ...topicForm, duration: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">Select Duration</option>
                      {TRAINING_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Trainer</label>
                    {/* CHANGED: now a dropdown of Users with eligible roles */}
                    <select
                      value={topicForm.trainer}
                      onChange={(e) => setTopicForm({ ...topicForm, trainer: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">Select Trainer</option>
                      {trainers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.department})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Only admin, qa-officer, and department-head users are shown.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveTopic}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving…' : 'Save'}
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