// components/Layout.js
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, Users, BookOpen, CheckCircle, Download, Clock, TrendingUp, FileText, LogOut, UserCog } from 'lucide-react';

export default function Layout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    const isActive = (path) => pathname === path;

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push('/auth/signin');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-linear-to-r from-green-900 to-green-700 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-8xl mx-auto px-2 py-2">
                    {/* Title and User Info */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-8 h-8" />
                            <h1 className="text-3xl font-bold">
                                Employee Training Management System
                            </h1>
                        </div>
                        
                        {session && (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-medium">{session.user.name}</p>
                                    <p className="text-xs text-green-200">{session.user.role} • {session.user.department}</p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => router.push('/')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                isActive('/')
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4 inline mr-2" />Dashboard
                        </button>
                        <button
                            onClick={() => router.push('/employees')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                isActive('/employees')
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                            }`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />Employees
                        </button>
                        <button
                            onClick={() => router.push('/topics')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                isActive('/topics')
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                            }`}
                        >
                            <BookOpen className="w-4 h-4 inline mr-2" />Topics
                        </button>
                        <button
                            onClick={() => router.push('/schedules')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                isActive('/schedules')
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                            }`}
                        >
                            <Calendar className="w-4 h-4 inline mr-2" />Schedules
                        </button>
                        <button
                            onClick={() => router.push('/attendance')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                isActive('/attendance')
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                            }`}
                        >
                            <CheckCircle className="w-4 h-4 inline mr-2" />Attendance
                        </button>
                        <button
                            onClick={() => router.push('/pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                isActive('/pending')
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                            }`}
                        >
                            <Clock className="w-4 h-4 inline mr-2" />Pending
                        </button>
                        <button
                            onClick={() => router.push('/training-status')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                isActive('/training-status')
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                            }`}
                        >
                            <CheckCircle className="w-4 h-4 inline mr-2" />Training Status
                        </button>
                        <button
                            onClick={() => router.push('/reports')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                isActive('/reports')
                                    ? 'bg-white text-green-700 shadow-md'
                                    : 'bg-green-800 text-white hover:bg-green-700'
                            }`}
                        >
                            <FileText className="w-4 h-4 inline mr-2" />Reports
                        </button>
                        {session?.user?.role === 'admin' && (
                            <button
                                onClick={() => router.push('/users')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    isActive('/users')
                                        ? 'bg-white text-green-700 shadow-md'
                                        : 'bg-green-800 text-white hover:bg-green-700'
                                }`}
                            >
                                <UserCog className="w-4 h-4 inline mr-2" />Users
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex grow">
                {children}
            </div>

            {/* Footer */}
            <footer className="bg-linear-to-r from-green-900 to-green-700 text-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                        <p className="text-sm">
                            © {new Date().getFullYear()} Employee Training Management System. All rights reserved.
                        </p>
                        <p className="text-sm">
                            Developed by <span className="font-semibold">Mustanshir Vohra</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}