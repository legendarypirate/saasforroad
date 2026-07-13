/**
 * Factory map ↔ plant.rcos.mn (RCOS) bridge.
 * Frontend → road /api/plant/rcos-* → https://api.rcos.mn/api/plant/*
 *
 * road/.env:
 *   RCOS_API_URL=https://api.rcos.mn
 *   RCOS_SERVICE_KEY=<same-as-rcos>
 */
const db = require("../models");
const Plant = db.plant_sites;
const { Op } = db.Sequelize;

function rcosConfig() {
  const url = (process.env.RCOS_API_URL || "https://api.rcos.mn").replace(/\/$/, "");
  const key = (
    process.env.RCOS_SERVICE_KEY || "rcos_prod_vlemj_anket_shared_2026"
  ).trim();
  return { url, key };
}

async function rcosFetch(path, options = {}) {
  const { url, key } = rcosConfig();

  let res;
  try {
    res = await fetch(`${url}/api/plant${path}`, {
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

/** Published factories for the zam factory map (lat/lng from plant.rcos.mn). */
exports.listMapFactories = async (_req, res) => {
  try {
    const json = await rcosFetch("/service/factories");
    res.json({ success: true, data: json.data || [] });
  } catch (err) {
    res.status(err.status || 502).json({ success: false, message: err.message });
  }
};

/** Submit local plant site for publication on plant.rcos.mn. */
exports.placeToRcos = async (req, res) => {
  try {
    const site = await Plant.findByPk(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, message: "Үйлдвэр олдсонгүй" });
    }

    const lat = Number(site.latitude);
    const lng = Number(site.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        message: "Байршил (lat/lng) байхгүй — эхлээд байршил сонгоно уу",
      });
    }

    if (site.rcos_status === "approved" && site.rcos_factory_id) {
      return res.status(409).json({
        success: false,
        message: "Энэ үйлдвэр аль хэдийн RCOS-д батлагдсан",
        data: site,
      });
    }

    const json = await rcosFetch("/service/placement-requests", {
      method: "POST",
      body: JSON.stringify({
        road_plant_site_id: site.id,
        name: site.name,
        code: site.code,
        plant_type: site.plant_type,
        location: site.location,
        aimag: site.aimag,
        latitude: lat,
        longitude: lng,
        capacity_per_hour: site.capacity_per_hour,
        capacity_unit: site.capacity_unit,
        manager_name: site.manager_name,
        phone: site.phone,
        notes: site.notes,
        requested_by_name: req.body?.requested_by_name || null,
        requested_by_email: req.body?.requested_by_email || null,
      }),
    });

    const request = json.data;
    await site.update({
      rcos_status: "pending",
      rcos_request_id: request?.id || site.rcos_request_id,
    });

    res.json({
      success: true,
      data: await Plant.findByPk(site.id),
      message: "RCOS-д илгээгдлээ — plant.rcos.mn админ батална",
    });
  } catch (err) {
    if (err.status === 409 && err.body?.data?.factory_id) {
      try {
        const site = await Plant.findByPk(req.params.id);
        if (site) {
          await site.update({
            rcos_status: "approved",
            rcos_factory_id: err.body.data.factory_id,
          });
        }
      } catch {
        /* ignore */
      }
    }
    res.status(err.status || 502).json({ success: false, message: err.message });
  }
};

/**
 * Sync local rcos_* fields from RCOS for sites that are pending/approved.
 * Call after map load so approved requests update local status.
 */
exports.syncRcosStatuses = async (_req, res) => {
  try {
    const pending = await Plant.findAll({
      where: { rcos_status: { [Op.in]: ["pending", "approved"] } },
    });

    const updates = [];
    for (const site of pending) {
      try {
        const json = await rcosFetch(
          `/service/placement-requests/by-road-site/${site.id}`,
        );
        const reqRow = json.data;
        if (!reqRow) continue;

        const patch = {};
        if (reqRow.status === "approved") {
          patch.rcos_status = "approved";
          patch.rcos_request_id = reqRow.id;
          if (reqRow.factory_id) patch.rcos_factory_id = reqRow.factory_id;
        } else if (reqRow.status === "rejected") {
          patch.rcos_status = "rejected";
          patch.rcos_request_id = reqRow.id;
          patch.rcos_factory_id = null;
        } else if (reqRow.status === "pending") {
          patch.rcos_status = "pending";
          patch.rcos_request_id = reqRow.id;
        }

        if (Object.keys(patch).length) {
          await site.update(patch);
          updates.push(site.id);
        }
      } catch {
        /* skip individual failures */
      }
    }

    res.json({ success: true, data: { synced: updates.length, ids: updates } });
  } catch (err) {
    res.status(err.status || 502).json({ success: false, message: err.message });
  }
};
