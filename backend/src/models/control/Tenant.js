import mongoose from "mongoose";
import { getControlConnection } from "../../config/controlDb.js";

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    dbName: { type: String, required: true, unique: true, trim: true },
    domain: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    primaryColor: { type: String, trim: true, default: "#1f2937" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Tenant = () => {
  const connection = getControlConnection();
  return connection.models.Tenant || connection.model("Tenant", tenantSchema);
};