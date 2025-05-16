import Payment from "../models/Payment.js";
import Contributor from "../models/contributorSchema.js";
import RegisterCollection from "../models/registerCollectionSchema.js";
import axios from "axios";
import mongoose from "mongoose";

const initializePayment = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, amount, contributorId, collectionId } = req.body;
    if (!fullName || !email || !phoneNumber || !amount || !contributorId || !collectionId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      return res.status(404).json({ message: "Contributor not found" });
    }

    const collection = await RegisterCollection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack requires amount in kobo
        callback_url: "http://localhost:8081/success",
        metadata: {
          fullName,
          phoneNumber,
          amount,
          contributorId,
          collectionId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );    

    const payment = new Payment({
      fullName,
      email,
      phoneNumber,
      amount,
      status: "pending",
      paymentReference: response.data.data.reference,
      contributor: contributorId,
      collection: collectionId,
    });

    await payment.save();

    // Update contributor with payment reference
    contributor.payment = payment._id;
    await contributor.save();

    res.status(200).json({
      message: "Payment initialized successfully",
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error("Error initializing payment:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params; // Now getting from URL params

    if (!reference) {
      return res.status(400).json({ 
        success: false,
        message: "Payment reference is required" 
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Missing Paystack secret key"
      });
    }

    // Verify with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (paystackResponse.data.data.status === "success") {
      // Update payment status
      const payment = await Payment.findOneAndUpdate(
        { paymentReference: reference },
        { status: "successful" },
        { new: true }
      );

      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          message: "Payment record not found" 
        });
      }

      // Validate and update contributor
      if (mongoose.Types.ObjectId.isValid(payment.contributor)) {
        await Contributor.findByIdAndUpdate(
          payment.contributor,
          { status: "paid" }
        );
      }

      // Validate and update collection
      if (mongoose.Types.ObjectId.isValid(payment.collection)) {
        await RegisterCollection.findByIdAndUpdate(
          payment.collection,
          { $inc: { total_raised: payment.amount } }
        );
      }

      return res.json({ 
        success: true, 
        status: "success",
        message: "Payment verified successfully",
        data: paystackResponse.data.data
      });
    } else {
      // Handle failed payment
      await Payment.findOneAndUpdate(
        { paymentReference: reference },
        { status: "failed" }
      );
      
      const failedPayment = await Payment.findOne({ paymentReference: reference });
      if (failedPayment?.contributor) {
        await Contributor.findByIdAndUpdate(
          failedPayment.contributor,
          { status: "failed" }
        );
      }

      return res.status(400).json({ 
        success: false, 
        message: "Payment not successful",
        data: paystackResponse.data.data
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ 
      success: false,
      message: error.response?.data?.message || "Failed to verify payment" 
    });
  }
};

const getPaymentDetails = async (req, res) => {
  const { reference } = req.params;

  try {
    const payment = await Payment.findOne({ paymentReference: reference })
      .populate("contributor", "name email")
      .populate("collection", "collectionTittle");
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({
      id: payment._id.toString(),
      fullName: payment.fullName,
      email: payment.email,
      phoneNumber: payment.phoneNumber,
      amount: payment.amount,
      paymentReference: payment.paymentReference,
      status: payment.status,
      contributor: payment.contributor ? {
        name: payment.contributor.name,
        email: payment.contributor.email,
      } : null,
      collection: payment.collection ? payment.collection.collectionTittle : "Unknown",
      created_at: payment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching payment details:", error.message);
    return res.status(500).json({ message: `Failed to fetch payment details: ${error.message}` });
  }
};

const getPayments = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find collections owned by the user
    const collections = await RegisterCollection.find({ user: userId }).select("_id");
    const collectionIds = collections.map((c) => c._id);

    // Find payments for those collections
    const payments = await Payment.find({ collection: { $in: collectionIds } })
      .populate("contributor", "name email")
      .populate("collection", "collectionTittle")
      .lean();

    const formattedPayments = payments.map((payment) => ({
      id: payment._id.toString(),
      fullName: payment.fullName,
      email: payment.email,
      phoneNumber: payment.phoneNumber,
      amount: payment.amount,
      paymentReference: payment.paymentReference,
      status: payment.status,
      contributor: payment.contributor ? {
        name: payment.contributor.name,
        email: payment.contributor.email,
      } : null,
      collection: payment.collection ? payment.collection.collectionTittle : "Unknown",
      created_at: payment.createdAt.toISOString(),
    }));

    res.status(200).json({ success: true, payments: formattedPayments });
  } catch (error) {
    console.error("Error fetching payments:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { initializePayment, verifyPayment, getPaymentDetails, getPayments };