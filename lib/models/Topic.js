// FILE: lib/models/Topic.js
// ============================================
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
}, {
  timestamps: true,
});

export default mongoose.models.Topic || mongoose.model('Topic', TopicSchema);
