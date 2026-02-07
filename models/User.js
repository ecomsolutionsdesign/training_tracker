// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide user name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  department: {
    type: String,
    required: [true, 'Please provide department'],
    enum: [
      'Top Management', 'Marketing', 'Purchase', 'Store', 'Warehouse',
      'Maintenance', 'Production', 'Quality Control', 'HSE', 'HR', 
      'Dispatch', 'IT', 'Accounts'
    ],
  },
  role: {
    type: String,
    required: [true, 'Please provide role'],
    enum: ['admin', 'qa-officer', 'department-head', 'user'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);