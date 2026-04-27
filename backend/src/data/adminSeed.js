export const adminSeedModules = {
  tenants: [
    {
      id: "tn-101",
      company: "Ecos Logistics",
      owner: "Mahi Patel",
      plan: "Pro",
      status: "active",
      users: 28,
      storageGb: 84,
      apiCalls: 212300,
      mrr: 42000,
      domain: "crm.ecos.com"
    }
  ],
  plans: [
    { id: "pl-1", name: "Free", usersLimit: 5, contactsLimit: 500, automationsLimit: 0, price: 0 },
    { id: "pl-2", name: "Pro", usersLimit: 50, contactsLimit: 50000, automationsLimit: 20, price: 2499 },
    { id: "pl-3", name: "Enterprise", usersLimit: 500, contactsLimit: 999999, automationsLimit: 999, price: 11999 }
  ],
  transactions: [
    { id: "tx-1", tenant: "Ecos Logistics", amount: 42000, status: "paid", method: "Card", date: "2026-04-21" }
  ],
  invoices: [
    { id: "inv-101", tenant: "Ecos Logistics", total: 42000, status: "paid", dueDate: "2026-04-25" }
  ],
  users: [
    {
      id: "usr-1",
      tenant: "Ecos Logistics",
      name: "Mahi Patel",
      email: "ips.mahipatel@gmail.com",
      status: "active",
      lastLogin: "2026-04-26 11:08"
    }
  ],
  roles: [{ role: "Super Admin", members: 1, rights: "All" }],
  domains: [{ id: "dm-1", tenant: "Ecos Logistics", domain: "crm.ecos.com", ssl: "active" }],
  apiKeys: [{ id: "api-1", name: "Global Public API", scope: "read", rateLimit: "300 rpm", status: "active" }],
  webhooks: [{ id: "wh-1", event: "lead.created", target: "https://example.com/hooks/lead", status: "active" }],
  auditLogs: [],
  tickets: [],
  chatLogs: [],
  flags: [{ id: "ff-1", flag: "smart-score-v2", rollout: "all", enabled: true }],
  backups: []
};

export const adminSeedConfigs = {
  branding: {
    primaryColor: "#0f766e",
    logoUrl: "https://dummyimage.com/200x80/0f766e/ffffff&text=CRM+Cloud",
    emailFooter: "Powered by CRM Cloud"
  },
  toggles: {
    crmModule: true,
    automationModule: true,
    billingModule: true,
    aiAssistant: true,
    emailBranding: true
  },
  security: {
    enforce2FA: true,
    ipRestriction: false,
    encryptionAtRest: true,
    backupRetentionDays: 30
  }
};
