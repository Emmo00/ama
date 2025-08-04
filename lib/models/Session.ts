import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  creatorFid: string;
  title: string;
  description: string;
  status: 'LIVE' | 'ENDED';
  createdAt: Date;
  endsAt: Date;
}

const SessionSchema: Schema = new Schema({
  creatorFid: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['LIVE', 'ENDED'],
    default: 'LIVE',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  endsAt: {
    type: Date,
    required: true,
  },
});

// Pre-save middleware to set endsAt to createdAt + 1 week
SessionSchema.pre('save', function(next) {
  if (this.isNew && !this.endsAt) {
    const oneWeekFromNow = new Date(this.createdAt);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    this.endsAt = oneWeekFromNow;
  }
  next();
});

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
