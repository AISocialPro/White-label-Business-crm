import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    source: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "proposal", "won", "lost"],
      default: "new"
    },
    assignedTo: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export const Lead = (connection) =>
  connection.models.Lead || connection.model("Lead", leadSchema);