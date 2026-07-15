"use client";

import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { api, PlatformBrigade } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
};

export default function PlatformBrigadesPage() {
  const [rows, setRows] = useState<PlatformBrigade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "suspended">(
    "all"
  );
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listBrigades({
        q: q.trim() || undefined,
        status: filter === "all" ? undefined : filter,
      })
      .then((res) => setRows(res.brigades))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const counts = useMemo(() => {
    const all = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    return { all, active, off: all - active };
  }, [rows]);

  async function setStatus(row: PlatformBrigade, status: "active" | "inactive") {
    setBusyId(row.id);
    setError("");
    setMessage("");
    try {
      await api.setBrigadeStatus(row.id, { status });
      setMessage(
        status === "active"
          ? `Activated “${row.name}”`
          : `Deactivated “${row.name}”`
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Бригад</h1>
          <p className="page-desc">
            Brigades registered via the brigad app on api.rcos.mn. Activate or
            deactivate to control who companies can hire.
          </p>
        </div>
        <button type="button" className="btn secondary" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="label">Loaded</div>
          <div className="value">{loading ? "—" : counts.all}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active</div>
          <div className="value">{loading ? "—" : counts.active}</div>
        </div>
        <div className="stat-card">
          <div className="label">Off</div>
          <div className="value">{loading ? "—" : counts.off}</div>
        </div>
      </div>

      <div
        className="panel"
        style={{
          marginBottom: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
          placeholder="Search name, username, phone…"
          style={{
            flex: "1 1 220px",
            minWidth: 180,
            padding: "0.65rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--line-strong)",
            background: "var(--input-bg)",
            color: "var(--ink)",
          }}
        />
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as typeof filter)
          }
          style={{
            padding: "0.65rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--line-strong)",
            background: "var(--input-bg)",
            color: "var(--ink)",
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="button" className="btn" onClick={load}>
          Search
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="flash-ok">{message}</p> : null}

      <div className="panel">
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Leader / login</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const on = row.status === "active" && row.is_active;
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.name}</strong>
                        {row.description ? (
                          <div
                            className="muted"
                            style={{ fontSize: "0.8rem", marginTop: 2 }}
                          >
                            {row.description.slice(0, 72)}
                            {row.description.length > 72 ? "…" : ""}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div>{row.leader_name || "—"}</div>
                        <div
                          className="muted"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {row.username ? `@${row.username}` : "no login"}
                        </div>
                      </td>
                      <td>
                        <div>{row.phone || row.contact_phone || "—"}</div>
                        <div
                          className="muted"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {row.contact_email || ""}
                        </div>
                      </td>
                      <td>
                        {[row.province, row.location]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td>
                        {(row.average_rating ?? 0).toFixed(1)}
                        <div
                          className="muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          rep {(row.reputation_score ?? 0).toFixed(0)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${on ? "on" : "off"}`}>
                          {STATUS_LABEL[row.status] || row.status}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {on ? (
                          <button
                            type="button"
                            className="btn secondary chip"
                            disabled={busyId === row.id}
                            onClick={() => setStatus(row, "inactive")}
                          >
                            {busyId === row.id ? "…" : "Deactivate"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn chip"
                            disabled={busyId === row.id}
                            onClick={() => setStatus(row, "active")}
                          >
                            {busyId === row.id ? "…" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        No brigades yet. They appear here after registering in
                        the brigad mobile app (api.rcos.mn).
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
