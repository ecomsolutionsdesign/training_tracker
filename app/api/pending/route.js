// FILE: app/api/pending/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Topic from '@/models/Topic';
import Schedule from '@/models/Schedule';
import Attendance from '@/models/Attendance';
import { UNIVERSAL_DEPARTMENTS } from '@/constants/appConstants';

// ADDED: Define universal departments
// const UNIVERSAL_DEPARTMENTS = ['Top Management', 'HSE', 'HR'];

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    
    // Calculate date 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Get employees based on filter
    let employees;
    if (employeeId) {
      employees = await Employee.find({ _id: employeeId });
    } else if (department && department !== 'All') {
      employees = await Employee.find({ department });
    } else {
      employees = await Employee.find();
    }
    
    const pendingData = [];
    
    for (const employee of employees) {
      // CORRECTED: Get applicable topics (department-specific + universal)
      const applicableTopics = await Topic.find({
        $or: [
          { department: employee.department }, // Department-specific topics
          { department: { $in: UNIVERSAL_DEPARTMENTS } } // Universal topics
        ]
      });
      const applicableTopicIds = applicableTopics.map(t => t._id);

      // 2. Find recent schedules that include ANY of the applicable topics AND the employee
      const attendedSchedules = await Schedule.find({
        employeeIds: employee._id, // Employee was invited
        date: { $gte: threeMonthsAgo },
        topicIds: { $in: applicableTopicIds } // Schedule covered a relevant topic
      });

      // 3. Get attendances for these relevant schedules
      const recentAttendances = await Attendance.find({
        employeeId: employee._id,
        scheduleId: { $in: attendedSchedules.map(s => s._id) },
        attended: true
      });
      
      // 4. Get the full list of all topic IDs completed by this employee
      const completedTopicIds = new Set();
      
      const attendedScheduleIds = recentAttendances.map(att => att.scheduleId.toString());

      // Iterate through the schedules the employee was invited to and attended
      attendedSchedules
        .filter(schedule => attendedScheduleIds.includes(schedule._id.toString()))
        .forEach(schedule => {
          // Add all topics from this attended schedule to the completed set
          schedule.topicIds.forEach(topicId => completedTopicIds.add(topicId.toString()));
        });
      
      // 5. CORRECTED: Find pending topics from applicable topics (not just department topics)
      const pendingTopics = applicableTopics.filter(
        topic => !completedTopicIds.has(topic._id.toString())
      );
      
      if (pendingTopics.length > 0) {
        pendingData.push({
          employee: employee,
          pendingTopics: pendingTopics
        });
      }
    }
    
    return NextResponse.json({ success: true, data: pendingData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}