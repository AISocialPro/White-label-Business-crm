export const superAdminMiddleware = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ message: "Super admin access required" });
  }

  return next();
};
