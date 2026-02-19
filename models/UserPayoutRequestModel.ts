import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPayoutRequest extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserPayoutRequestSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String },
}, { timestamps: true });

const UserPayoutRequestModel = mongoose.model<IUserPayoutRequest>('UserPayoutRequest', UserPayoutRequestSchema);

export default UserPayoutRequestModel;
