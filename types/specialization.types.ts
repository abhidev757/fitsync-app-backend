import { Document } from "mongoose";


export interface ISpecialization extends Document {
  name: string;
  description: string;
  isBlock: boolean;
}