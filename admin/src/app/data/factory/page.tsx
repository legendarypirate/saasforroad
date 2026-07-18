"use client";

import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { api, PlatformFactory } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  rejected: "Rejected",
  inactive: "Inactive",
};

const TYPE_LABEL: Record<string, string> = {
  asphalt: "Asphalt",
  cement: "Cement",
  crushing: "Crushing",
  emulsion: "Emulsion",
  ctb: "CTB",
  other: "Other",
};

export default function PlatformFactoriesPage() {
  const [rows, setRows] = useState<PlatformFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "active" | "rejected" | "inactive"
  >("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PlatformFactory | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listFactories({
        q: q.trim() || undefined,
        status: filter === "all" ? undefined : filter,
      })
      .then((res) => setRows(res.factories))
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
    const pending = rows.filter((r) => r.status === "pending").length;
    const active = rows.filter((r) => r.status === "active").length;
    return { all, pending, active };
  }, [rows]);

  async function setStatus(
    row: PlatformFactory,
    status: "active" | "rejected" | "inactive",
    note?: string
  ) {
    setBusyId(row.id);
    setError("");
    setMessage("");
    try {
      await api.setFactoryStatus(row.id, { status, note });
      setMessage(
        status === "active"
          ? `Approved “${row.name}”`
          : status === "rejected"
            ? `Rejected “${row.name}”`
            : `Deactivated “${row.name}”`
      );
      setDetail(null);
      setRejectNote("");
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
          <h1 className="page-title">Үйлдвэр</h1>
          <p className="page-desc">
            Factories (plants) added by company accounts in the plant app. Each
            company may have many plants — approve per plant to publish on
            tenant Үйлдвэр maps.
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
          <div className="label">Pending</div>
          <div className="value">{loading ? "—" : counts.pending}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active</div>
          <div className="value">{loading ? "—" : counts.active}</div>
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
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          style={{
            padding: "0.65rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--line-strong)",
            background: "var(--input-bg)",
            color: "var(--ink)",
          }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="inactive">Inactive</option>
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
                  <th>Plant</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Coords</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className="btn secondary chip"
                        style={{ padding: 0, border: "none", background: "none" }}
                        onClick={() => {
                          setDetail(row);
                          setRejectNote(row.rejection_note || "");
                        }}
                      >
                        <strong style={{ color: "var(--accent)" }}>{row.name}</strong>
                      </button>
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
                      <div>{row.company_name || "—"}</div>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>
                        {row.company_username
                          ? `@${row.company_username}`
                          : row.owner_name || ""}
                      </div>
                    </td>
                    <td>
                      {TYPE_LABEL[row.plant_type || ""] || row.plant_type || "—"}
                    </td>
                    <td>
                      <div>{row.phone || row.company_phone || "—"}</div>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>
                        {[row.province, row.location].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {row.latitude != null && row.longitude != null
                        ? `${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}`
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          row.status === "active"
                            ? "on"
                            : row.status === "pending"
                              ? ""
                              : "off"
                        }`}
                      >
                        {STATUS_LABEL[row.status] || row.status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {row.status === "pending" || row.status === "rejected" || row.status === "inactive" ? (
                        <button
                          type="button"
                          className="btn chip"
                          disabled={busyId === row.id}
                          onClick={() => setStatus(row, "active")}
                        >
                          {busyId === row.id ? "…" : "Approve"}
                        </button>
                      ) : null}
                      {row.status === "pending" ? (
                        <button
                          type="button"
                          className="btn secondary chip"
                          style={{ marginLeft: 6 }}
                          disabled={busyId === row.id}
                          onClick={() => {
                            setDetail(row);
                            setRejectNote("");
                          }}
                        >
                          Reject
                        </button>
                      ) : null}
                      {row.status === "active" ? (
                        <button
                          type="button"
                          className="btn secondary chip"
                          disabled={busyId === row.id}
                          onClick={() => setStatus(row, "inactive")}
                        >
                          {busyId === row.id ? "…" : "Deactivate"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        No plants yet. Companies register in the plant app, then
                        add plants one by one for approval.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {detail ? (
        <div
          className="panel"
          style={{ marginTop: "1rem", maxWidth: 560 }}
        >
          <div className="page-header" style={{ marginBottom: "0.75rem" }}>
            <div>
              <h2 className="page-title" style={{ fontSize: "1.15rem" }}>
                {detail.name}
              </h2>
              <p className="page-desc">
                {detail.company_name ? `${detail.company_name} · ` : ""}
                {TYPE_LABEL[detail.plant_type || ""] || detail.plant_type} ·{" "}
                {STATUS_LABEL[detail.status] || detail.status}
              </p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setDetail(null)}
            >
              Close
            </button>
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {detail.description || "No description"}
          </p>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            {detail.latitude}, {detail.longitude}
            {detail.phone ? ` · ${detail.phone}` : ""}
            {detail.email ? ` · ${detail.email}` : ""}
          </p>
          {detail.status === "pending" ? (
            <div style={{ marginTop: "1rem" }}>
              <label className="muted" style={{ fontSize: "0.8rem" }}>
                Rejection note
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: "0.65rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line-strong)",
                  background: "var(--input-bg)",
                  color: "var(--ink)",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn"
                  disabled={busyId === detail.id}
                  onClick={() => setStatus(detail, "active")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busyId === detail.id}
                  onClick={() => setStatus(detail, "rejected", rejectNote)}
                >
                  Reject
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Shell>
  );
}
