import mongoose from "mongoose";

const formFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  required: { type: Boolean, default: false },
  value: { type: String, default: null },
});

const amountBreakdownSchema = new mongoose.Schema({
  baseAmount: { type: Number, required: true },
  kolektoFee: { type: Number, required: true },
  paymentGatewayFee: { type: Number, required: true },
  totalFees: { type: Number, required: true },
  totalPayable: { type: Number, required: true },
  feeBearer: {
    type: String,
    enum: ["organizer", "contributor"],
    required: true,
  },
});

const registerCollectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  collectionTittle: {
    type: String,
    required: true,
    trim: true,
  },
  collectionDescription: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  amountBreakdown: {
    type: amountBreakdownSchema,
    required: true,
  },
  deadline: {
    type: Date,
  },
  numberOfParticipants: {
    type: Number,
    min: 1,
  },
  participantInformation: [formFieldSchema],
  code: {
    type: String,
    unique: true,
    sparse: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("RegisterCollection", registerCollectionSchema);