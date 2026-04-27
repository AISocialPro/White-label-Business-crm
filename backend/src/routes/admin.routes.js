import express from "express";
import crypto from "crypto";
import { authMiddleware } from "../middlewares/auth.js";
import { superAdminMiddleware } from "../middlewares/superAdmin.js";
import { getAdminModuleModel, adminModules } from "../models/control/AdminModuleItem.js";
import { AdminConfig } from "../models/control/AdminConfig.js";
import { adminSeedConfigs, adminSeedModules } from "../data/adminSeed.js";

export const adminRouter = express.Router();

adminRouter.use(authMiddleware, superAdminMiddleware);

const allowedConfigKeys = new Set(["branding", "toggles", "security"]);

const serializeModuleDoc = (doc) => ({
  id: doc.publicId,
  ...doc.data
});

const getModuleRows = async (moduleName) => {
  const Model = getAdminModuleModel(moduleName);
  const records = await Model.find().sort({ createdAt: -1 });
  return records.map(serializeModuleDoc);
};

const ensureSeeded = async () => {
  const TenantsModel = getAdminModuleModel("tenants");
  const tenantCount = await TenantsModel.countDocuments();

  if (tenantCount === 0) {
    for (const [moduleName, records] of Object.entries(adminSeedModules)) {
      const Model = getAdminModuleModel(moduleName);

      const docs = records.map((record) => {
        const payload = { ...record };
        const publicId = payload.id || crypto.randomUUID().slice(0, 12);
        delete payload.id;
        return {
          publicId,
          data: payload,
          createdBy: "seed",
          updatedBy: "seed"
        };
      });

      if (docs.length) {
        await Model.insertMany(docs);
      }
    }
  }

  const ConfigModel = AdminConfig();
  for (const [key, data] of Object.entries(adminSeedConfigs)) {
    await ConfigModel.findOneAndUpdate(
      { key },
      { $setOnInsert: { data } },
      { upsert: true, new: true }
    );
  }
};

adminRouter.get("/bootstrap", async (_req, res) => {
  try {
    await ensureSeeded();

    const modulesPayload = {};
    for (const moduleName of adminModules) {
      modulesPayload[moduleName] = await getModuleRows(moduleName);
    }

    const ConfigModel = AdminConfig();
    const configRows = await ConfigModel.find({ key: { $in: Array.from(allowedConfigKeys) } });
    const configPayload = { branding: {}, toggles: {}, security: {} };

    for (const row of configRows) {
      configPayload[row.key] = row.data || {};
    }

    return res.json({
      modules: modulesPayload,
      configs: configPayload
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load admin bootstrap", error: error.message });
  }
});

adminRouter.get("/modules/:moduleName", async (req, res) => {
  try {
    const { moduleName } = req.params;
    if (!adminModules.includes(moduleName)) {
      return res.status(404).json({ message: "Unknown admin module" });
    }

    const rows = await getModuleRows(moduleName);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch module", error: error.message });
  }
});

adminRouter.post("/modules/:moduleName", async (req, res) => {
  try {
    const { moduleName } = req.params;
    if (!adminModules.includes(moduleName)) {
      return res.status(404).json({ message: "Unknown admin module" });
    }

    const payload = { ...(req.body || {}) };
    const publicId = payload.id || crypto.randomUUID().slice(0, 12);
    delete payload.id;

    const Model = getAdminModuleModel(moduleName);
    const created = await Model.create({
      publicId,
      data: payload,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    return res.status(201).json(serializeModuleDoc(created));
  } catch (error) {
    return res.status(400).json({ message: "Failed to create module record", error: error.message });
  }
});

adminRouter.patch("/modules/:moduleName/:publicId", async (req, res) => {
  try {
    const { moduleName, publicId } = req.params;
    if (!adminModules.includes(moduleName)) {
      return res.status(404).json({ message: "Unknown admin module" });
    }

    const Model = getAdminModuleModel(moduleName);
    const row = await Model.findOne({ publicId });
    if (!row) {
      return res.status(404).json({ message: "Record not found" });
    }

    const patch = { ...(req.body || {}) };
    delete patch.id;

    row.data = {
      ...(row.data || {}),
      ...patch
    };
    row.updatedBy = req.user.userId;
    await row.save();

    return res.json(serializeModuleDoc(row));
  } catch (error) {
    return res.status(400).json({ message: "Failed to update module record", error: error.message });
  }
});

adminRouter.delete("/modules/:moduleName/:publicId", async (req, res) => {
  try {
    const { moduleName, publicId } = req.params;
    if (!adminModules.includes(moduleName)) {
      return res.status(404).json({ message: "Unknown admin module" });
    }

    const Model = getAdminModuleModel(moduleName);
    const deleted = await Model.findOneAndDelete({ publicId });
    if (!deleted) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete module record", error: error.message });
  }
});

adminRouter.get("/configs/:key", async (req, res) => {
  try {
    const { key } = req.params;
    if (!allowedConfigKeys.has(key)) {
      return res.status(404).json({ message: "Unknown config key" });
    }

    const row = await AdminConfig().findOne({ key });
    return res.json(row?.data || {});
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch config", error: error.message });
  }
});

adminRouter.put("/configs/:key", async (req, res) => {
  try {
    const { key } = req.params;
    if (!allowedConfigKeys.has(key)) {
      return res.status(404).json({ message: "Unknown config key" });
    }

    const row = await AdminConfig().findOneAndUpdate(
      { key },
      { $set: { data: req.body || {} } },
      { new: true, upsert: true }
    );

    return res.json(row.data || {});
  } catch (error) {
    return res.status(400).json({ message: "Failed to save config", error: error.message });
  }
});
