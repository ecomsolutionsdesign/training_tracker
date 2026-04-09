// models/PositionTopicMap.js
import mongoose from 'mongoose';

const PositionTopicMapSchema = new mongoose.Schema(
  {
    position: {
      type: mongoose.Schema.Types.ObjectId, // Changed from String to ObjectId
      ref: 'Position',                      // Reference to the Position model
      required: [true, 'Please provide a position reference'],
      unique: true,
    },
    topicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.PositionTopicMap ||
  mongoose.model('PositionTopicMap', PositionTopicMapSchema);