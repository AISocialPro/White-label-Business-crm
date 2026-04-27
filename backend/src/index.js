import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { connectControlDb } from "./config/controlDb.js";
import { authRouter } from "./routes/auth.routes.js";
import { tenantRouter } from "./routes/tenant.routes.js";
import { crmRouter } from "./routes/crm.routes.js";
import { adminRouter } from "./routes/admin.routes.js";

const app = express();

const isLocalDevOrigin = (origin) => {
  if (!origin) {
    return false;
  }

  try {
    const parsed = new URL(origin);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    }
  })
);

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "white-label-crm-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/tenants", tenantRouter);
app.use("/api/crm", crmRouter);
app.use("/api/admin", adminRouter);

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: "Unexpected server error", error: error.message });
});

const start = async () => {
  try {
    await connectControlDb();
    app.listen(env.port, () => {
      console.log(`Backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
};

start();