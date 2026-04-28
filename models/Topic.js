// FILE: models/Topic.js
import mongoose from 'mongoose';

const TopicSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: [true, 'Please provide topic name'],
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
  duration: {
    type: String,
    trim: true,
    default: '',
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Topic || mongoose.model('Topic', TopicSchema);