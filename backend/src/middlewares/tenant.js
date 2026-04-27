import { getTenantConnection } from "../config/tenantDb.js";
import { Tenant } from "../models/control/Tenant.js";

export const tenantMiddleware = async (req, res, next) => {
  try {
    const TenantModel = Tenant();
    const slugFromHeader = req.headers["x-tenant-slug"];

    let tenant;

    if (req.user?.tenantId) {
      tenant = await TenantModel.findById(req.user.tenantId);
    }

    if (tenant && slugFromHeader && tenant.slug !== String(slugFromHeader).toLowerCase()) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    if (!tenant && slugFromHeader) {
      tenant = await TenantModel.findOne({ slug: String(slugFromHeader).toLowerCase() });
    }

    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ message: "Tenant not found or inactive" });
    }

    req.tenant = tenant;
    req.tenantConnection = await getTenantConnection(tenant.dbName);
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Tenant resolution failed", error: error.message });
  }
};