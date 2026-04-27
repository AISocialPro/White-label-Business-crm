import { env } from "../config/env.js";

export const sendWhatsAppMessage = async ({ to, message }) => {
  if (!to || !message) {
    throw new Error("Both recipient and message are required");
  }

  if (env.whatsappProvider === "mock") {
    return {
      provider: "mock",
      id: `mock_${Date.now()}`,
      delivered: true
    };
  }

  throw new Error("Configure a WhatsApp provider integration in whatsapp.service.js");
};