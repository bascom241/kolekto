import mongoose from "mongoose";
const formFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  required: { type: Boolean, default: false },
  value: { type: String, default: null },
}, { _id: false }); // Add this to prevent automatic _id generation for subdocuments

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
}, { _id: false });

const registerCollectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  collectionTitle: { // Changed from collectionTittle to collectionTitle
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
    default: undefined, // This helps with the null duplicate key issue
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { suppressReservedKeysWarning: true }); // This suppresses the collection warning
export default mongoose.model("RegisterCollection", registerCollectionSchema);