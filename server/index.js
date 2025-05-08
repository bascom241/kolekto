import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRouter from './routes/userRouter.js';
import collectionRouter from './routes/collectionRouter.js';
import { connectDB } from './utils/connectDb.js';
import cookieParser from 'cookie-parser';
import paymentRouter from './routes/paymentRouter.js';
const app = express();

dotenv.config();
app.use(cors(
    {
        origin: "http://localhost:8081",
        credentials: true, // Allow credentials (cookies) to be sent
    }
));
app.use(express.json());
app.use(cookieParser())



app.use('/api/users', userRouter);
app.use("/api/collections", collectionRouter);
app.use("/api", paymentRouter);
connectDB();

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server Running on port ${port}`)
})
