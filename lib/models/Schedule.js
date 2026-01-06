// FILE: lib/models/Schedule.js
// ============================================
import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Please provide training date'],
  },
  topicIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Please provide at least one topic']
  }],
  trainerName: {
    type: String,
    required: [true, 'Please provide trainer name'],
    trim: true,
  },
  employeeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
