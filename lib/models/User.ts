import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fid: string;
  username: string;
  pfpUrl?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  fid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  pfpUrl: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
