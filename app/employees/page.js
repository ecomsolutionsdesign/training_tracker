// app/employees/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { DEPARTMENTS, ROLES } from '@/constants/appConstants';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [employeeForm, setEmployeeForm] = useState({ name: '', department: '', role: 'user' });

    useEffect(() => {
        fetchEmployees(selectedDept);
    }, [selectedDept]);

    const fetchEmployees = async (department = 'All') => {
        try {
            setLoading(true);
            const url = department !== 'All' ? `/api/employees?department=${department}` : '/api/employees';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setEmployees(data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item = null) => {
        setEditItem(item);
        setEmployeeForm(item ? { 
            name: item.name, 
            department: item.department, 
            role: item.role 
        } : { name: '', department: '', role: 'user' });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setEmployeeForm({ name: '', department: '', role: 'user' });
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

    const deleteEmployee = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                await fetchEmployees(selectedDept);
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        } finally {
            setLoading(false);
        }
    };

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
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Employees ({filteredEmployees.length})</h2>
                        <button 
                            onClick={() => openModal()} 
                            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
                        >
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredEmployees.map(emp => (
                                    <tr key={emp._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">{emp.name}</td>
                                        <td className="px-6 py-4">{emp.department}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => openModal(emp)} 
                                                className="text-green-600 hover:text-green-800 mr-3"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => deleteEmployee(emp._id)} 
                                                className="text-red-600 hover:text-red-800"
                                            >
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

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold mb-4">
                                    {editItem ? 'Edit' : 'Add'} Employee
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={employeeForm.name}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                        <select
                                            value={employeeForm.department}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
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
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={saveEmployee}
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