import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { tenantMiddleware } from "../middlewares/tenant.js";

export const tenantRouter = express.Router();

tenantRouter.get("/me", authMiddleware, tenantMiddleware, async (req, res) => {
  return res.json({
    id: req.tenant._id,
    name: req.tenant.name,
    slug: req.tenant.slug,
    domain: req.tenant.domain,
    logoUrl: req.tenant.logoUrl,
    primaryColor: req.tenant.primaryColor
  });
});