import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["CONTROL_DB_URI", "JWT_SECRET"];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  controlDbUri: process.env.CONTROL_DB_URI,
  tenantDbBaseUri: process.env.TENANT_DB_BASE_URI || process.env.CONTROL_DB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientOrigins: (process.env.CLIENT_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  superAdminEmails: (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  whatsappProvider: process.env.WHATSAPP_PROVIDER || "mock",
  whatsappApiKey: process.env.WHATSAPP_API_KEY || ""
};