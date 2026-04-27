import mongoose from "mongoose";
import { env } from "./env.js";

const tenantConnections = new Map();

export const getTenantConnection = async (dbName) => {
  if (!dbName) {
    throw new Error("Tenant database name is required");
  }

  const existing = tenantConnections.get(dbName);

  if (existing?.readyState === 1) {
    return existing;
  }

  const connection = await mongoose
    .createConnection(env.tenantDbBaseUri, { dbName })
    .asPromise();

  tenantConnections.set(dbName, connection);
  return connection;
};