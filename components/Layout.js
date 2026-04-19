// components/Layout.js
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  LogOut,
  UserCog,
  Briefcase,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: TrendingUp, public: true },
  // qa-officer and above
  { path: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'qa-officer', 'department-head'] },
  { path: '/topics', label: 'Topics', icon: BookOpen, roles: ['admin', 'qa-officer', 'department-head'] },
  { path: '/position-topics', label: 'Position Topics', icon: Briefcase, roles: ['admin', 'qa-officer', 'department-head'] },
  
  // department-head and above
  { path: '/schedules', label: 'Schedules', icon: Calendar, roles: ['admin', 'qa-officer', 'department-head'] },

  { path: '/attendance', label: 'Attendance', icon: CheckCircle, public: true },
  { path: '/pending', label: 'Pending', icon: Clock, public: true },
  { path: '/training-status', label: 'Training Status', icon: CheckCircle, public: true },
  { path: '/reports', label: 'Reports', icon: FileText, public: true },

  // admin only
  { path: '/users', label: 'Users', icon: UserCog, roles: ['admin'] },
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const visibleNav = NAV_ITEMS.filter(
    (item) => item.public || (session && (!item.roles || item.roles.includes(session?.user?.role)))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-linear-to-r from-green-900 to-green-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-3 py-2">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-7 h-7" />
              <h1 className="text-2xl font-bold tracking-tight">
                Employee Training Management System
              </h1>
            </div>

            {/* Replace the existing session block in the header: */}
            {session ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-xs text-green-200 mt-0.5">
                    {session.user.role} · {session.user.department}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 transition text-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-3 py-1.5 bg-white text-green-800 hover:bg-green-50 rounded-lg flex items-center gap-1.5 transition text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>

          {/* Nav tabs */}
          <nav className="flex gap-1.5 flex-wrap">
            {visibleNav.map(({ path, label, icon: Icon }) => {
              const active = pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => router.push(path)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${active
                    ? 'bg-white text-green-700 shadow'
                    : 'bg-green-800 text-white hover:bg-green-700'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex grow">{children}</div>

      {/* Footer */}
      <footer className="bg-linear-to-r from-green-900 to-green-700 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-1 text-sm">
            <p>© {new Date().getFullYear()} Employee Training Management System. All rights reserved.</p>
            <p>
              Developed by <span className="font-semibold">Mustanshir Vohra</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}