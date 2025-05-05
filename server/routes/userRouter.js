import express from 'express';
import { register } from '../controller/authController';

const router = express.Router();

router.post("/register",register)
export default router;