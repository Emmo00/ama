import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  askerFid: string;
  content: string;
  answer?: string;
  createdAt: Date;
}

const QuestionSchema: Schema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  askerFid: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
