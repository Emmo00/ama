import mongoose, { Schema, Document } from 'mongoose';

export interface IArchivedSessionStats extends Document {
  sessionId: mongoose.Types.ObjectId;
  totalTips: number;
  totalParticipants: number;
  totalQuestions: number;
  archivedAt: Date;
}

const ArchivedSessionStatsSchema: Schema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    unique: true,
    index: true,
  },
  totalTips: {
    type: Number,
    required: true,
    min: 0,
  },
  totalParticipants: {
    type: Number,
    required: true,
    min: 0,
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 0,
  },
  archivedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ArchivedSessionStats || mongoose.model<IArchivedSessionStats>('ArchivedSessionStats', ArchivedSessionStatsSchema);
