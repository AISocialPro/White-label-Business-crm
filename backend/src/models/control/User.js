import mongoose from "mongoose";
import { getControlConnection } from "../../config/controlDb.js";

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "agent", "staff"],
      default: "owner"
    }
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export const User = () => {
  const connection = getControlConnection();
  return connection.models.User || connection.model("User", userSchema);
};