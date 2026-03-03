import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletTransaction extends Document {
  trainerId: mongoose.Types.ObjectId;
  amount: number;
  type: 'credit' | 'debit' | 'pending';
  reason: string;
  sessionId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WalletTransactionSchema: Schema = new Schema({
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'trainer', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit', 'pending'], required: true },
  reason: { type: String, required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  createdAt: { type: Date, default: Date.now }
});
const WalletModel = mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);

export default WalletModel;
