import mongoose, {Document} from "mongoose";

export interface IAdmin extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    role: 'admin';
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}