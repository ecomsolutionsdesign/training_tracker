// FILE: lib/models/Attendance.js
// ============================================
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: [true, 'Please provide schedule'],
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Please provide employee'],
  },
  attended: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate attendance records
AttendanceSchema.index({ scheduleId: 1, employeeId: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
