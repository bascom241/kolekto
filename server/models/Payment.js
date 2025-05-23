import mongoose from 'mongoose';

const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/; 

const PaymentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    // validate: {
    //   validator: function(v) {
    //     return phoneRegex.test(v);
    //   },
    //   message: props => `${props.value} is not a valid phone number!`
    // }
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "successful", "failed"],
    default: "pending"
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },

  // 👇 Contributor relationship field
  contributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contributor",
    unique: true, // Ensures one-to-one (only one payment per contributor)
    required: true
  }
});

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;
