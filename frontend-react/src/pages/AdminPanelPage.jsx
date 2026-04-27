import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminPanelPage.css";

const NAV_GROUPS = [
  {
    title: "Core",
    items: [
      { key: "admin-dashboard", label: "Admin Dashboard" },
      { key: "tenant-list", label: "Tenant List" },
      { key: "tenant-details", label: "Tenant Details" }
    ]
  },
  {
    title: "Revenue",
    items: [
      { key: "plans-management", label: "Plans Management" },
      { key: "transactions", label: "Transactions" },
      { key: "billing-invoices", label: "Invoices" }
    ]
  },
  {
    title: "People",
    items: [
      { key: "all-users", label: "All Users" },
      { key: "admin-roles", label: "Admin Roles" }
    ]
  },
  {
    title: "White-Label",
    items: [
      { key: "branding-control", label: "Branding Control" },
      { key: "domain-management", label: "Domain Management" },
      { key: "feature-toggles", label: "Feature Toggles" }
    ]
  },
  {
    title: "System",
    items: [
      { key: "usage-analytics", label: "Usage Analytics" },
      { key: "performance-metrics", label: "Performance Metrics" },
      { key: "api-keys", label: "API Keys" },
      { key: "webhooks", label: "Webhooks" },
      { key: "third-party-services", label: "Third-party Services" }
    ]
  },
  {
    title: "Security & Support",
    items: [
      { key: "activity-logs", label: "Activity Logs" },
      { key: "security-settings", label: "Security Settings" },
      { key: "support-tickets", label: "Support Tickets" },
      { key: "live-chat-logs", label: "Live Chat Logs" }
    ]
  },
  {
    title: "Release Ops",
    items: [
      { key: "broadcast-messages", label: "Broadcast Messages" },
      { key: "feature-flags", label: "Feature Flags" },
      { key: "backups", label: "Backups" },
      { key: "data-export-import", label: "Data Export/Import" }
    ]
  }
];

const MODULE_KEYS = [
  "tenants",
  "plans",
  "transactions",
  "invoices",
  "users",
  "roles",
  "domains",
  "apiKeys",
  "webhooks",
  "auditLogs",
  "tickets",
  "chatLogs",
  "flags",
  "backups"
];

const statusColors = {
  active: "good",
  inactive: "warn",
  suspended: "danger",
  failed: "danger",
  paid: "good",
  pending: "warn",
  open: "warn",
  closed: "good"
};

const today = new Date().toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const numberFormat = new Intl.NumberFormat("en-IN");
const moneyFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const defaultModuleState = Object.fromEntries(MODULE_KEYS.map((key) => [key, []]));
const defaultConfigState = {
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

const makeId = () => Math.random().toString(36).slice(2, 8);

function Badge({ value }) {
  const tone = statusColors[String(value).toLowerCase()] || "neutral";
  return <span className={`sa-badge ${tone}`}>{value}</span>;
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="sa-section-title">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <article className="sa-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function SparkBars({ items }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="sa-spark-bars">
      {items.map((item) => (
        <div key={item.label} className="sa-spark-item">
          <div className="sa-spark-track">
            <div className="sa-spark-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <div className="sa-spark-meta">
            <span>{item.label}</span>
            <strong>{numberFormat.format(item.value)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPanelPage() {
  const { api, logout, user } = useAuth();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("admin-dashboard");
  const [searchPage, setSearchPage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [modules, setModules] = useState(defaultModuleState);
  const [configs, setConfigs] = useState(defaultConfigState);

  const [newTenant, setNewTenant] = useState({ company: "", owner: "", plan: "Pro", domain: "" });
  const [newPlan, setNewPlan] = useState({ name: "", usersLimit: 5, contactsLimit: 1000, automationsLimit: 0, price: 0 });
  const [newBroadcast, setNewBroadcast] = useState({ title: "", message: "", target: "all-tenants" });
  const [newFlag, setNewFlag] = useState({ flag: "", rollout: "all", enabled: true });

  const tenants = modules.tenants;
  const plans = modules.plans;
  const transactions = modules.transactions;
  const invoices = modules.invoices;
  const users = modules.users;
  const roles = modules.roles;
  const domains = modules.domains;
  const apiKeys = modules.apiKeys;
  const webhooks = modules.webhooks;
  const auditLogs = modules.auditLogs;
  const tickets = modules.tickets;
  const chatLogs = modules.chatLogs;
  const flags = modules.flags;
  const backups = modules.backups;

  const branding = configs.branding;
  const toggles = configs.toggles;
  const security = configs.security;

  const announce = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  };

  const setModuleRows = (moduleName, updater) => {
    setModules((prev) => {
      const current = prev[moduleName] || [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [moduleName]: next };
    });
  };

  const createModuleItem = async (moduleName, payload) => {
    const { data } = await api.post(`/api/admin/modules/${moduleName}`, payload);
    setModuleRows(moduleName, (rows) => [data, ...rows]);
    return data;
  };

  const updateModuleItem = async (moduleName, id, patch) => {
    const { data } = await api.patch(`/api/admin/modules/${moduleName}/${id}`, patch);
    setModuleRows(moduleName, (rows) => rows.map((row) => (row.id === id ? data : row)));
    return data;
  };

  const deleteModuleItem = async (moduleName, id) => {
    await api.delete(`/api/admin/modules/${moduleName}/${id}`);
    setModuleRows(moduleName, (rows) => rows.filter((row) => row.id !== id));
  };

  const saveConfig = async (key, data) => {
    const response = await api.put(`/api/admin/configs/${key}`, data);
    setConfigs((prev) => ({ ...prev, [key]: response.data }));
  };

  const loadBootstrap = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/bootstrap");
      setModules({ ...defaultModuleState, ...(data.modules || {}) });
      setConfigs({ ...defaultConfigState, ...(data.configs || {}) });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.isSuperAdmin) {
      setLoading(false);
      return;
    }
    loadBootstrap();
  }, [user?.isSuperAdmin]);

  const totalMrr = tenants.reduce((sum, tenant) => sum + Number(tenant.mrr || 0), 0);
  const arr = totalMrr * 12;
  const activeTenants = tenants.filter((tenant) => tenant.status === "active").length;
  const inactiveUsers = users.filter((entry) => entry.status !== "active").length;
  const apiLoad = tenants.reduce((sum, tenant) => sum + Number(tenant.apiCalls || 0), 0);

  const filteredGroups = useMemo(() => {
    if (!searchPage.trim()) {
      return NAV_GROUPS;
    }

    const query = searchPage.toLowerCase();
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(query))
    })).filter((group) => group.items.length > 0);
  }, [searchPage]);

  const pageLabel = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const match = group.items.find((item) => item.key === activePage);
      if (match) {
        return match.label;
      }
    }
    return "Admin Panel";
  }, [activePage]);

  const withSync = async (action, successMessage) => {
    try {
      setSyncing(true);
      setError("");
      await action();
      if (successMessage) {
        announce(successMessage);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Action failed");
    } finally {
      setSyncing(false);
    }
  };

  const createTenant = async (event) => {
    event.preventDefault();
    if (!newTenant.company.trim() || !newTenant.owner.trim()) {
      announce("Company and owner are required");
      return;
    }

    const tenant = {
      id: `tn-${makeId()}`,
      company: newTenant.company,
      owner: newTenant.owner,
      plan: newTenant.plan,
      status: "active",
      users: 1,
      storageGb: 1,
      apiCalls: 0,
      mrr: newTenant.plan === "Enterprise" ? 11999 : newTenant.plan === "Pro" ? 2499 : 0,
      domain: newTenant.domain || "pending-domain"
    };

    await withSync(async () => {
      await createModuleItem("tenants", tenant);
      await createModuleItem("auditLogs", {
        id: `log-${makeId()}`,
        actor: user?.email || "superadmin",
        action: `Created tenant ${tenant.company}`,
        ip: "127.0.0.1",
        time: new Date().toLocaleString("en-IN")
      });
      setNewTenant({ company: "", owner: "", plan: "Pro", domain: "" });
    }, `Tenant ${tenant.company} created`);
  };

  const deleteTenant = (tenantId) =>
    withSync(async () => {
      await deleteModuleItem("tenants", tenantId);
    }, "Tenant removed");

  const toggleTenantState = (tenant) => {
    const nextStatus = tenant.status === "active" ? "suspended" : "active";
    return withSync(async () => {
      await updateModuleItem("tenants", tenant.id, { status: nextStatus });
    }, `Tenant ${nextStatus}`);
  };

  const impersonateTenant = (company) => announce(`Impersonation session started for ${company}`);

  const addPlan = async (event) => {
    event.preventDefault();
    if (!newPlan.name.trim()) {
      announce("Plan name required");
      return;
    }

    await withSync(async () => {
      await createModuleItem("plans", { id: `pl-${makeId()}`, ...newPlan });
      setNewPlan({ name: "", usersLimit: 5, contactsLimit: 1000, automationsLimit: 0, price: 0 });
    }, "Plan created");
  };

  const markFailedPaymentsHandled = () =>
    withSync(async () => {
      const failed = transactions.filter((tx) => tx.status === "failed");
      await Promise.all(failed.map((tx) => updateModuleItem("transactions", tx.id, { status: "pending" })));
    }, "Failed payments moved to retry queue");

  const toggleUserBlock = (entry) =>
    withSync(async () => {
      const nextStatus = entry.status === "active" ? "inactive" : "active";
      await updateModuleItem("users", entry.id, { status: nextStatus });
    }, "User status updated");

  const resetPassword = (name) => announce(`Password reset link sent to ${name}`);

  const addApiKey = () =>
    withSync(async () => {
      await createModuleItem("apiKeys", {
        id: `api-${makeId()}`,
        name: `Generated Key ${apiKeys.length + 1}`,
        scope: "read-write",
        rateLimit: "150 rpm",
        status: "active"
      });
    }, "New API key generated");

  const addWebhook = () =>
    withSync(async () => {
      await createModuleItem("webhooks", {
        id: `wh-${makeId()}`,
        event: "tenant.upgraded",
        target: "https://hooks.example.com/tenant-upgraded",
        status: "active"
      });
    }, "Webhook added");

  const resolveTicket = (ticket) =>
    withSync(async () => {
      await updateModuleItem("tickets", ticket.id, { status: "closed" });
    }, "Ticket marked as resolved");

  const sendBroadcast = async (event) => {
    event.preventDefault();
    if (!newBroadcast.title.trim() || !newBroadcast.message.trim()) {
      announce("Broadcast title and message required");
      return;
    }

    await withSync(async () => {
      await createModuleItem("auditLogs", {
        id: `log-${makeId()}`,
        actor: user?.email || "superadmin",
        action: `Broadcast sent: ${newBroadcast.title}`,
        ip: "127.0.0.1",
        time: new Date().toLocaleString("en-IN")
      });
      setNewBroadcast({ title: "", message: "", target: "all-tenants" });
    }, `Broadcast sent to ${newBroadcast.target}`);
  };

  const addFeatureFlag = async (event) => {
    event.preventDefault();
    if (!newFlag.flag.trim()) {
      announce("Flag key required");
      return;
    }

    await withSync(async () => {
      await createModuleItem("flags", { id: `ff-${makeId()}`, ...newFlag });
      setNewFlag({ flag: "", rollout: "all", enabled: true });
    }, "Feature flag created");
  };

  const runBackup = (scope) =>
    withSync(async () => {
      await createModuleItem("backups", {
        id: `bk-${makeId()}`,
        scope,
        status: "completed",
        startedAt: new Date().toLocaleString("en-IN", { hour12: false })
      });
    }, "Backup completed");

  const exportData = (scope) => announce(`Export started for ${scope}`);

  const updateBrandingValue = (key, value) => setConfigs((prev) => ({ ...prev, branding: { ...prev.branding, [key]: value } }));
  const updateToggleValue = (key, value) => setConfigs((prev) => ({ ...prev, toggles: { ...prev.toggles, [key]: value } }));
  const updateSecurityValue = (key, value) => setConfigs((prev) => ({ ...prev, security: { ...prev.security, [key]: value } }));

  const saveBranding = () => withSync(async () => saveConfig("branding", branding), "Global branding saved");
  const saveToggles = () => withSync(async () => saveConfig("toggles", toggles), "Feature toggles saved");
  const saveSecurity = () => withSync(async () => saveConfig("security", security), "Security settings saved");

  const renderAdminDashboard = () => (
    <div className="sa-page-stack">
      <SectionTitle
        title="Dashboard"
        subtitle="Live command center for tenants, deals, billing, tasks and client onboarding"
      />

      <section className="sa-grid-4">
        <StatCard label="Total Contacts" value={numberFormat.format(tenants.length * 401)} hint={`${activeTenants} active tenants`} />
        <StatCard label="New Leads" value={numberFormat.format(users.length * 3)} hint="Last 30 days" />
        <StatCard label="Invoices" value={numberFormat.format(invoices.length)} hint={`${transactions.filter((tx) => tx.status === "paid").length} paid this month`} />
        <StatCard label="Revenue" value={moneyFormat.format(totalMrr)} hint={`ARR ${moneyFormat.format(arr)}`} />
      </section>

      <section className="sa-grid-3 sa-compact-widgets">
        <article className="sa-panel">
          <div className="sa-panel-topline">
            <h3>Recent Activities</h3>
            <small>Live feed</small>
          </div>
          <ul className="sa-list-card sa-list-compact">
            {auditLogs.slice(0, 4).map((log) => (
              <li key={log.id}>
                <div>
                  <strong>{log.action}</strong>
                  <p>{log.actor}</p>
                </div>
                <small>{log.time}</small>
              </li>
            ))}
            {!auditLogs.length && <li>No recent activity</li>}
          </ul>
        </article>

        <article className="sa-panel">
          <div className="sa-panel-topline">
            <h3>Tasks</h3>
            <small>{tickets.filter((ticket) => ticket.status !== "closed").length} open</small>
          </div>
          <ul className="sa-list-card sa-list-compact">
            {tickets.slice(0, 4).map((ticket) => (
              <li key={ticket.id}>
                <div>
                  <strong>{ticket.issue}</strong>
                  <p>{ticket.tenant}</p>
                </div>
                <Badge value={ticket.priority || ticket.status} />
              </li>
            ))}
            {!tickets.length && <li>No tasks available</li>}
          </ul>
        </article>

        <article className="sa-panel">
          <div className="sa-panel-topline">
            <h3>Appointments</h3>
            <small>This week</small>
          </div>
          <ul className="sa-list-card sa-list-compact">
            {tenants.slice(0, 4).map((tenant, index) => (
              <li key={tenant.id}>
                <div>
                  <strong>{tenant.company} Meeting</strong>
                  <p>{tenant.owner}</p>
                </div>
                <small>{`${10 + index}:00 AM`}</small>
              </li>
            ))}
            {!tenants.length && <li>No appointments scheduled</li>}
          </ul>
        </article>
      </section>

      <section className="sa-grid-2">
        <article className="sa-panel">
          <div className="sa-panel-topline">
            <h3>Client Onboarding</h3>
            <small>Last 6 months</small>
          </div>
          <div className="sa-onboarding-chart">
            {tenants.slice(0, 7).map((tenant, index) => (
              <div
                key={tenant.id}
                className="sa-onboarding-bar"
                style={{ height: `${45 + ((index * 13) % 48)}%` }}
                title={tenant.company}
              />
            ))}
            {!tenants.length && <p className="sa-muted">No onboarding data available.</p>}
          </div>
        </article>

        <article className="sa-panel">
          <div className="sa-panel-topline">
            <h3>Reviews</h3>
            <small>Top feedback</small>
          </div>
          <ul className="sa-list-card sa-list-compact">
            {chatLogs.slice(0, 4).map((chat) => (
              <li key={chat.id}>
                <div>
                  <strong>{chat.tenant}</strong>
                  <p>{chat.summary}</p>
                </div>
                <span className="sa-rating">5.0</span>
              </li>
            ))}
            {!chatLogs.length && <li>No reviews captured yet</li>}
          </ul>
          <div className="sa-alert info">Platform sync status: {syncing ? "Updating" : "Stable"}</div>
          <button type="button" className="sa-btn ghost" onClick={markFailedPaymentsHandled}>Retry Failed Payments Queue</button>
        </article>
      </section>
    </div>
  );

  const renderTenantList = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Tenant Management" subtitle="Create, edit, delete, suspend, activate and impersonate tenant workspaces" />

      <section className="sa-grid-2">
        <article className="sa-panel">
          <h3>Create Tenant</h3>
          <form className="sa-form" onSubmit={createTenant}>
            <input placeholder="Company" value={newTenant.company} onChange={(e) => setNewTenant((prev) => ({ ...prev, company: e.target.value }))} />
            <input placeholder="Owner" value={newTenant.owner} onChange={(e) => setNewTenant((prev) => ({ ...prev, owner: e.target.value }))} />
            <select value={newTenant.plan} onChange={(e) => setNewTenant((prev) => ({ ...prev, plan: e.target.value }))}>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.name}>{plan.name}</option>
              ))}
            </select>
            <input placeholder="Custom Domain" value={newTenant.domain} onChange={(e) => setNewTenant((prev) => ({ ...prev, domain: e.target.value }))} />
            <button type="submit" className="sa-btn">Create Tenant</button>
          </form>
        </article>

        <article className="sa-panel">
          <h3>Tenant List</h3>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <strong>{tenant.company}</strong>
                      <small>{tenant.owner}</small>
                    </td>
                    <td>{tenant.plan}</td>
                    <td>{tenant.users} users • {tenant.storageGb}GB</td>
                    <td><Badge value={tenant.status} /></td>
                    <td>
                      <div className="sa-actions">
                        <button type="button" className="sa-mini" onClick={() => setActivePage("tenant-details")}>View</button>
                        <button type="button" className="sa-mini" onClick={() => toggleTenantState(tenant)}>{tenant.status === "active" ? "Suspend" : "Activate"}</button>
                        <button type="button" className="sa-mini" onClick={() => impersonateTenant(tenant.company)}>Impersonate</button>
                        <button type="button" className="sa-mini danger" onClick={() => deleteTenant(tenant.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );

  const renderTenantDetails = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Tenant Details" subtitle="Usage stats, plan assignment and support tools" />
      <section className="sa-grid-3">
        {tenants.map((tenant) => (
          <article className="sa-panel" key={tenant.id}>
            <h3>{tenant.company}</h3>
            <p>{tenant.domain}</p>
            <div className="sa-kv">
              <span>Plan</span><strong>{tenant.plan}</strong>
              <span>Users</span><strong>{tenant.users}</strong>
              <span>Storage</span><strong>{tenant.storageGb} GB</strong>
              <span>API Calls</span><strong>{numberFormat.format(tenant.apiCalls)}</strong>
              <span>MRR</span><strong>{moneyFormat.format(tenant.mrr || 0)}</strong>
            </div>
            <div className="sa-actions">
              <button type="button" className="sa-mini" onClick={() => impersonateTenant(tenant.company)}>Impersonate Login</button>
              <button type="button" className="sa-mini" onClick={() => toggleTenantState(tenant)}>Suspend / Activate</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );

  const renderPlans = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Plans Management" subtitle="Free, Pro, Enterprise pricing with usage limits" />
      <section className="sa-grid-2">
        <article className="sa-panel">
          <h3>Create Pricing Plan</h3>
          <form className="sa-form" onSubmit={addPlan}>
            <input placeholder="Plan Name" value={newPlan.name} onChange={(e) => setNewPlan((prev) => ({ ...prev, name: e.target.value }))} />
            <input type="number" min="1" placeholder="Users Limit" value={newPlan.usersLimit} onChange={(e) => setNewPlan((prev) => ({ ...prev, usersLimit: Number(e.target.value || 0) }))} />
            <input type="number" min="1" placeholder="Contacts Limit" value={newPlan.contactsLimit} onChange={(e) => setNewPlan((prev) => ({ ...prev, contactsLimit: Number(e.target.value || 0) }))} />
            <input type="number" min="0" placeholder="Automation Limit" value={newPlan.automationsLimit} onChange={(e) => setNewPlan((prev) => ({ ...prev, automationsLimit: Number(e.target.value || 0) }))} />
            <input type="number" min="0" placeholder="Price (INR/month)" value={newPlan.price} onChange={(e) => setNewPlan((prev) => ({ ...prev, price: Number(e.target.value || 0) }))} />
            <button type="submit" className="sa-btn">Save Plan</button>
          </form>
        </article>

        <article className="sa-panel">
          <h3>Current Plans</h3>
          <ul className="sa-list-card">
            {plans.map((plan) => (
              <li key={plan.id}>
                <div>
                  <strong>{plan.name}</strong>
                  <p>{plan.usersLimit} users • {numberFormat.format(plan.contactsLimit)} contacts • {plan.automationsLimit} automations</p>
                </div>
                <Badge value={moneyFormat.format(plan.price || 0)} />
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );

  const renderTransactions = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Transactions" subtitle="Track payments and handle failed charges" />
      <article className="sa-panel">
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tenant</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{tx.tenant}</td>
                  <td>{moneyFormat.format(tx.amount || 0)}</td>
                  <td><Badge value={tx.status} /></td>
                  <td>{tx.method}</td>
                  <td>{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );

  const renderBillingInvoices = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Invoices" subtitle="Billing records, due dates, discounts and manual upgrades" />
      <section className="sa-grid-2">
        <article className="sa-panel">
          <h3>Invoice Ledger</h3>
          <ul className="sa-list-card">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <div>
                  <strong>{invoice.id} - {invoice.tenant}</strong>
                  <p>Due: {invoice.dueDate}</p>
                </div>
                <div className="sa-right">
                  <strong>{moneyFormat.format(invoice.total || 0)}</strong>
                  <Badge value={invoice.status} />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="sa-panel">
          <h3>Quick Billing Actions</h3>
          <div className="sa-list">
            <button type="button" className="sa-btn ghost" onClick={() => announce("Coupon WELCOME20 applied to selected tenants")}>Apply Coupon / Discount</button>
            <button type="button" className="sa-btn ghost" onClick={() => announce("Manual upgrade to Enterprise queued")}>Manual Upgrade</button>
            <button type="button" className="sa-btn ghost" onClick={() => announce("Manual downgrade to Pro queued")}>Manual Downgrade</button>
            <button type="button" className="sa-btn ghost" onClick={markFailedPaymentsHandled}>Handle Failed Payments</button>
          </div>
        </article>
      </section>
    </div>
  );

  const renderAllUsers = () => (
    <div className="sa-page-stack">
      <SectionTitle title="All Users" subtitle="Search users across tenants, reset passwords, block users and audit login history" />
      <article className="sa-panel">
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Tenant</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.name}</td>
                  <td>{entry.tenant}</td>
                  <td>{entry.email}</td>
                  <td><Badge value={entry.status} /></td>
                  <td>{entry.lastLogin}</td>
                  <td>
                    <div className="sa-actions">
                      <button type="button" className="sa-mini" onClick={() => resetPassword(entry.name)}>Reset Password</button>
                      <button type="button" className="sa-mini" onClick={() => toggleUserBlock(entry)}>{entry.status === "active" ? "Block" : "Unblock"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );

  const renderAdminRoles = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Admin Roles" subtitle="Assign internal admin roles with scoped permissions" />
      <section className="sa-grid-2">
        <article className="sa-panel">
          <ul className="sa-list-card">
            {roles.map((role) => (
              <li key={role.role}>
                <div>
                  <strong>{role.role}</strong>
                  <p>{role.rights}</p>
                </div>
                <Badge value={`${role.members} members`} />
              </li>
            ))}
          </ul>
        </article>
        <article className="sa-panel">
          <h3>Role Actions</h3>
          <div className="sa-list">
            <button type="button" className="sa-btn ghost" onClick={() => announce("Support Admin assigned")}>Assign Support Admin</button>
            <button type="button" className="sa-btn ghost" onClick={() => announce("Billing Admin assigned")}>Assign Billing Admin</button>
            <button type="button" className="sa-btn ghost" onClick={() => announce("Super Admin invite sent")}>Invite Super Admin</button>
          </div>
        </article>
      </section>
    </div>
  );

  const renderBrandingControl = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Branding Control" subtitle="Set global branding defaults and email identity" />
      <section className="sa-grid-2">
        <article className="sa-panel">
          <form className="sa-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              Primary Color
              <input type="color" value={branding.primaryColor} onChange={(e) => updateBrandingValue("primaryColor", e.target.value)} />
            </label>
            <input placeholder="Logo URL" value={branding.logoUrl} onChange={(e) => updateBrandingValue("logoUrl", e.target.value)} />
            <input placeholder="Email Footer" value={branding.emailFooter} onChange={(e) => updateBrandingValue("emailFooter", e.target.value)} />
            <button type="button" className="sa-btn" onClick={saveBranding}>Save Branding</button>
          </form>
        </article>
        <article className="sa-panel">
          <h3>Brand Preview</h3>
          <div className="sa-brand-preview" style={{ borderColor: branding.primaryColor }}>
            <img src={branding.logoUrl} alt="logo preview" />
            <p>{branding.emailFooter}</p>
            <small>Overrides can be applied per tenant from Tenant Details</small>
          </div>
        </article>
      </section>
    </div>
  );

  const renderDomainManagement = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Domain Management" subtitle="Map and monitor custom domains for each client business" />
      <article className="sa-panel">
        <ul className="sa-list-card">
          {domains.map((entry) => (
            <li key={entry.id}>
              <div>
                <strong>{entry.tenant}</strong>
                <p>{entry.domain}</p>
              </div>
              <div className="sa-right">
                <Badge value={entry.ssl} />
                <button type="button" className="sa-mini" onClick={() => announce(`SSL recheck queued for ${entry.domain}`)}>Recheck SSL</button>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );

  const renderFeatureToggles = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Feature Toggles" subtitle="Enable or disable key modules platform-wide" />
      <article className="sa-panel">
        <div className="sa-toggle-grid">
          {Object.entries(toggles).map(([key, enabled]) => (
            <label key={key} className="sa-toggle-item">
              <span>{key}</span>
              <input type="checkbox" checked={enabled} onChange={(e) => updateToggleValue(key, e.target.checked)} />
            </label>
          ))}
        </div>
        <button type="button" className="sa-btn" onClick={saveToggles}>Save Toggles</button>
      </article>
    </div>
  );

  const renderUsageAnalytics = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Usage Analytics" subtitle="DAU, API hits, retention and feature adoption" />
      <section className="sa-grid-3">
        <StatCard label="Daily Active Users" value={numberFormat.format(users.filter((entry) => entry.status === "active").length * 100)} hint="Synthetic benchmark" />
        <StatCard label="Retention (30d)" value="89%" hint="Churn stable" />
        <StatCard label="Feature Adoption" value="72%" hint="Automation used by paying tenants" />
      </section>
      <article className="sa-panel">
        <h3>Top Feature Usage</h3>
        <SparkBars
          items={[
            { label: "Leads Module", value: 9300 },
            { label: "Follow-ups", value: 7600 },
            { label: "Invoices", value: 5100 },
            { label: "Broadcasts", value: 2700 }
          ]}
        />
      </article>
    </div>
  );

  const renderPerformanceMetrics = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Performance Metrics" subtitle="Server and database load observability" />
      <section className="sa-grid-3">
        <StatCard label="API p95 latency" value="248ms" hint="Healthy" />
        <StatCard label="DB CPU" value="58%" hint="Peak 72%" />
        <StatCard label="Error Rate" value="0.42%" hint="Within SLA" />
      </section>
      <article className="sa-panel">
        <h3>Database Load by Cluster</h3>
        <SparkBars
          items={[
            { label: "Primary", value: 78 },
            { label: "Replica-1", value: 52 },
            { label: "Replica-2", value: 47 }
          ]}
        />
      </article>
    </div>
  );

  const renderApiKeys = () => (
    <div className="sa-page-stack">
      <SectionTitle title="API Keys" subtitle="Global API key inventory and rate limiting" />
      <article className="sa-panel">
        <div className="sa-panel-topline">
          <h3>Keys</h3>
          <button type="button" className="sa-btn" onClick={addApiKey}>Generate Key</button>
        </div>
        <ul className="sa-list-card">
          {apiKeys.map((key) => (
            <li key={key.id}>
              <div>
                <strong>{key.name}</strong>
                <p>{key.scope} • {key.rateLimit}</p>
              </div>
              <Badge value={key.status} />
            </li>
          ))}
        </ul>
      </article>
    </div>
  );

  const renderWebhooks = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Webhooks" subtitle="Outgoing event delivery endpoints and status" />
      <article className="sa-panel">
        <div className="sa-panel-topline">
          <h3>Webhook Endpoints</h3>
          <button type="button" className="sa-btn" onClick={addWebhook}>Add Webhook</button>
        </div>
        <ul className="sa-list-card">
          {webhooks.map((hook) => (
            <li key={hook.id}>
              <div>
                <strong>{hook.event}</strong>
                <p>{hook.target}</p>
              </div>
              <Badge value={hook.status} />
            </li>
          ))}
        </ul>
      </article>
    </div>
  );

  const renderThirdPartyServices = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Third-party Services" subtitle="Platform-wide integration switches and health" />
      <article className="sa-panel">
        <ul className="sa-list-card">
          <li><div><strong>Stripe Billing</strong><p>Payment gateway and recurring billing</p></div><Badge value="active" /></li>
          <li><div><strong>Twilio WhatsApp</strong><p>Follow-up reminders and campaign messages</p></div><Badge value="active" /></li>
          <li><div><strong>SMTP Relay</strong><p>Transactional email and branding</p></div><Badge value="inactive" /></li>
        </ul>
      </article>
    </div>
  );

  const renderActivityLogs = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Activity Logs" subtitle="Audit trail of every critical admin operation" />
      <article className="sa-panel">
        <ul className="sa-list-card">
          {auditLogs.map((log) => (
            <li key={log.id}>
              <div><strong>{log.action}</strong><p>{log.actor} • {log.ip}</p></div>
              <small>{log.time}</small>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Security Settings" subtitle="2FA, IP restrictions, encryption and backup policy" />
      <article className="sa-panel">
        <div className="sa-toggle-grid">
          <label className="sa-toggle-item"><span>Enforce 2FA for admins</span><input type="checkbox" checked={security.enforce2FA} onChange={(e) => updateSecurityValue("enforce2FA", e.target.checked)} /></label>
          <label className="sa-toggle-item"><span>IP restrictions</span><input type="checkbox" checked={security.ipRestriction} onChange={(e) => updateSecurityValue("ipRestriction", e.target.checked)} /></label>
          <label className="sa-toggle-item"><span>Encryption at rest</span><input type="checkbox" checked={security.encryptionAtRest} onChange={(e) => updateSecurityValue("encryptionAtRest", e.target.checked)} /></label>
          <label className="sa-toggle-item"><span>Backup retention (days)</span><input type="number" min="7" max="365" value={security.backupRetentionDays} onChange={(e) => updateSecurityValue("backupRetentionDays", Number(e.target.value || 30))} /></label>
        </div>
        <button type="button" className="sa-btn" onClick={saveSecurity}>Save Security Policy</button>
      </article>
    </div>
  );

  const renderSupportTickets = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Support Tickets" subtitle="Assign and resolve tenant issues with priority" />
      <article className="sa-panel">
        <ul className="sa-list-card">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <div><strong>{ticket.issue}</strong><p>{ticket.tenant} • Priority: {ticket.priority}</p></div>
              <div className="sa-right">
                <Badge value={ticket.status} />
                {ticket.status !== "closed" && <button type="button" className="sa-mini" onClick={() => resolveTicket(ticket)}>Resolve</button>}
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );

  const renderLiveChatLogs = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Live Chat Logs" subtitle="Support interactions and ownership trail" />
      <article className="sa-panel">
        <ul className="sa-list-card">
          {chatLogs.map((chat) => (
            <li key={chat.id}>
              <div><strong>{chat.tenant}</strong><p>{chat.summary}</p></div>
              <small>{chat.agent} • {chat.time}</small>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );

  const renderBroadcasts = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Broadcast Messages" subtitle="Announcements, maintenance alerts and release notes" />
      <article className="sa-panel">
        <form className="sa-form" onSubmit={sendBroadcast}>
          <input placeholder="Announcement title" value={newBroadcast.title} onChange={(e) => setNewBroadcast((prev) => ({ ...prev, title: e.target.value }))} />
          <select value={newBroadcast.target} onChange={(e) => setNewBroadcast((prev) => ({ ...prev, target: e.target.value }))}>
            <option value="all-tenants">All Tenants</option>
            <option value="enterprise-only">Enterprise Only</option>
            <option value="beta-group">Beta Group</option>
          </select>
          <textarea placeholder="Message" value={newBroadcast.message} onChange={(e) => setNewBroadcast((prev) => ({ ...prev, message: e.target.value }))} />
          <button type="submit" className="sa-btn">Send Broadcast</button>
        </form>
      </article>
    </div>
  );

  const renderFeatureFlags = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Feature Flags" subtitle="All users, specific tenants, beta and gradual rollout controls" />
      <section className="sa-grid-2">
        <article className="sa-panel">
          <h3>Create Flag</h3>
          <form className="sa-form" onSubmit={addFeatureFlag}>
            <input placeholder="Flag key" value={newFlag.flag} onChange={(e) => setNewFlag((prev) => ({ ...prev, flag: e.target.value }))} />
            <select value={newFlag.rollout} onChange={(e) => setNewFlag((prev) => ({ ...prev, rollout: e.target.value }))}>
              <option value="all">All users</option>
              <option value="beta">Beta group</option>
              <option value="tenant: Ecos Logistics">Specific tenant</option>
              <option value="gradual:20%">Gradual 20%</option>
            </select>
            <label className="sa-inline">Enabled<input type="checkbox" checked={newFlag.enabled} onChange={(e) => setNewFlag((prev) => ({ ...prev, enabled: e.target.checked }))} /></label>
            <button type="submit" className="sa-btn">Create Flag</button>
          </form>
        </article>

        <article className="sa-panel">
          <h3>Existing Flags</h3>
          <ul className="sa-list-card">
            {flags.map((flag) => (
              <li key={flag.id}><div><strong>{flag.flag}</strong><p>{flag.rollout}</p></div><Badge value={flag.enabled ? "active" : "inactive"} /></li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );

  const renderBackups = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Backups" subtitle="Trigger global or tenant-level backup and monitor jobs" />
      <article className="sa-panel">
        <div className="sa-actions">
          <button type="button" className="sa-btn" onClick={() => runBackup("Global")}>Run Global Backup</button>
          <button type="button" className="sa-btn ghost" onClick={() => runBackup("Tenant: Ecos Logistics")}>Backup Ecos Logistics</button>
          <button type="button" className="sa-btn ghost" onClick={() => runBackup("Tenant: Northwind Foods")}>Backup Northwind Foods</button>
        </div>
        <ul className="sa-list-card">
          {backups.map((backup) => (
            <li key={backup.id}><div><strong>{backup.scope}</strong><p>{backup.startedAt}</p></div><Badge value={backup.status} /></li>
          ))}
        </ul>
      </article>
    </div>
  );

  const renderDataManagement = () => (
    <div className="sa-page-stack">
      <SectionTitle title="Data Export / Import" subtitle="Export full tenant data, restore snapshot and migration controls" />
      <section className="sa-grid-2">
        <article className="sa-panel">
          <h3>Export</h3>
          <div className="sa-list">
            <button type="button" className="sa-btn ghost" onClick={() => exportData("All tenants")}>Export all tenants</button>
            <button type="button" className="sa-btn ghost" onClick={() => exportData("Ecos Logistics")}>Export Ecos Logistics</button>
            <button type="button" className="sa-btn ghost" onClick={() => exportData("Northwind Foods")}>Export Northwind Foods</button>
          </div>
        </article>
        <article className="sa-panel">
          <h3>Restore / Import</h3>
          <div className="sa-list">
            <button type="button" className="sa-btn" onClick={() => announce("Restore workflow started for latest snapshot")}>Restore Tenant Data</button>
            <button type="button" className="sa-btn ghost" onClick={() => announce("Import job scheduled from uploaded archive")}>Import Tenant Archive</button>
          </div>
        </article>
      </section>
    </div>
  );

  const renderPage = () => {
    if (activePage === "admin-dashboard") return renderAdminDashboard();
    if (activePage === "tenant-list") return renderTenantList();
    if (activePage === "tenant-details") return renderTenantDetails();
    if (activePage === "plans-management") return renderPlans();
    if (activePage === "transactions") return renderTransactions();
    if (activePage === "billing-invoices") return renderBillingInvoices();
    if (activePage === "all-users") return renderAllUsers();
    if (activePage === "admin-roles") return renderAdminRoles();
    if (activePage === "branding-control") return renderBrandingControl();
    if (activePage === "domain-management") return renderDomainManagement();
    if (activePage === "feature-toggles") return renderFeatureToggles();
    if (activePage === "usage-analytics") return renderUsageAnalytics();
    if (activePage === "performance-metrics") return renderPerformanceMetrics();
    if (activePage === "api-keys") return renderApiKeys();
    if (activePage === "webhooks") return renderWebhooks();
    if (activePage === "third-party-services") return renderThirdPartyServices();
    if (activePage === "activity-logs") return renderActivityLogs();
    if (activePage === "security-settings") return renderSecuritySettings();
    if (activePage === "support-tickets") return renderSupportTickets();
    if (activePage === "live-chat-logs") return renderLiveChatLogs();
    if (activePage === "broadcast-messages") return renderBroadcasts();
    if (activePage === "feature-flags") return renderFeatureFlags();
    if (activePage === "backups") return renderBackups();
    return renderDataManagement();
  };

  if (!user?.isSuperAdmin) {
    return (
      <div className="superadmin-shell">
        <main className="superadmin-main">
          <header className="sa-topbar">
            <div>
              <p className="sa-date">{today}</p>
              <h2>Access Restricted</h2>
              <small>This section is only for platform super admins.</small>
            </div>
            <div className="sa-actions">
              <button type="button" className="sa-btn" onClick={() => navigate("/")}>Go to Tenant Dashboard</button>
            </div>
          </header>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="superadmin-shell">
        <main className="superadmin-main">
          <header className="sa-topbar">
            <div>
              <p className="sa-date">{today}</p>
              <h2>Loading Admin Workspace</h2>
              <small>Syncing module data from database...</small>
            </div>
          </header>
        </main>
      </div>
    );
  }

  return (
    <div className="superadmin-shell">
      <aside className="superadmin-sidebar">
        <div className="sa-brand">
          <h1>White-Label Command</h1>
          <p>Master control for all client businesses</p>
        </div>

        <input className="sa-search" placeholder="Search pages" value={searchPage} onChange={(e) => setSearchPage(e.target.value)} />

        <div className="sa-nav-groups">
          {filteredGroups.map((group) => (
            <section key={group.title} className="sa-nav-group">
              <h4>{group.title}</h4>
              {group.items.map((item) => (
                <button type="button" key={item.key} className={activePage === item.key ? "active" : ""} onClick={() => setActivePage(item.key)}>
                  {item.label}
                </button>
              ))}
            </section>
          ))}
        </div>
      </aside>

      <main className="superadmin-main">
        <header className="sa-topbar">
          <div>
            <p className="sa-date">{today}</p>
            <h2>{pageLabel}</h2>
            <small>Signed in as {user?.name || "System Admin"} • {syncing ? "Syncing" : "Synced"}</small>
          </div>
          <div className="sa-actions">
            <button type="button" className="sa-btn ghost" onClick={loadBootstrap}>Refresh</button>
            <button type="button" className="sa-btn" onClick={() => { logout(); navigate("/login"); }}>Logout</button>
          </div>
        </header>

        {notice && <div className="sa-notice">{notice}</div>}
        {error && <div className="error-box">{error}</div>}

        {renderPage()}
      </main>
    </div>
  );
}
