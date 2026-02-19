// FILE: models/Employee.js
// ============================================
import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide employee name'],
    trim: true,
  },
  department: {
    type: String,
    required: [true, 'Please provide department'],
    enum: [
      'Top Management', 'Marketing', 'Purchase', 'Store', 'Warehouse',
      'Maintenance', 'Production', 'Quality Control', 'HSE', 'HR', 'Dispatch', 'IT', 'Accounts'
    ],
  },
  role: {
    type: String,
    required: [true, 'Please provide role'],
    enum: ['admin', 'qa-officer', 'department-head', 'user'],
    default: 'user',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);