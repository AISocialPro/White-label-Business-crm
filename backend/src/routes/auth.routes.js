import express from "express";
import bcrypt from "bcryptjs";
import { Tenant } from "../models/control/Tenant.js";
import { User } from "../models/control/User.js";
import { signToken } from "../utils/jwt.js";
import { toSlug } from "../utils/slug.js";
import { env } from "../config/env.js";

export const authRouter = express.Router();

authRouter.post("/register-tenant", async (req, res) => {
  try {
    const {
      companyName,
      slug: requestedSlug,
      domain,
      logoUrl,
      primaryColor,
      adminName,
      email,
      password
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedAdminName = String(adminName || "").trim();

    if (!companyName || !normalizedAdminName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "companyName, adminName, email, password are required" });
    }

    const slug = toSlug(requestedSlug || companyName);
    const dbName = `crm_${slug.replace(/-/g, "_")}`;

    const TenantModel = Tenant();
    const UserModel = User();

    const existingTenant = await TenantModel.findOne({ slug });
    if (existingTenant) {
      return res.status(409).json({ message: "Tenant slug already exists" });
    }

    const tenant = await TenantModel.create({
      name: companyName,
      slug,
      dbName,
      domain,
      logoUrl,
      primaryColor
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      tenantId: tenant._id,
      name: normalizedAdminName,
      email: normalizedEmail,
      passwordHash,
      role: "owner"
    });

    const isSuperAdmin = env.superAdminEmails.includes(user.email);

    const token = signToken({
      userId: String(user._id),
      tenantId: String(tenant._id),
      tenantSlug: tenant.slug,
      role: user.role,
      isSuperAdmin
    });

    return res.status(201).json({
      token,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { tenantSlug, email, password } = req.body;
    const normalizedTenantSlug = String(tenantSlug || "").trim().toLowerCase();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedTenantSlug || !normalizedEmail || !password) {
      return res.status(400).json({ message: "tenantSlug, email, password are required" });
    }

    const TenantModel = Tenant();
    const UserModel = User();

    const tenant = await TenantModel.findOne({ slug: normalizedTenantSlug, isActive: true });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const user = await UserModel.findOne({ tenantId: tenant._id, email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isSuperAdmin = env.superAdminEmails.includes(user.email);

    const token = signToken({
      userId: String(user._id),
      tenantId: String(tenant._id),
      tenantSlug: tenant.slug,
      role: user.role,
      isSuperAdmin
    });

    return res.json({
      token,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});