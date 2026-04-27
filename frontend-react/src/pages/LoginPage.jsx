import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { api, saveSession } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedTenantSlug = tenantSlug.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data } = await api.post("/api/auth/login", {
        tenantSlug: normalizedTenantSlug,
        email: normalizedEmail,
        password
      });

      saveSession(data);
      navigate("/");
    } catch (requestError) {
      if (requestError.code === "ERR_NETWORK") {
        setError("Backend unreachable. Start backend on http://localhost:5000 and retry.");
        return;
      }

      setError(requestError.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>White-Label CRM</h1>
        <p>Login with your tenant slug and credentials</p>
        <form onSubmit={onSubmit}>
          <label>
            Tenant Slug
            <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button type="submit">Login</button>
        </form>
        <p>
          New business? <Link to="/register">Create tenant</Link>
        </p>
      </div>
    </div>
  );
}