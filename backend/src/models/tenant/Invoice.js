import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft"
    },
    dueDate: { type: Date },
    items: { type: [invoiceItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export const Invoice = (connection) =>
  connection.models.Invoice || connection.model("Invoice", invoiceSchema);