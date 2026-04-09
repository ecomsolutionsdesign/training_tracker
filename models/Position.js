// models/Position.js
import mongoose from 'mongoose';

const PositionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Position name is required'],
    unique: true,
    trim: true,
  }
}, { timestamps: true });

export default mongoose.models.Position || mongoose.model('Position', PositionSchema);