import express from 'express';
const router = express.Router();
import { initializePayment, verifyPayment, getPaymentDetails } from '../controller/paymentController.js';

router.post('/initialize-payment', initializePayment);
router.get('/verify-payment/:reference', verifyPayment);
router.get('/payments/:reference', getPaymentDetails); // New endpoint

export default router;