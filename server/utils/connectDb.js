import dotenv from 'dotenv';
import mongoose from 'mongoose';


export const connectDB = async () => {
    const url = process.env.MONGO_URL;
    try{
        await mongoose.connect(url);
        console.log("MongoDB Connected Successfully")
    }catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}