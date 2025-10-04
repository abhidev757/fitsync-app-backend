import mongoose, { Schema, Document } from "mongoose"

export interface IWaterLog extends Document {
  userId: string
  date: string
  waterGlasses: number
}

const WaterLogSchema = new Schema<IWaterLog>({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  waterGlasses: { type: Number, required: true },
})

WaterLogSchema.index({ userId: 1, date: 1 }, { unique: true })

export default mongoose.model<IWaterLog>("WaterLog", WaterLogSchema)
