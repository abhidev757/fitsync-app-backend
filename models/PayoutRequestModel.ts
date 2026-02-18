import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutRequest extends Document {
  trainerId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutRequestSchema: Schema = new Schema({
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'trainer', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String },
}, { timestamps: true });

const PayoutRequestModel = mongoose.model<IPayoutRequest>('PayoutRequest', PayoutRequestSchema);

export default PayoutRequestModel;
