import mongoose, { Schema, Document } from 'mongoose';

export interface IToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
}

export interface ITip extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  senderFid: string;
  recipientFid: string;
  amount: string;
  amountFormatted: string;
  token?: IToken;
  txHash: string;
  verified: boolean;
  createdAt: Date;
}

const TokenSchema: Schema = new Schema({
  symbol: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  decimals: {
    type: Number,
    required: true,
  },
  chainId: {
    type: Number,
    required: true,
  },
}, { _id: false });

const TipSchema: Schema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  senderFid: {
    type: String,
    required: true,
    index: true,
  },
  recipientFid: {
    type: String,
    required: true,
    index: true,
  },
  amount: {
    type: String,
    required: true,
  },
  amountFormatted: {
    type: String,
    required: false,
  },
  token: {
    type: TokenSchema,
    required: false,
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Tip || mongoose.model<ITip>('Tip', TipSchema);
