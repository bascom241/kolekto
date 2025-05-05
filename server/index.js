import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRouter from './routes/userRouter.js';
import { connectDB } from './utils/connectDb.js';
import cookieParser from 'cookie-parser';

const app = express();

dotenv.config();
app.use(cors(
    {
        origin: "*",
        credentials: true, // Allow credentials (cookies) to be sent
    }
));
app.use(express.json());
app.use(cookieParser())



app.use('/api/users', userRouter);

connectDB();

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server Running on port ${port}`)
})
