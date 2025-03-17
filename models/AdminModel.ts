import mongoose from "mongoose";
import bcrypt from 'bcryptjs'
import { IAdmin } from "../types/admin.types";

const adminSchema = new mongoose.Schema<IAdmin>(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin'],
            default: 'admin'
        },
    },
    {
        timestamps: true
    }
);

adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

adminSchema.methods.matchPassword = async function(entredPassword: string) {
    console.log(entredPassword, this.password);
    console.log(await bcrypt.compare(entredPassword, this.password));
    
    return await bcrypt.compare(entredPassword, this.password)
}

const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;