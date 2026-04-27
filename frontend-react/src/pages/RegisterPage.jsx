import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const [form, setForm] = useState({
    companyName: "",
    slug: "",
    domain: "",
    logoUrl: "",
    primaryColor: "#0f766e",
    adminName: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { api, saveSession } = useAuth();

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/api/auth/register-tenant", form);
      saveSession(data);
      navigate("/");
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.message;
      if (serverMessage) {
        setError(serverMessage);
        return;
      }

      if (requestError.code === "ERR_NETWORK") {
        setError("Backend unreachable. Ensure API is running at http://localhost:5000.");
        return;
      }

      setError(requestError.message || "Registration failed");
    }
  };

  return (
    <div className="auth-shell register">
      <div className="auth-card">
        <h1>Create Your CRM Brand</h1>
        <p>Launch your own branded business CRM in minutes</p>
        <form onSubmit={onSubmit}>
          <label>
            Company Name
            <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} required />
          </label>
          <label>
            Brand Slug
            <input value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="my-crm" />
          </label>
          <label>
            Domain (optional)
            <input value={form.domain} onChange={(e) => update("domain", e.target.value)} />
          </label>
          <label>
            Logo URL (optional)
            <input value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} />
          </label>
          <label>
            Primary Color
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => update("primaryColor", e.target.value)}
            />
          </label>
          <label>
            Admin Name
            <input value={form.adminName} onChange={(e) => update("adminName", e.target.value)} required />
          </label>
          <label>
            Admin Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button type="submit">Create Tenant</button>
        </form>
        <p>
          Already onboarded? <Link to="/login">Go to login</Link>
        </p>
      </div>
    </div>
  );
}