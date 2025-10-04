import mongoose, { Schema, Document } from 'mongoose';
import { IFitnessData } from '../types/fitness.types';

export interface IFitnessDocument extends IFitnessData, Document {}

const FitnessSchema = new Schema<IFitnessDocument>({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  steps: { type: Number, default: 0 },
  sleepHours: { type: Number, default: 0 },
  caloriesBurned: { type: Number, default: 0 },
  source: { type: String, default: 'GoogleFit' },
});

export default mongoose.model<IFitnessDocument>('FitnessData', FitnessSchema);
