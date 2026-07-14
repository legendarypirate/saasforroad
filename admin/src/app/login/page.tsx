"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("platform");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(username.trim(), password);
      setSession(res.token, res.admin);
      router.replace("/tenants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={onSubmit}>
        <div style={{ display: "flex", gap: "0.85rem", alignItems: "center", marginBottom: "1.35rem" }}>
          <div className="brand-mark">R</div>
          <div>
            <div className="muted" style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              admin.rcos.mn
            </div>
            <h1 className="page-title" style={{ fontSize: "1.55rem" }}>
              Platform Admin
            </h1>
          </div>
        </div>
        <p className="muted" style={{ margin: "0 0 1.25rem", lineHeight: 1.5 }}>
          Register tenants, domains, modules, and superadmins for Road SaaS.
        </p>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? <p className="error">{error}</p> : null}

        <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.35rem" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
