// models/PositionTopicMap.js
import mongoose from 'mongoose';

/**
 * Maps a job Position to its required training Topics.
 * One document per position; topicIds is an array of Topic ObjectIds.
 */
const PositionTopicMapSchema = new mongoose.Schema(
  {
    position: {
      type: String,
      required: [true, 'Please provide a position'],
      unique: true,
      trim: true,
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