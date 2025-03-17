import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch(err) {
        if(err instanceof Error) {
            console.error(`Error:${err.message}`);
        } else {
            console.error('Unknown error occured');
        }
        process.exit(1)
    }
}

export default connectDB