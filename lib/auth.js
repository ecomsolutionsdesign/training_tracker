// lib/auth.js
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function checkAuth(request, requiredRoles = []) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized - Please sign in" },
        { status: 401 }
      ),
    };
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

// Role hierarchy for permissions
export const ROLE_PERMISSIONS = {
  admin: {
    canManageUsers: true,
    canManageEmployees: true,
    canManageTopics: true,
    canManageSchedules: true,
    canMarkAttendance: true,
    canViewReports: true,
  },
  'qa-officer': {
    canManageUsers: false,
    canManageEmployees: true,
    canManageTopics: true,
    canManageSchedules: true,
    canMarkAttendance: true,
    canViewReports: true,
  },
  'department-head': {
    canManageUsers: false,
    canManageEmployees: false,
    canManageTopics: false,
    canManageSchedules: true,
    canMarkAttendance: true,
    canViewReports: true,
  },
  user: {
    canManageUsers: false,
    canManageEmployees: false,
    canManageTopics: false,
    canManageSchedules: false,
    canMarkAttendance: false,
    canViewReports: true,
  },
};

export function hasPermission(userRole, permission) {
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
}