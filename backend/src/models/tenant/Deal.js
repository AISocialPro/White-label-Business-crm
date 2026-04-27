import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    customerName: { type: String, trim: true },
    expectedCloseDate: { type: Date },
    stage: {
      type: String,
      enum: ["pipeline", "negotiation", "won", "lost"],
      default: "pipeline"
    },
    probability: { type: Number, min: 0, max: 100, default: 50 }
  },
  { timestamps: true }
);

export const Deal = (connection) =>
  connection.models.Deal || connection.model("Deal", dealSchema);