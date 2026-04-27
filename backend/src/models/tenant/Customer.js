import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export const Customer = (connection) =>
  connection.models.Customer || connection.model("Customer", customerSchema);