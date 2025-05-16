import mongoose from "mongoose";
const formFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  required: { type: Boolean, default: false },
  value: { type: String, default: null },
}, { _id: false }); // Add this to prevent automatic _id generation for subdocuments

const contributorSchema = new mongoose.Schema({
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RegisterCollection",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
participantInformation: {type: Array},
  status: {
    type: String,
    enum: ["paid", "pending", "failed"],
    default: "pending",
  },
  contributorUniqueCode:{type: String,
    // unique: true,
    sparse: true,
    default: undefined,},

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Contributor", contributorSchema);