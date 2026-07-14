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
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
      }}
    >
      <form className="panel" style={{ width: "min(420px, 100%)" }} onSubmit={onSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>
            admin.rcos.mn
          </div>
          <h1 style={{ margin: "0.2rem 0 0.35rem", fontSize: "1.6rem" }}>RCOS Platform</h1>
          <p className="muted" style={{ margin: 0 }}>
            Tenant registration and module control
          </p>
        </div>

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

        <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
