import mongoose from "mongoose";
import { getControlConnection } from "../../config/controlDb.js";

const allowedModules = new Set([
  "tenants",
  "plans",
  "transactions",
  "invoices",
  "users",
  "roles",
  "domains",
  "apiKeys",
  "webhooks",
  "auditLogs",
  "tickets",
  "chatLogs",
  "flags",
  "backups"
]);

const baseSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true }
  },
  { timestamps: true }
);

baseSchema.index({ publicId: 1 }, { unique: true });

const toPascalCase = (value) =>
  String(value)
    .replace(/[-_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ""))
    .replace(/^(.)/, (chr) => chr.toUpperCase());

export const getAdminModuleModel = (moduleName) => {
  if (!allowedModules.has(moduleName)) {
    throw new Error(`Unsupported admin module: ${moduleName}`);
  }

  const connection = getControlConnection();
  const modelName = `Admin${toPascalCase(moduleName)}Item`;
  const collectionName = `admin_${moduleName}`;

  return connection.models[modelName] || connection.model(modelName, baseSchema, collectionName);
};

export const adminModules = Array.from(allowedModules);
