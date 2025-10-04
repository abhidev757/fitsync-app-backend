import mongoose, { Schema, Document } from 'mongoose';

export interface IUserWalletTransaction extends Document {
  trainerId: mongoose.Types.ObjectId;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  sessionId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserWalletTransactionSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  reason: { type: String, required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  createdAt: { type: Date, default: Date.now }
});
const UserWalletModel = mongoose.model<IUserWalletTransaction>('UserWalletTransaction', UserWalletTransactionSchema);

export default UserWalletModel;
