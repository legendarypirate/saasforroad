/**
 * Job-seeker admin ↔ Anket (RCOS) bridge.
 * Frontend (vlemj) → road /api/job-seeker → https://api.rcos.mn/api/hr/admin/*
 *
 * road/.env (VPS vlemj):
 *   RCOS_API_URL=https://api.rcos.mn
 *   RCOS_SERVICE_KEY=<same-as-rcos>
 *
 * rcos backend/.env (api.rcos.mn):
 *   RCOS_SERVICE_KEY=<same-as-road>
 */
function rcosConfig() {
  const url = (process.env.RCOS_API_URL || "https://api.rcos.mn").replace(/\/$/, "");
  // Must match rcos backend DEFAULT / RCOS_SERVICE_KEY
  const key = (
    process.env.RCOS_SERVICE_KEY || "rcos_prod_vlemj_anket_shared_2026"
  ).trim();
  return { url, key };
}

async function rcosFetch(path, options = {}) {
  const { url, key } = rcosConfig();

  let res;
  try {
    res = await fetch(`${url}/api/hr${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-RCOS-Key": key,
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    const err = new Error(
      `RCOS холбогдохгүй (${url}): ${e.message}. api.rcos.mn ажиллаж байгаа эсэхийг шалгана уу.`,
    );
    err.status = 502;
    throw err;
  }

  const json = await res.json().catch(() => ({
    success: false,
    message: `RCOS HTTP ${res.status}`,
  }));
  if (!res.ok || json.success === false) {
    const err = new Error(json.message || `RCOS алдаа (${res.status})`);
    err.status = res.status >= 400 ? res.status : 502;
    err.body = json;
    throw err;
  }
  return json;
}

exports.list = async (req, res) => {
  try {
    const qs = new URLSearchParams();
    ["q", "province", "available", "limit"].forEach((k) => {
      if (req.query[k] != null && req.query[k] !== "") qs.set(k, String(req.query[k]));
    });
    const q = qs.toString();
    const json = await rcosFetch(`/admin/candidates${q ? `?${q}` : ""}`);
    res.json(json);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const json = await rcosFetch(`/admin/candidates/${req.params.id}`);
    res.json(json);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.createHireRequest = async (req, res) => {
  try {
    const body = {
      employer_name: req.body.employer_name,
      job_title: req.body.job_title,
      message: req.body.message,
      requested_by: req.body.requested_by || req.body.admin_name || null,
      candidate_id: Number(req.params.id),
    };
    const json = await rcosFetch(`/admin/candidates/${req.params.id}/hire-requests`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    res.json(json);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      data: err.body?.data,
    });
  }
};

exports.listHireRequests = async (req, res) => {
  try {
    const qs = new URLSearchParams();
    if (req.query.status) qs.set("status", String(req.query.status));
    if (req.query.limit) qs.set("limit", String(req.query.limit));
    const q = qs.toString();
    const json = await rcosFetch(`/admin/hire-requests${q ? `?${q}` : ""}`);
    res.json(json);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
