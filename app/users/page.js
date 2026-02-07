// app/users/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, Search, Shield, ShieldOff } from 'lucide-react';
import { DEPARTMENTS, ROLES } from '@/constants/appConstants';

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        department: '',
        role: 'user',
        isActive: true
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
            router.push('/');
        }
    }, [status, session, router]);

    useEffect(() => {
        if (session?.user?.role === 'admin') {
            fetchUsers();
        }
    }, [session]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/users');
            const data = await res.json();
            if (data.success) setUsers(data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item = null) => {
        setEditItem(item);
        setUserForm(item ? {
            name: item.name,
            email: item.email,
            password: '', // Don't populate password for security
            department: item.department,
            role: item.role,
            isActive: item.isActive
        } : {
            name: '',
            email: '',
            password: '',
            department: '',
            role: 'user',
            isActive: true
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setUserForm({
            name: '',
            email: '',
            password: '',
            department: '',
            role: 'user',
            isActive: true
        });
    };

    const saveUser = async () => {
        if (!userForm.name || !userForm.email || !userForm.department || !userForm.role) {
            alert('Please fill in all required fields');
            return;
        }

        if (!editItem && !userForm.password) {
            alert('Password is required for new users');
            return;
        }

        try {
            setLoading(true);
            const method = editItem ? 'PUT' : 'POST';
            const url = editItem ? `/api/users/${editItem._id}` : '/api/users';

            const payload = editItem
                ? userForm.password
                    ? userForm // Include password if provided
                    : { ...userForm, password: undefined } // Exclude password if not provided
                : userForm;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                await fetchUsers();
                closeModal();
                alert(`User ${editItem ? 'updated' : 'created'} successfully!`);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                await fetchUsers();
                alert('User deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/users/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...user, isActive: !user.isActive }),
            });

            const data = await res.json();
            if (data.success) {
                await fetchUsers();
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (status === 'loading') {
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

    if (session?.user?.role !== 'admin') {
        return null;
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto p-6">
                {/* Search */}
                <div className="mb-6 flex gap-4 items-center flex-wrap">
                    <div className="relative grow max-w-sm">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">User Management ({filteredUsers.length})</h2>
                        <button
                            onClick={() => openModal()}
                            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />Add User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">{user.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">{user.department}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'qa-officer' ? 'bg-blue-100 text-blue-800' :
                                                user.role === 'department-head' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleUserStatus(user)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    user.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {user.isActive ? (
                                                    <>
                                                        <Shield className="w-3 h-3 inline mr-1" />Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldOff className="w-3 h-3 inline mr-1" />Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="text-green-600 hover:text-green-800 mr-3"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No users found.</p>
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
                                    {editItem ? 'Edit' : 'Add'} User
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={userForm.name}
                                            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={userForm.email}
                                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password {!editItem && <span className="text-red-500">*</span>}
                                            {editItem && <span className="text-gray-500 text-xs">(Leave blank to keep current password)</span>}
                                        </label>
                                        <input
                                            type="password"
                                            value={userForm.password}
                                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder={editItem ? "Leave blank to keep current password" : "Enter password"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={userForm.department}
                                            onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="">Select Department</option>
                                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={userForm.role}
                                            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={userForm.isActive}
                                                onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                                                className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Active User</span>
                                        </label>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm font-semibold text-blue-900 mb-1">Role Permissions:</p>
                                        <ul className="text-xs text-blue-800 space-y-1">
                                            <li><strong>Admin:</strong> Full access to all features</li>
                                            <li><strong>QA Officer:</strong> Can manage employees, topics, schedules, and attendance</li>
                                            <li><strong>Department Head:</strong> Can manage schedules and mark attendance</li>
                                            <li><strong>User:</strong> View-only access to reports</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={saveUser}
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