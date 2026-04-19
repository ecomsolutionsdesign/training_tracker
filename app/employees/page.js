'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, Search, FileText, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';
import { DEPARTMENTS, ROLES } from '@/constants/appConstants'; // FIX: removed POSITIONS import
import { useSession } from 'next-auth/react';

export default function EmployeesPage() {
    const { data: session, status } = useSession();
    const isAdmin = session?.user?.role === 'admin';

    const [employees, setEmployees] = useState([]);
    const [positionsList, setPositionsList] = useState([]); // FIX: fetch from API
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeactivated, setShowDeactivated] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [employeeForm, setEmployeeForm] = useState({
        name: '',
        department: '',
        position: '', // stores the Position ObjectId
        role: 'user',
    });
    const isQaOfficer = session?.user?.role === 'qa-officer';
    const isDeptHead = session?.user?.role === 'department-head';

    const canEdit = isAdmin || isQaOfficer;
    const canToggle = isAdmin || isQaOfficer;
    const canDelete = isAdmin;
    const canAdd = isAdmin || isQaOfficer;

    // FIX: include showDeactivated in deps so toggling it re-fetches
    useEffect(() => {
        if (status === 'authenticated') {
            fetchEmployees(selectedDept, isAdmin && showDeactivated);
        }
    }, [selectedDept, isAdmin, status, showDeactivated]);

    // FIX: fetch positions on mount
    useEffect(() => {
        fetchPositions();
    }, []);

    const fetchPositions = async () => {
        const res = await fetch('/api/positions');
        const data = await res.json();
        if (data.success) setPositionsList(data.data);
    };

    const fetchEmployees = async (department = 'All', showAll = false) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (department !== 'All') params.set('department', department);
            if (showAll) params.set('showAll', 'true');

            const res = await fetch(`/api/employees?${params.toString()}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.success) setEmployees(data.data);
        } catch (error) {
            console.error('[EMPLOYEES] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item = null) => {
        setEditItem(item);
        setEmployeeForm(
            item
                ? {
                    name: item.name,
                    department: item.department,
                    // FIX: position is now a populated object; store its _id for the form
                    position: item.position?._id?.toString() || '',
                    role: item.role,
                }
                : { name: '', department: '', position: '', role: 'user' }
        );
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setEmployeeForm({ name: '', department: '', position: '', role: 'user' });
    };

    const saveEmployee = async () => {
        if (!employeeForm.name || !employeeForm.department) {
            alert('Name and Department are required.');
            return;
        }
        try {
            setLoading(true);
            const method = editItem ? 'PUT' : 'POST';
            const url = editItem ? `/api/employees/${editItem._id}` : '/api/employees';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeForm),
            });
            const data = await res.json();

            if (data.success) {
                await fetchEmployees(selectedDept, isAdmin && showDeactivated);
                closeModal();
            } else {
                alert(`Failed to save employee: ${data.error}`);
            }
        } catch (error) {
            console.error('Error saving employee:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteEmployee = async (id) => {
        if (!confirm('Permanently delete this employee? Consider deactivating instead.')) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) await fetchEmployees(selectedDept, isAdmin && showDeactivated);
        } catch (error) {
            console.error('Error deleting employee:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (employee) => {
        const action = employee.isActive ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${employee.name}?`)) return;

        try {
            setTogglingId(employee._id);
            const res = await fetch(`/api/employees/${employee._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !employee.isActive }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchEmployees(selectedDept, isAdmin && showDeactivated);
            } else {
                alert(`Failed to ${action} employee: ${data.error}`);
            }
        } catch (error) {
            console.error('Error toggling employee status:', error);
        } finally {
            setTogglingId(null);
        }
    };

    const downloadTrainingProgram = async (employee) => {
        try {
            setPdfLoading(employee._id);
            const res = await fetch(`/api/training-program-pdf?employeeId=${employee._id}`);
            if (!res.ok) {
                const err = await res.json();
                alert(`PDF Error: ${err.error}`);
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Training-Program-${employee.name.replace(/\s+/g, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF download error:', error);
            alert('Failed to generate PDF.');
        } finally {
            setPdfLoading(null);
        }
    };

    const filteredEmployees = useMemo(() => {
        let result = [...employees];
        if (selectedDept !== 'All') result = result.filter((e) => e.department === selectedDept);
        if (!isAdmin || !showDeactivated) result = result.filter((e) => e.isActive !== false);
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(
                (e) =>
                    (e.name?.toLowerCase() || '').includes(s) ||
                    (e.department?.toLowerCase() || '').includes(s) ||
                    // FIX: position is now a populated object
                    (e.position?.name?.toLowerCase() || '').includes(s)
            );
        }
        return result;
    }, [employees, selectedDept, searchTerm, isAdmin, showDeactivated]);

    const activeCount = employees.filter((e) => e.isActive !== false).length;
    const inactiveCount = employees.filter((e) => e.isActive === false).length;

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
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => setShowDeactivated((prev) => !prev)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition text-sm font-medium ${showDeactivated
                                ? 'bg-amber-50 border-amber-400 text-amber-700'
                                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                        >
                            {showDeactivated ? (
                                <><Eye className="w-4 h-4" /> Showing All (incl. Inactive)</>
                            ) : (
                                <><EyeOff className="w-4 h-4" /> Show Inactive Employees</>
                            )}
                        </button>
                    )}
                </div>

                {isAdmin && showDeactivated && (
                    <div className="mb-4 flex gap-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">✓ Active: {activeCount}</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">✗ Inactive: {inactiveCount}</span>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Employees ({filteredEmployees.length})</h2>
                        {canAdd && (
                            <button
                                onClick={() => openModal()}
                                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Employee
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    {isAdmin && showDeactivated && (
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Training PDF</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredEmployees.map((emp) => (
                                    <tr
                                        key={emp._id}
                                        className={`hover:bg-gray-50 transition ${!emp.isActive ? 'opacity-60 bg-gray-50' : ''}`}
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {emp.name}
                                            {!emp.isActive && (
                                                <span className="ml-2 text-xs text-red-500 font-normal">(Inactive)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                                        {/* FIX: position is populated, use .name */}
                                        <td className="px-4 py-3 text-gray-600">{emp.position?.name || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{emp.role}</span>
                                        </td>

                                        {isAdmin && showDeactivated && (
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                    {emp.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        )}

                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => downloadTrainingProgram(emp)}
                                                disabled={pdfLoading === emp._id || !emp.isActive}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <FileText className="w-4 h-4" />
                                                {pdfLoading === emp._id ? 'Generating…' : 'Download PDF'}
                                            </button>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {canEdit && (
                                                    <button
                                                        onClick={() => openModal(emp)}
                                                        disabled={!emp.isActive}
                                                        className="text-green-600 hover:text-green-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {canToggle && (
                                                    <button
                                                        onClick={() => toggleActive(emp)}
                                                        disabled={togglingId === emp._id}
                                                        className={`transition disabled:opacity-40 ${emp.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-green-500 hover:text-green-700'}`}
                                                    >
                                                        {emp.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                    </button>
                                                )}

                                                {canDelete && !emp.isActive && (
                                                    <button
                                                        onClick={() => deleteEmployee(emp._id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No employees found matching the current filters.
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold mb-4">
                                    {editItem ? 'Edit' : 'Add'} Employee
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={employeeForm.name}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={employeeForm.department}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="">Select Department</option>
                                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                        {/* FIX: use fetched positionsList, value is _id, display is name */}
                                        <select
                                            value={employeeForm.position}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="">Select Position</option>
                                            {positionsList.map((p) => (
                                                <option key={p._id} value={p._id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Training topics are auto-assigned based on position.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
                                        <select
                                            value={employeeForm.role}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={saveEmployee}
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