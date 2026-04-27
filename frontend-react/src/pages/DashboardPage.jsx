import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { key: "overview", label: "Overview" },
  { key: "leads", label: "Leads Hub" },
  { key: "customers", label: "Customers" },
  { key: "deals", label: "Deals Room" },
  { key: "invoices", label: "Billing" },
  { key: "followups", label: "Follow-ups" },
  { key: "settings", label: "Settings" }
];

const leadStatuses = ["new", "contacted", "qualified", "proposal", "won", "lost"];
const dealStages = ["pipeline", "negotiation", "won", "lost"];
const invoiceStatuses = ["draft", "sent", "paid", "overdue"];
const followUpChannels = ["whatsapp", "call", "email", "meeting"];

const getInitialForms = () => ({
  lead: { name: "", email: "", phone: "", source: "", status: "new", assignedTo: "", notes: "" },
  customer: { name: "", email: "", phone: "", company: "", address: "", tags: "", notes: "" },
  deal: {
    title: "",
    value: "",
    customerName: "",
    expectedCloseDate: "",
    stage: "pipeline",
    probability: 50
  },
  invoice: {
    invoiceNumber: "",
    customerName: "",
    status: "draft",
    dueDate: "",
    itemLabel: "",
    quantity: 1,
    unitPrice: ""
  },
  followUp: { customerName: "", channel: "call", dueAt: "", notes: "" }
});

const toCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const toDateTimeLabel = (value) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
};

const toDateLabel = (value) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString();
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function TrendChart({ points }) {
  const width = 620;
  const height = 220;
  const padding = 26;

  if (!points.length) {
    return <p className="muted">No timeline data yet</p>;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const chartPoints = points.map((point, index) => {
    const x = padding + index * xStep;
    const y = height - padding - (point.value / maxValue) * (height - padding * 2);
    return { ...point, x, y };
  });

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${height - padding} L ${chartPoints[0].x} ${height - padding} Z`;

  return (
    <div className="trend-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue trend chart">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-color)" stopOpacity="0.42" />
            <stop offset="100%" stopColor="var(--brand-color)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {Array.from({ length: 4 }).map((_, index) => {
          const y = padding + ((height - padding * 2) * index) / 3;
          return <line key={index} x1={padding} y1={y} x2={width - padding} y2={y} className="trend-grid" />;
        })}
        <path d={areaPath} className="trend-area" />
        <path d={linePath} className="trend-line" />
        {chartPoints.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="4" className="trend-point" />
        ))}
      </svg>
      <div className="trend-labels">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

const downloadCsv = (rows, name) => {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(
      rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? "";
            const text = String(value).replace(/"/g, '""');
            return `"${text}"`;
          })
          .join(",")
      )
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${name}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function DashboardPage() {
  const [activePage, setActivePage] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [forms, setForms] = useState(getInitialForms);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");

  const { api, tenant, user, token, logout } = useAuth();
  const navigate = useNavigate();

  const brandStyle = useMemo(
    () => ({
      "--brand-color": tenant?.primaryColor || "#0f766e"
    }),
    [tenant]
  );

  const resetForms = () => setForms(getInitialForms());

  const notifySuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2400);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, leadsResponse, customersResponse, dealsResponse, invoicesResponse, followUpsResponse] =
        await Promise.all([
          api.get("/api/crm/dashboard/summary"),
          api.get("/api/crm/leads"),
          api.get("/api/crm/customers"),
          api.get("/api/crm/deals"),
          api.get("/api/crm/invoices"),
          api.get("/api/crm/follow-ups")
        ]);

      setSummary(summaryResponse.data);
      setLeads(leadsResponse.data || []);
      setCustomers(customersResponse.data || []);
      setDeals(dealsResponse.data || []);
      setInvoices(invoicesResponse.data || []);
      setFollowUps(followUpsResponse.data || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load CRM data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    loadData();
  }, [token]);

  const updateForm = (formKey, key, value) => {
    setForms((prev) => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        [key]: value
      }
    }));
  };

  const createLead = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await api.post("/api/crm/leads", forms.lead);
      setForms((prev) => ({
        ...prev,
        lead: getInitialForms().lead
      }));
      notifySuccess("Lead created");
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Lead creation failed");
    }
  };

  const updateLeadStatus = async (leadId, status) => {
    setError("");
    try {
      await api.patch(`/api/crm/leads/${leadId}`, { status });
      notifySuccess("Lead status updated");
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Lead update failed");
    }
  };

  const createCustomer = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/crm/customers", {
        ...forms.customer,
        tags: forms.customer.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      });
      setForms((prev) => ({
        ...prev,
        customer: getInitialForms().customer
      }));
      notifySuccess("Customer added");
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Customer creation failed");
    }
  };

  const createDeal = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/crm/deals", {
        ...forms.deal,
        value: Number(forms.deal.value || 0),
        probability: Number(forms.deal.probability || 0)
      });
      setForms((prev) => ({
        ...prev,
        deal: getInitialForms().deal
      }));
      notifySuccess("Deal created");
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Deal creation failed");
    }
  };

  const createInvoice = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const quantity = Number(forms.invoice.quantity || 1);
      const unitPrice = Number(forms.invoice.unitPrice || 0);
      const totalAmount = quantity * unitPrice;

      await api.post("/api/crm/invoices", {
        invoiceNumber: forms.invoice.invoiceNumber,
        customerName: forms.invoice.customerName,
        status: forms.invoice.status,
        dueDate: forms.invoice.dueDate,
        items: [{ label: forms.invoice.itemLabel, quantity, unitPrice }],
        totalAmount
      });

      setForms((prev) => ({
        ...prev,
        invoice: getInitialForms().invoice
      }));
      notifySuccess("Invoice generated");
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Invoice creation failed");
    }
  };

  const createFollowUp = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/crm/follow-ups", {
        customerName: forms.followUp.customerName,
        channel: forms.followUp.channel,
        dueAt: forms.followUp.dueAt,
        notes: forms.followUp.notes
      });
      setForms((prev) => ({
        ...prev,
        followUp: getInitialForms().followUp
      }));
      notifySuccess("Follow-up planned");
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Follow-up creation failed");
    }
  };

  const sendWhatsAppReminder = async (followUp) => {
    setError("");
    try {
      await api.post(`/api/crm/follow-ups/${followUp._id}/send-whatsapp`, {
        to: "+919999999999",
        message: `Reminder from ${tenant?.name}: follow-up with ${followUp.customerName}`
      });
      notifySuccess("WhatsApp reminder sent");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "WhatsApp sending failed");
    }
  };

  const monthlyForecast = useMemo(() => {
    const inProgressDeals = deals.filter((deal) => deal.stage !== "lost");
    return inProgressDeals.reduce(
      (sum, deal) => sum + Number(deal.value || 0) * (Number(deal.probability || 0) / 100),
      0
    );
  }, [deals]);

  const followUpsToday = useMemo(() => {
    const today = new Date();
    return followUps.filter((item) => {
      const due = new Date(item.dueAt);
      return due.toDateString() === today.toDateString();
    }).length;
  }, [followUps]);

  const overdueInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "overdue"),
    [invoices]
  );

  const overdueFollowUps = useMemo(() => {
    const now = new Date();
    return followUps.filter((item) => item.status !== "completed" && new Date(item.dueAt) < now);
  }, [followUps]);

  const stageCounts = useMemo(
    () =>
      dealStages.reduce((acc, stage) => {
        acc[stage] = deals.filter((deal) => deal.stage === stage).length;
        return acc;
      }, {}),
    [deals]
  );

  const searchableRows = useMemo(() => {
    const query = globalQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const collection = [
      ...leads.map((lead) => ({ type: "Lead", title: lead.name, subtitle: lead.source || lead.email || "-" })),
      ...customers.map((customer) => ({ type: "Customer", title: customer.name, subtitle: customer.company || "-" })),
      ...deals.map((deal) => ({ type: "Deal", title: deal.title, subtitle: deal.customerName || "-" })),
      ...invoices.map((invoice) => ({ type: "Invoice", title: invoice.invoiceNumber, subtitle: invoice.customerName || "-" }))
    ];

    return collection
      .filter(
        (item) =>
          item.title?.toLowerCase().includes(query) || item.subtitle?.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [globalQuery, leads, customers, deals, invoices]);

  const leadRows = useMemo(() => {
    if (leadFilter === "all") {
      return leads;
    }
    return leads.filter((lead) => lead.status === leadFilter);
  }, [leadFilter, leads]);

  const topSources = useMemo(() => {
    const counter = {};
    for (const lead of leads) {
      const key = lead.source || "unknown";
      counter[key] = (counter[key] || 0) + 1;
    }

    return Object.entries(counter)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [leads]);

  const pipelineShare = useMemo(() => {
    const live = deals.filter((deal) => deal.stage !== "lost");
    const total = live.reduce((sum, deal) => sum + Number(deal.value || 0), 0) || 1;

    return live
      .map((deal) => ({
        id: deal._id,
        title: deal.title,
        stage: deal.stage,
        value: Number(deal.value || 0),
        ratio: Math.round((Number(deal.value || 0) / total) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [deals]);

  const revenueTrend = useMemo(() => {
    const now = new Date();
    const buckets = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const label = monthDate.toLocaleDateString("en-IN", { month: "short" });
      buckets.push({
        key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
        label,
        value: 0
      });
    }

    for (const invoice of invoices) {
      const sourceDate = invoice.dueDate || invoice.createdAt;
      if (!sourceDate) {
        continue;
      }

      const parsed = new Date(sourceDate);
      if (Number.isNaN(parsed.getTime())) {
        continue;
      }

      const bucketKey = `${parsed.getFullYear()}-${parsed.getMonth()}`;
      const bucket = buckets.find((entry) => entry.key === bucketKey);
      if (bucket) {
        bucket.value += Number(invoice.totalAmount || 0);
      }
    }

    return buckets.map(({ label, value }) => ({ label, value }));
  }, [invoices]);

  const leadFunnel = useMemo(() => {
    const total = Math.max(leads.length, 1);
    return leadStatuses.map((status) => {
      const count = leads.filter((lead) => lead.status === status).length;
      const ratio = clamp(Math.round((count / total) * 100), 0, 100);
      return { label: status, count, ratio };
    });
  }, [leads]);

  const stageDistribution = useMemo(() => {
    const total = Math.max(deals.length, 1);
    return dealStages.map((stage) => {
      const count = deals.filter((deal) => deal.stage === stage).length;
      const ratio = clamp(Math.round((count / total) * 100), 0, 100);
      return { label: stage, count, ratio };
    });
  }, [deals]);

  const renderOverview = () => (
    <>
      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <h3>Total Leads</h3>
          <strong>{summary?.leadCount ?? leads.length}</strong>
          <p>Captured from all sources</p>
        </article>
        <article className="admin-stat-card">
          <h3>Customers</h3>
          <strong>{summary?.customerCount ?? customers.length}</strong>
          <p>Active customer records</p>
        </article>
        <article className="admin-stat-card">
          <h3>Open Pipeline</h3>
          <strong>{toCurrency(summary?.pipelineValue ?? 0)}</strong>
          <p>Deals excluding lost stage</p>
        </article>
        <article className="admin-stat-card">
          <h3>Forecast</h3>
          <strong>{toCurrency(monthlyForecast)}</strong>
          <p>Weighted by probability</p>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <header className="admin-panel-header-inline">
            <h2>Quick Search</h2>
            <span className="pill">Global</span>
          </header>
          <input
            placeholder="Search leads, customers, deals, invoices"
            value={globalQuery}
            onChange={(event) => setGlobalQuery(event.target.value)}
          />
          <ul className="admin-list compact">
            {searchableRows.map((row, index) => (
              <li key={`${row.type}-${row.title}-${index}`}>
                <div>
                  <strong>{row.title}</strong>
                  <p>{row.subtitle}</p>
                </div>
                <span className="pill">{row.type}</span>
              </li>
            ))}
            {!searchableRows.length && <li className="muted">Type to search your workspace data</li>}
          </ul>
        </article>

        <article className="admin-panel">
          <header>
            <h2>Execution Radar</h2>
          </header>
          <div className="kpi-stack">
            <div>
              <h4>Follow-ups Today</h4>
              <p>{followUpsToday}</p>
            </div>
            <div>
              <h4>Overdue Follow-ups</h4>
              <p>{overdueFollowUps.length}</p>
            </div>
            <div>
              <h4>Overdue Invoices</h4>
              <p>{overdueInvoices.length}</p>
            </div>
            <div>
              <h4>Won Deals</h4>
              <p>{stageCounts.won || 0}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <header className="admin-panel-header-inline">
            <h2>Revenue Trend</h2>
            <span className="pill">6 Months</span>
          </header>
          <TrendChart points={revenueTrend} />
        </article>

        <article className="admin-panel">
          <header className="admin-panel-header-inline">
            <h2>Lead Funnel</h2>
            <span className="pill">Live</span>
          </header>
          <div className="chart-bars">
            {leadFunnel.map((item) => (
              <div key={item.label} className="chart-bar-row">
                <div className="chart-bar-label">
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="chart-track">
                  <div style={{ width: `${item.ratio}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <header className="admin-panel-header-inline">
            <h2>Top Lead Sources</h2>
            <button
              type="button"
              className="ghost-link"
              onClick={() => downloadCsv(leads, "leads-export")}
            >
              Export Leads
            </button>
          </header>
          <div className="mini-chart-list">
            {topSources.map((source) => (
              <div key={source.source}>
                <span>{source.source}</span>
                <strong>{source.count}</strong>
              </div>
            ))}
            {!topSources.length && <p className="muted">No source analytics yet</p>}
          </div>
        </article>

        <article className="admin-panel">
          <header className="admin-panel-header-inline">
            <h2>Pipeline Concentration</h2>
            <button
              type="button"
              className="ghost-link"
              onClick={() => downloadCsv(deals, "deals-export")}
            >
              Export Deals
            </button>
          </header>
          <div className="progress-list">
            {pipelineShare.map((deal) => (
              <div key={deal.id}>
                <div className="progress-label">
                  <span>{deal.title}</span>
                  <strong>{deal.ratio}%</strong>
                </div>
                <div className="progress-track">
                  <div style={{ width: `${deal.ratio}%` }} />
                </div>
              </div>
            ))}
            {!pipelineShare.length && <p className="muted">No active deals found</p>}
          </div>

          <div className="stage-bars">
            {stageDistribution.map((stage) => (
              <div key={stage.label} className="stage-bar-row">
                <span>{stage.label}</span>
                <div className="stage-bar-track">
                  <div style={{ width: `${stage.ratio}%` }} />
                </div>
                <strong>{stage.count}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );

  const renderLeads = () => (
    <section className="admin-overview-grid">
      <article className="admin-panel">
        <header className="admin-panel-header-inline">
          <h2>Create Lead</h2>
          <div className="segmented">
            <button
              type="button"
              className={leadFilter === "all" ? "active" : ""}
              onClick={() => setLeadFilter("all")}
            >
              All
            </button>
            {leadStatuses.map((status) => (
              <button
                type="button"
                key={status}
                className={leadFilter === status ? "active" : ""}
                onClick={() => setLeadFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </header>
        <form onSubmit={createLead} className="admin-form-grid">
          <input placeholder="Name" value={forms.lead.name} onChange={(e) => updateForm("lead", "name", e.target.value)} required />
          <input placeholder="Email" type="email" value={forms.lead.email} onChange={(e) => updateForm("lead", "email", e.target.value)} />
          <input placeholder="Phone" value={forms.lead.phone} onChange={(e) => updateForm("lead", "phone", e.target.value)} />
          <input placeholder="Source" value={forms.lead.source} onChange={(e) => updateForm("lead", "source", e.target.value)} />
          <input placeholder="Assigned To" value={forms.lead.assignedTo} onChange={(e) => updateForm("lead", "assignedTo", e.target.value)} />
          <select value={forms.lead.status} onChange={(e) => updateForm("lead", "status", e.target.value)}>
            {leadStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <textarea className="span-2" placeholder="Notes" value={forms.lead.notes} onChange={(e) => updateForm("lead", "notes", e.target.value)} />
          <button type="submit" className="span-2">Save Lead</button>
        </form>
      </article>

      <article className="admin-panel">
        <header className="admin-panel-header-inline">
          <h2>Lead Workflow</h2>
          <button
            type="button"
            className="ghost-link"
            onClick={() => downloadCsv(leadRows, "filtered-leads")}
          >
            Export View
          </button>
        </header>
        <ul className="admin-list">
          {leadRows.map((lead) => (
            <li key={lead._id} className="admin-list-row">
              <div>
                <strong>{lead.name}</strong>
                <p>{lead.email || lead.phone || "No contact info"}</p>
              </div>
              <select value={lead.status} onChange={(e) => updateLeadStatus(lead._id, e.target.value)} className="mini-select">
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </li>
          ))}
          {!leadRows.length && <li className="muted">No leads in selected filter</li>}
        </ul>
      </article>
    </section>
  );

  const renderCustomers = () => (
    <section className="admin-overview-grid">
      <article className="admin-panel">
        <header className="admin-panel-header-inline">
          <h2>Add Customer</h2>
          <button type="button" className="ghost-link" onClick={() => downloadCsv(customers, "customers-export")}>Export Customers</button>
        </header>
        <form onSubmit={createCustomer} className="admin-form-grid">
          <input placeholder="Name" value={forms.customer.name} onChange={(e) => updateForm("customer", "name", e.target.value)} required />
          <input placeholder="Email" type="email" value={forms.customer.email} onChange={(e) => updateForm("customer", "email", e.target.value)} />
          <input placeholder="Phone" value={forms.customer.phone} onChange={(e) => updateForm("customer", "phone", e.target.value)} />
          <input placeholder="Company" value={forms.customer.company} onChange={(e) => updateForm("customer", "company", e.target.value)} />
          <input className="span-2" placeholder="Address" value={forms.customer.address} onChange={(e) => updateForm("customer", "address", e.target.value)} />
          <input className="span-2" placeholder="Tags (comma separated)" value={forms.customer.tags} onChange={(e) => updateForm("customer", "tags", e.target.value)} />
          <textarea className="span-2" placeholder="Notes" value={forms.customer.notes} onChange={(e) => updateForm("customer", "notes", e.target.value)} />
          <button type="submit" className="span-2">Save Customer</button>
        </form>
      </article>

      <article className="admin-panel">
        <header><h2>Customer Directory</h2></header>
        <ul className="admin-list">
          {customers.map((customer) => (
            <li key={customer._id}>
              <div>
                <strong>{customer.name}</strong>
                <p>{customer.company || "Independent"}</p>
              </div>
              <span>{customer.phone || "-"}</span>
            </li>
          ))}
          {!customers.length && <li className="muted">No customers yet</li>}
        </ul>
      </article>
    </section>
  );

  const renderDeals = () => (
    <section className="admin-overview-grid">
      <article className="admin-panel">
        <header><h2>Create Deal</h2></header>
        <form onSubmit={createDeal} className="admin-form-grid">
          <input placeholder="Deal title" value={forms.deal.title} onChange={(e) => updateForm("deal", "title", e.target.value)} required />
          <input placeholder="Value" type="number" min="0" value={forms.deal.value} onChange={(e) => updateForm("deal", "value", e.target.value)} required />
          <input placeholder="Customer name" value={forms.deal.customerName} onChange={(e) => updateForm("deal", "customerName", e.target.value)} />
          <input type="date" value={forms.deal.expectedCloseDate} onChange={(e) => updateForm("deal", "expectedCloseDate", e.target.value)} />
          <select value={forms.deal.stage} onChange={(e) => updateForm("deal", "stage", e.target.value)}>
            {dealStages.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
          <input type="number" min="0" max="100" placeholder="Probability %" value={forms.deal.probability} onChange={(e) => updateForm("deal", "probability", e.target.value)} />
          <button type="submit" className="span-2">Save Deal</button>
        </form>
      </article>

      <article className="admin-panel">
        <header className="admin-panel-header-inline">
          <h2>Deal Board</h2>
          <button type="button" className="ghost-link" onClick={() => downloadCsv(deals, "deals-board")}>Export</button>
        </header>
        <div className="stage-summary-grid">
          {dealStages.map((stage) => (
            <div key={stage}>
              <span>{stage}</span>
              <strong>{stageCounts[stage] || 0}</strong>
            </div>
          ))}
        </div>
        <ul className="admin-list">
          {deals.map((deal) => (
            <li key={deal._id}>
              <div>
                <strong>{deal.title}</strong>
                <p>{deal.customerName || "Unknown customer"}</p>
              </div>
              <div className="deal-meta">
                <span>{toCurrency(deal.value)}</span>
                <span className="pill">{deal.stage}</span>
              </div>
            </li>
          ))}
          {!deals.length && <li className="muted">No deals yet</li>}
        </ul>
      </article>
    </section>
  );

  const renderInvoices = () => (
    <section className="admin-overview-grid">
      <article className="admin-panel">
        <header><h2>Create Invoice</h2></header>
        <form onSubmit={createInvoice} className="admin-form-grid">
          <input placeholder="Invoice number" value={forms.invoice.invoiceNumber} onChange={(e) => updateForm("invoice", "invoiceNumber", e.target.value)} required />
          <input placeholder="Customer name" value={forms.invoice.customerName} onChange={(e) => updateForm("invoice", "customerName", e.target.value)} required />
          <select value={forms.invoice.status} onChange={(e) => updateForm("invoice", "status", e.target.value)}>
            {invoiceStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input type="date" value={forms.invoice.dueDate} onChange={(e) => updateForm("invoice", "dueDate", e.target.value)} />
          <input className="span-2" placeholder="Item/Service" value={forms.invoice.itemLabel} onChange={(e) => updateForm("invoice", "itemLabel", e.target.value)} required />
          <input placeholder="Quantity" type="number" min="1" value={forms.invoice.quantity} onChange={(e) => updateForm("invoice", "quantity", e.target.value)} />
          <input placeholder="Unit price" type="number" min="0" value={forms.invoice.unitPrice} onChange={(e) => updateForm("invoice", "unitPrice", e.target.value)} required />
          <button type="submit" className="span-2">Generate Invoice</button>
        </form>
      </article>

      <article className="admin-panel">
        <header className="admin-panel-header-inline">
          <h2>Invoice Ledger</h2>
          <button type="button" className="ghost-link" onClick={() => downloadCsv(invoices, "invoices-export")}>Export</button>
        </header>
        <ul className="admin-list">
          {invoices.map((invoice) => (
            <li key={invoice._id}>
              <div>
                <strong>{invoice.invoiceNumber}</strong>
                <p>{invoice.customerName} • Due {toDateLabel(invoice.dueDate)}</p>
              </div>
              <div className="deal-meta">
                <span>{toCurrency(invoice.totalAmount)}</span>
                <span className="pill">{invoice.status}</span>
              </div>
            </li>
          ))}
          {!invoices.length && <li className="muted">No invoices yet</li>}
        </ul>
      </article>
    </section>
  );

  const renderFollowUps = () => (
    <section className="admin-overview-grid">
      <article className="admin-panel">
        <header><h2>Schedule Follow-up</h2></header>
        <form onSubmit={createFollowUp} className="admin-form-grid">
          <input placeholder="Customer name" value={forms.followUp.customerName} onChange={(e) => updateForm("followUp", "customerName", e.target.value)} required />
          <select value={forms.followUp.channel} onChange={(e) => updateForm("followUp", "channel", e.target.value)}>
            {followUpChannels.map((channel) => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </select>
          <input className="span-2" type="datetime-local" value={forms.followUp.dueAt} onChange={(e) => updateForm("followUp", "dueAt", e.target.value)} required />
          <textarea className="span-2" placeholder="Notes" value={forms.followUp.notes} onChange={(e) => updateForm("followUp", "notes", e.target.value)} />
          <button type="submit" className="span-2">Save Follow-up</button>
        </form>
      </article>

      <article className="admin-panel">
        <header className="admin-panel-header-inline">
          <h2>Follow-up Queue</h2>
          <span className="pill">{followUps.length} scheduled</span>
        </header>
        <ul className="admin-list">
          {followUps.map((followUp) => (
            <li key={followUp._id} className="admin-list-row">
              <div>
                <strong>{followUp.customerName}</strong>
                <p>{toDateTimeLabel(followUp.dueAt)} • {followUp.channel}</p>
              </div>
              <button type="button" className="secondary mini-button" onClick={() => sendWhatsAppReminder(followUp)}>
                Send WA
              </button>
            </li>
          ))}
          {!followUps.length && <li className="muted">No follow-ups scheduled</li>}
        </ul>
      </article>
    </section>
  );

  const renderSettings = () => (
    <section className="admin-overview-grid single">
      <article className="admin-panel">
        <header>
          <h2>Business Profile</h2>
        </header>
        <div className="settings-grid">
          <div><h4>Brand Name</h4><p>{tenant?.name || "-"}</p></div>
          <div><h4>Tenant Slug</h4><p>{tenant?.slug || "-"}</p></div>
          <div><h4>Primary Color</h4><p>{tenant?.primaryColor || "-"}</p></div>
          <div><h4>Admin Owner</h4><p>{user?.name || "-"}</p></div>
          <div><h4>Admin Email</h4><p>{user?.email || "-"}</p></div>
          <div><h4>Configured Domain</h4><p>{tenant?.domain || "Not set"}</p></div>
        </div>
        <div className="settings-footer">
          <button type="button" className="secondary" onClick={resetForms}>Reset All Form Drafts</button>
          <button type="button" onClick={() => { logout(); navigate("/login"); }}>Logout</button>
        </div>
      </article>
    </section>
  );

  const renderActivePage = () => {
    if (activePage === "overview") return renderOverview();
    if (activePage === "leads") return renderLeads();
    if (activePage === "customers") return renderCustomers();
    if (activePage === "deals") return renderDeals();
    if (activePage === "invoices") return renderInvoices();
    if (activePage === "followups") return renderFollowUps();
    return renderSettings();
  };

  return (
    <div className="admin-shell enhanced" style={brandStyle}>
      <aside className="admin-sidebar">
        <div className="brand-block">
          <h1>{tenant?.name || "Business CRM"}</h1>
          <p>{tenant?.slug || "workspace"}</p>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} type="button" className={activePage === item.key ? "active" : ""} onClick={() => setActivePage(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h2>{NAV_ITEMS.find((item) => item.key === activePage)?.label}</h2>
            <p>Logged in as {user?.name} ({user?.role})</p>
          </div>
          <div className="topbar-actions">
            <button type="button" className="secondary" onClick={loadData} disabled={isLoading}>{isLoading ? "Refreshing..." : "Refresh"}</button>
            <button type="button" onClick={() => { logout(); navigate("/login"); }}>Logout</button>
          </div>
        </header>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        {renderActivePage()}
      </main>
    </div>
  );
}
