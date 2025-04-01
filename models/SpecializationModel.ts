import mongoose, { Schema } from "mongoose";
import { ISpecialization } from "../types/specialization.types"

const SpecializationSchema = new Schema<ISpecialization>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  isBlock: {
    type: Boolean,
    default: false,
},
});

const Specialization = mongoose.model<ISpecialization>("Specialization", SpecializationSchema);
export default Specialization