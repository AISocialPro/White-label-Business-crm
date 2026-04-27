import mongoose from "mongoose";
import { getControlConnection } from "../../config/controlDb.js";

const adminConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const AdminConfig = () => {
  const connection = getControlConnection();
  return connection.models.AdminConfig || connection.model("AdminConfig", adminConfigSchema, "admin_configs");
};
