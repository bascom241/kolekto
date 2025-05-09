import express from 'express';
import { 
  initializePayment, 
  verifyPayment,
  getPaymentDetails,
  getPayments
} from '../controller/paymentController.js';

const router = express.Router();

// GET verification endpoint
router.get('/verify-payment/:reference', verifyPayment);

// Other routes remain the same
router.post('/initialize-payment', initializePayment);
router.get('/payments/:reference', getPaymentDetails);
router.get('/payments', getPayments);

export default router;