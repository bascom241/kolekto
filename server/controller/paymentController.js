import Payment from "../models/Payment.js";
import axios from "axios";

const initializePayment = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, amount } = req.body;
    if (!fullName || !email || !phoneNumber || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log(fullName, email, phoneNumber, amount);

    console.log("Using Paystack key:", process.env.PAYSTACK_API_KEY);

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack requires the amount to be in kobo
        callback_url: "http://localhost:8081/success", // Frontend success route
        metadata: {
          fullName,
          phoneNumber,
          amount,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Paystack response:", response.data);

    const payment = new Payment({
      fullName,
      email,
      phoneNumber,
      amount,
      status: "pending",
      paymentReference: response.data.data.reference,
    });

    await payment.save();

    console.log(payment);

    res.status(200).json({
      message: "Payment initialized successfully",
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const verifyPayment = async (req, res) => {
    const { reference } = req.params;
  
    try {
      console.log(`Verifying payment with reference: ${reference}`);
  
      // Check if PAYSTACK_SECRET_KEY is set
      if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error('PAYSTACK_SECRET_KEY is not set');
        return res.status(500).json({ message: 'Server configuration error: Missing Paystack secret key' });
      }
  
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      console.log('Paystack verification response:', response.data);
  
      if (response.data.data.status === 'success') {
        const payment = await Payment.findOneAndUpdate(
          { paymentReference: reference },
          { status: 'successful' },
          { new: true }
        );
  
        if (!payment) {
          console.error(`Payment with reference ${reference} not found in database`);
          return res.status(404).json({ success: false, message: 'Payment record not found' });
        }
  
        console.log(`Payment updated: ${payment}`);
        return res.json({ success: true, message: 'Payment verified successfully' });
      } else {
        console.log(`Payment not successful. Status: ${response.data.data.status}`);
        return res.status(400).json({ success: false, message: 'Payment not successful' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error.response ? error.response.data : error.message);
      return res.status(500).json({ message: `Failed to verify payment: ${error.message}` });
    }
  };

const getPaymentDetails = async (req, res) => {
    const { reference } = req.params;
  
    try {
      const payment = await Payment.findOne({ paymentReference: reference });
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
  
      return res.status(200).json({
        fullName: payment.fullName,
        email: payment.email,
        phoneNumber: payment.phoneNumber,
        amount: payment.amount,
        paymentReference: payment.paymentReference,
        status: payment.status,
      });
    } catch (error) {
      console.error('Error fetching payment details:', error.message);
      return res.status(500).json({ message: `Failed to fetch payment details: ${error.message}` });
    }
  };
  
  export { initializePayment, verifyPayment, getPaymentDetails };
