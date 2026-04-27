import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ["whatsapp", "call", "email", "meeting"],
      default: "call"
    },
    dueAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "missed"],
      default: "pending"
    },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export const FollowUp = (connection) =>
  connection.models.FollowUp || connection.model("FollowUp", followUpSchema);