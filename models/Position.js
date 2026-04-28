// models/Position.js
import mongoose from 'mongoose';

const PositionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Position name is required'],
    unique: true,
    trim: true,
  },
  // ── Job Description Fields ──────────────────────────────────────
  reportingTo: {
    type: String,
    trim: true,
    default: '',
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', ''],
    default: '',
  },
  qualifications: {
    type: String,
    trim: true,
    default: '',
  },
  experienceRequired: {
    type: String,
    trim: true,
    default: '',
  },
  responsibilities: {
    type: [String],
    default: [],
  },
  requirements: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

export default mongoose.models.Position || mongoose.model('Position', PositionSchema);