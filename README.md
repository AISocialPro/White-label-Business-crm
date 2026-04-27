# White-Label Business Management CRM

All-in-one multi-tenant CRM jise har business apne brand ke naam se use kar sakta hai:

- Leads management
- WhatsApp follow-up trigger (mock provider ready)
- Sales pipeline tracking
- Invoice and billing data
- Customer follow-ups
- White-label branding (logo, color, tenant slug, custom domain field)

This workspace contains:

- `backend` -> Node.js + Express + MongoDB multi-tenant API
- `frontend-react` -> React white-label CRM dashboard
- `frontend-angular` -> Angular white-label CRM dashboard

## 1) Architecture (White-Label + Multi-Tenant)

### Control Database

Single control DB stores platform-level data:

- tenants
- users (tenant-scoped users)

### Tenant Databases

Each company gets its own DB:

- `crm_company_a`
- `crm_company_b`
- etc.

Tenant DB stores:

- leads
- customers
- deals
- invoices
- followups

This keeps client data isolated and white-label ready.

## 2) Backend Setup

1. Open terminal in `backend`
2. Install dependencies

```powershell
npm install
```

3. Create `.env` from `.env.example`
4. Start API

```powershell
npm run dev
```

Backend runs on `http://localhost:5000`

### Key API Routes

- `POST /api/auth/register-tenant`
- `POST /api/auth/login`
- `GET /api/tenants/me`
- `GET /api/crm/dashboard/summary`
- `GET/POST/PATCH /api/crm/leads`
- `GET/POST /api/crm/customers`
- `GET/POST /api/crm/deals`
- `GET/POST /api/crm/invoices`
- `GET/POST /api/crm/follow-ups`
- `POST /api/crm/follow-ups/:id/send-whatsapp`

## 3) React Frontend Setup

1. Open terminal in `frontend-react`
2. Install dependencies

```powershell
npm install
```

3. Optional env file (`.env`)

```env
VITE_API_URL=http://localhost:5000
```

4. Run app

```powershell
npm run dev
```

React app runs on `http://localhost:5173`

## 4) Angular Frontend Setup

1. Open terminal in `frontend-angular`
2. Install dependencies

```powershell
npm install
```

3. Run app

```powershell
npm start
```

Angular app runs on `http://localhost:4200`

## 5) White-Label Flow

1. Register a tenant from React app (`/register`) with:
   - company name
   - brand slug
   - logo URL
   - primary color
2. Backend creates:
   - Tenant entry in control DB
   - New dedicated tenant DB name
   - Owner user
3. Login using `tenantSlug + email + password`
4. All CRM data now reads/writes to that tenant's dedicated DB only.

## 6) MongoDB Compass vs Atlas (Your Question)

### Short Answer

For sellable white-label SaaS, use **MongoDB Atlas** in production.

### Why

- Atlas gives cloud reliability, backup, monitoring, scaling.
- Easy to manage many tenant databases on one cluster.
- Compass is mainly GUI client (development/debugging tool), hosting solution nahi hai.

### Recommended Strategy

- Development: local MongoDB + Compass for inspection.
- Production: Atlas cluster.
- Tenancy model: database-per-tenant (as implemented here).

### Cost Optimization (Important)

- Start with one Atlas cluster, many tenant DBs.
- Premium clients ke liye dedicated cluster migration option do.
- Backup + retention policies tenant plan ke basis pe define karo.

## 7) Security and Next Enhancements

- Add refresh tokens + secure cookie strategy
- Role-based permissions (owner/admin/agent)
- Proper WhatsApp provider integration (Twilio / Meta API)
- Invoice PDF generation + payment gateway
- Activity logs and audit trail
- Domain-based tenant resolver (`x-tenant-slug` ke saath custom domain resolution)
