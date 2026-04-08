// app/employees/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Plus, Edit2, Trash2, Search, FileText, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';
import { DEPARTMENTS, ROLES, POSITIONS } from '@/constants/appConstants';
import { useSession } from 'next-auth/react'; // adjust to your auth hook

export default function EmployeesPage() {
    const { data: session, status } = useSession();
    const isAdmin = session?.user?.role === 'admin';

    const [employees, setEmployees] = useState([]);
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeactivated, setShowDeactivated] = useState(false); // admin toggle
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(null);
    const [togglingId, setTogglingId] = useState(null); // which employee is being toggled
    const [employeeForm, setEmployeeForm] = useState({
        name: '',
        department: '',
        position: '',
        role: 'user',
    });

    useEffect(() => {
        console.log('[EMPLOYEES] useEffect triggered:', { status, isAdmin, selectedDept });
        if (status === "authenticated") {
            fetchEmployees(selectedDept, isAdmin);
        }
    }, [selectedDept, isAdmin, status]);

    const fetchEmployees = async (department = 'All', showAll = false) => {
        console.log('[EMPLOYEES] fetchEmployees called with:', { department, showAll, isAdmin });
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (department !== 'All') params.set('department', department);
            if (showAll) params.set('showAll', 'true');

            const url = `/api/employees?${params.toString()}`;
            console.log('[EMPLOYEES] Fetching URL:', url);

            const res = await fetch(url);

            if (!res.ok) {
                const errorData = await res.json();
                console.error('[EMPLOYEES] Server error:', errorData);
                return;
            }

            const data = await res.json();
            console.log('[EMPLOYEES] Response data:', {
                success: data.success,
                total: data.data?.length,
                active: data.data?.filter(e => e.isActive !== false).length,
                inactive: data.data?.filter(e => e.isActive === false).length,
                sample: data.data?.slice(0, 3).map(e => ({ name: e.name, isActive: e.isActive }))
            });

            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error('[EMPLOYEES] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Modal helpers ──────────────────────────────────────────────────────────

    const openModal = (item = null) => {
        setEditItem(item);
        setEmployeeForm(
            item
                ? { name: item.name, department: item.department, position: item.position || '', role: item.role }
                : { name: '', department: '', position: '', role: 'user' }
        );
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setEmployeeForm({ name: '', department: '', position: '', role: 'user' });
    };

    // ── Save / Delete ──────────────────────────────────────────────────────────

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
                await fetchEmployees(selectedDept, isAdmin);
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
        if (!confirm('Permanently delete this employee? All their data will be lost. Consider deactivating instead.')) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                await fetchEmployees(selectedDept, isAdmin);
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Activate / Deactivate ──────────────────────────────────────────────────

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
                await fetchEmployees(selectedDept, isAdmin);
            } else {
                alert(`Failed to ${action} employee: ${data.error}`);
            }
        } catch (error) {
            console.error('Error toggling employee status:', error);
        } finally {
            setTogglingId(null);
        }
    };

    // ── PDF Download ───────────────────────────────────────────────────────────

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

    // ── Filtered list ──────────────────────────────────────────────────────────

    const filteredEmployees = useMemo(() => {
        let result = selectedDept === 'All'
            ? employees
            : employees.filter((e) => e.department === selectedDept);

        // For non-admins, only show active. For admins, respect the toggle.
        if (!isAdmin) {
            result = result.filter(e => e.isActive !== false);
        } else if (!showDeactivated) {
            result = result.filter(e => e.isActive !== false); // hide inactive until toggled
        }
        // When isAdmin && showDeactivated: show everything

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(
                (e) =>
                    e.name.toLowerCase().includes(s) ||
                    e.department.toLowerCase().includes(s) ||
                    (e.position || '').toLowerCase().includes(s)
            );
        }
        return result;
    }, [employees, selectedDept, searchTerm, isAdmin, showDeactivated]);

    // Count from the full fetched list, not filteredEmployees:
    const activeCount = employees.filter(e => e.isActive !== false).length;
    const inactiveCount = employees.filter(e => e.isActive === false).length;

    // ── Render ─────────────────────────────────────────────────────────────────

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
                        {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
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

                    {/* Admin-only: toggle to show deactivated employees */}
                    {isAdmin && (
                        <button
                            onClick={() => setShowDeactivated(prev => !prev)}
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

                {/* Summary badges (admin only, when showing all) */}
                {isAdmin && showDeactivated && (
                    <div className="mb-4 flex gap-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            ✓ Active: {activeCount}
                        </span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            ✗ Inactive: {inactiveCount}
                        </span>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">
                            Employees ({filteredEmployees.length})
                        </h2>
                        <button
                            onClick={() => openModal()}
                            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Employee
                        </button>
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
                                        <td className="px-4 py-3 text-gray-600">{emp.position || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                {emp.role}
                                            </span>
                                        </td>

                                        {/* Status column — admin + showDeactivated mode only */}
                                        {isAdmin && showDeactivated && (
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {emp.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        )}

                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => downloadTrainingProgram(emp)}
                                                disabled={pdfLoading === emp._id || !emp.isActive}
                                                title={!emp.isActive ? 'Employee is inactive' : 'Download Training Program PDF'}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <FileText className="w-4 h-4" />
                                                {pdfLoading === emp._id ? 'Generating…' : 'Download PDF'}
                                            </button>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {/* Edit — only for active employees */}
                                                <button
                                                    onClick={() => openModal(emp)}
                                                    disabled={!emp.isActive}
                                                    title={!emp.isActive ? 'Reactivate to edit' : 'Edit'}
                                                    className="text-green-600 hover:text-green-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                {/* Activate / Deactivate toggle — admin only */}
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => toggleActive(emp)}
                                                        disabled={togglingId === emp._id}
                                                        title={emp.isActive ? 'Deactivate employee' : 'Reactivate employee'}
                                                        className={`transition disabled:opacity-40 ${emp.isActive
                                                            ? 'text-amber-500 hover:text-amber-700'
                                                            : 'text-green-500 hover:text-green-700'
                                                            }`}
                                                    >
                                                        {emp.isActive
                                                            ? <ToggleRight className="w-5 h-5" />
                                                            : <ToggleLeft className="w-5 h-5" />
                                                        }
                                                    </button>
                                                )}

                                                {/* Hard delete — admin only, only shown for inactive employees */}
                                                {isAdmin && !emp.isActive && (
                                                    <button
                                                        onClick={() => deleteEmployee(emp._id)}
                                                        title="Permanently delete employee"
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
                                    {/* Name */}
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

                                    {/* Department */}
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
                                            {DEPARTMENTS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Position */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                        <select
                                            value={employeeForm.position}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="">Select Position</option>
                                            {POSITIONS.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Training topics are auto-assigned based on position.
                                        </p>
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
                                        <select
                                            value={employeeForm.role}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            {ROLES.map((r) => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
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