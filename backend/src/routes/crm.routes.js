import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { tenantMiddleware } from "../middlewares/tenant.js";
import { Lead } from "../models/tenant/Lead.js";
import { Customer } from "../models/tenant/Customer.js";
import { Deal } from "../models/tenant/Deal.js";
import { Invoice } from "../models/tenant/Invoice.js";
import { FollowUp } from "../models/tenant/FollowUp.js";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js";

export const crmRouter = express.Router();

crmRouter.use(authMiddleware, tenantMiddleware);

const getModels = (connection) => ({
  leads: Lead(connection),
  customers: Customer(connection),
  deals: Deal(connection),
  invoices: Invoice(connection),
  followUps: FollowUp(connection)
});

crmRouter.get("/dashboard/summary", async (req, res) => {
  try {
    const models = getModels(req.tenantConnection);

    const [leadCount, customerCount, dealCount, invoiceCount, pipelineValue] = await Promise.all([
      models.leads.countDocuments(),
      models.customers.countDocuments(),
      models.deals.countDocuments(),
      models.invoices.countDocuments(),
      models.deals.aggregate([
        { $match: { stage: { $ne: "lost" } } },
        { $group: { _id: null, total: { $sum: "$value" } } }
      ])
    ]);

    return res.json({
      leadCount,
      customerCount,
      dealCount,
      invoiceCount,
      pipelineValue: pipelineValue[0]?.total || 0
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
  }
});

crmRouter.get("/leads", async (req, res) => {
  const leads = await Lead(req.tenantConnection).find().sort({ createdAt: -1 });
  return res.json(leads);
});

crmRouter.post("/leads", async (req, res) => {
  try {
    const lead = await Lead(req.tenantConnection).create(req.body);
    return res.status(201).json(lead);
  } catch (error) {
    return res.status(400).json({ message: "Lead creation failed", error: error.message });
  }
});

crmRouter.patch("/leads/:id", async (req, res) => {
  try {
    const lead = await Lead(req.tenantConnection).findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.json(lead);
  } catch (error) {
    return res.status(400).json({ message: "Lead update failed", error: error.message });
  }
});

crmRouter.get("/customers", async (req, res) => {
  const customers = await Customer(req.tenantConnection).find().sort({ createdAt: -1 });
  return res.json(customers);
});

crmRouter.post("/customers", async (req, res) => {
  try {
    const customer = await Customer(req.tenantConnection).create(req.body);
    return res.status(201).json(customer);
  } catch (error) {
    return res.status(400).json({ message: "Customer creation failed", error: error.message });
  }
});

crmRouter.get("/deals", async (req, res) => {
  const deals = await Deal(req.tenantConnection).find().sort({ createdAt: -1 });
  return res.json(deals);
});

crmRouter.post("/deals", async (req, res) => {
  try {
    const deal = await Deal(req.tenantConnection).create(req.body);
    return res.status(201).json(deal);
  } catch (error) {
    return res.status(400).json({ message: "Deal creation failed", error: error.message });
  }
});

crmRouter.get("/invoices", async (req, res) => {
  const invoices = await Invoice(req.tenantConnection).find().sort({ createdAt: -1 });
  return res.json(invoices);
});

crmRouter.post("/invoices", async (req, res) => {
  try {
    const invoice = await Invoice(req.tenantConnection).create(req.body);
    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(400).json({ message: "Invoice creation failed", error: error.message });
  }
});

crmRouter.get("/follow-ups", async (req, res) => {
  const followUps = await FollowUp(req.tenantConnection).find().sort({ dueAt: 1 });
  return res.json(followUps);
});

crmRouter.post("/follow-ups", async (req, res) => {
  try {
    const followUp = await FollowUp(req.tenantConnection).create(req.body);
    return res.status(201).json(followUp);
  } catch (error) {
    return res.status(400).json({ message: "Follow-up creation failed", error: error.message });
  }
});

crmRouter.post("/follow-ups/:id/send-whatsapp", async (req, res) => {
  try {
    const followUp = await FollowUp(req.tenantConnection).findById(req.params.id);
    if (!followUp) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    const result = await sendWhatsAppMessage({
      to: req.body.to,
      message: req.body.message || `Reminder for ${followUp.customerName}`
    });

    return res.json({ followUpId: followUp._id, whatsapp: result });
  } catch (error) {
    return res.status(400).json({ message: "WhatsApp sending failed", error: error.message });
  }
});