const db = require("../models");
const { assistWsHub } = require("./assist_ws_hub");
const {
  createInvoiceForCompletedCall,
  normalizePlate,
} = require("./assist_invoice_service");

const OFFER_TIMEOUT_MS = 15000;
const OFFER_TIMEOUT_SEC = OFFER_TIMEOUT_MS / 1000;

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class AssistCallDispatcher {
  constructor() {
    /** @type {Map<number, NodeJS.Timeout>} */
    this.timers = new Map();
  }

  async serializeCall(callId) {
    const call = await db.assist_calls.findByPk(callId, {
      include: [
        { model: db.assist_services, as: "service" },
        { model: db.road_drivers, as: "driver", attributes: { exclude: ["password"] } },
        {
          model: db.service_men,
          as: "assignedServiceMan",
          attributes: { exclude: ["password"] },
        },
        {
          model: db.service_men,
          as: "currentServiceMan",
          attributes: { exclude: ["password"] },
        },
      ],
    });
    return call ? call.toJSON() : null;
  }

  async createCall({
    driverId,
    serviceId,
    note,
    lat,
    lng,
    equipmentId,
    tenantId,
    plateNumber,
  }) {
    if (!equipmentId || !tenantId) {
      throw new Error("equipment_required");
    }
    const equipment = await db.equipments.findByPk(equipmentId, {
      skipTenantScope: true,
    });
    if (!equipment || equipment.tenant_id !== tenantId) {
      throw new Error("equipment_not_found");
    }

    const code = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const call = await db.assist_calls.create({
      request_code: code,
      driver_id: driverId,
      assist_service_id: serviceId,
      note: note || null,
      driver_lat: lat,
      driver_lng: lng,
      status: "searching",
      offered_ids: [],
      equipment_id: equipmentId,
      tenant_id: tenantId,
      plate_number:
        normalizePlate(plateNumber) ||
        normalizePlate(equipment.registration_number) ||
        null,
    });
    await this.offerNext(call.id);
    return this.serializeCall(call.id);
  }

  async candidatesFor(call) {
    const links = await db.service_man_services.findAll({
      where: { assist_service_id: call.assist_service_id },
    });
    const ids = links.map((l) => l.service_man_id);
    if (!ids.length) return [];

    const men = await db.service_men.findAll({
      where: { id: ids, is_active: true, is_online: true },
    });

    const offered = new Set(call.offered_ids || []);
    return men
      .filter((m) => !offered.has(m.id))
      .filter((m) => assistWsHub.isOnline("service_man", m.id))
      .map((m) => {
        const lat = m.last_lat ?? call.driver_lat;
        const lng = m.last_lng ?? call.driver_lng;
        const distanceKm = haversineKm(
          call.driver_lat,
          call.driver_lng,
          lat,
          lng
        );
        return { man: m, distanceKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async offerNext(callId) {
    this._clearTimer(callId);
    const call = await db.assist_calls.findByPk(callId);
    if (!call) return;
    if (!["searching", "ringing"].includes(call.status)) return;

    const ranked = await this.candidatesFor(call);
    if (!ranked.length) {
      call.status = "failed";
      call.current_service_man_id = null;
      await call.save();
      const payload = await this.serializeCall(callId);
      assistWsHub.send("driver", call.driver_id, {
        type: "call_update",
        call: payload,
      });
      return;
    }

    const next = ranked[0];
    const offered = [...(call.offered_ids || []), next.man.id];
    call.offered_ids = offered;
    call.current_service_man_id = next.man.id;
    call.status = "ringing";
    call.ring_started_at = new Date();
    call.distance_km = next.distanceKm;
    call.eta_minutes = Math.max(5, Math.round(next.distanceKm * 2.2));
    await call.save();

    const payload = await this.serializeCall(callId);
    const offerPayload = {
      ...payload,
      offer_timeout_sec: OFFER_TIMEOUT_SEC,
    };
    assistWsHub.send("service_man", next.man.id, {
      type: "incoming_call",
      call: offerPayload,
    });
    assistWsHub.send("driver", call.driver_id, {
      type: "call_update",
      call: offerPayload,
    });

    this.timers.set(
      callId,
      setTimeout(() => {
        this.declineOrTimeout(callId, next.man.id, "timeout").catch(() => {});
      }, OFFER_TIMEOUT_MS)
    );
  }

  async accept(callId, serviceManId) {
    const call = await db.assist_calls.findByPk(callId);
    if (!call) throw new Error("not_found");
    if (call.status !== "ringing" || call.current_service_man_id !== serviceManId) {
      throw new Error("conflict");
    }
    this._clearTimer(callId);
    call.status = "assigned";
    call.assigned_service_man_id = serviceManId;
    call.accepted_at = new Date();
    await call.save();

    setTimeout(async () => {
      const again = await db.assist_calls.findByPk(callId);
      if (again && again.status === "assigned") {
        again.status = "en_route";
        await again.save();
        const payload = await this.serializeCall(callId);
        assistWsHub.send("driver", again.driver_id, {
          type: "call_update",
          call: payload,
        });
        assistWsHub.send("service_man", serviceManId, {
          type: "call_update",
          call: payload,
        });
      }
    }, 3000);

    const payload = await this.serializeCall(callId);
    assistWsHub.send("driver", call.driver_id, {
      type: "call_update",
      call: payload,
    });
    assistWsHub.send("service_man", serviceManId, {
      type: "call_update",
      call: payload,
    });
    return payload;
  }

  async declineOrTimeout(callId, serviceManId, reason = "declined") {
    const call = await db.assist_calls.findByPk(callId);
    if (!call) return;
    if (call.status !== "ringing" || call.current_service_man_id !== serviceManId) {
      return;
    }
    this._clearTimer(callId);
    call.status = "searching";
    call.current_service_man_id = null;
    await call.save();

    assistWsHub.send("service_man", serviceManId, {
      type: "call_ended",
      call_id: callId,
      reason,
    });
    assistWsHub.send("driver", call.driver_id, {
      type: "call_update",
      call: await this.serializeCall(callId),
      info: reason,
    });

    await this.offerNext(callId);
  }

  async cancel(callId, driverId) {
    const call = await db.assist_calls.findByPk(callId);
    if (!call || call.driver_id !== driverId) throw new Error("not_found");
    this._clearTimer(callId);
    const notifyIds = new Set(
      [call.current_service_man_id, call.assigned_service_man_id].filter(Boolean)
    );
    call.status = "cancelled";
    call.current_service_man_id = null;
    call.assigned_service_man_id = null;
    await call.save();
    const payload = await this.serializeCall(callId);
    for (const smId of notifyIds) {
      assistWsHub.send("service_man", smId, {
        type: "call_ended",
        call_id: callId,
        reason: "cancelled",
        call: payload,
      });
      assistWsHub.send("service_man", smId, {
        type: "call_update",
        call: payload,
      });
    }
    assistWsHub.send("driver", driverId, { type: "call_update", call: payload });
    return payload;
  }

  async startWork(callId, serviceManId) {
    const call = await db.assist_calls.findByPk(callId);
    if (!call) throw new Error("not_found");
    if (call.assigned_service_man_id !== serviceManId) throw new Error("forbidden");
    if (!["assigned", "en_route"].includes(call.status)) {
      throw new Error("conflict");
    }
    call.status = "in_progress";
    call.work_started_at = new Date();
    await call.save();
    return this._notifyBoth(callId);
  }

  async finishWork(callId, serviceManId) {
    const call = await db.assist_calls.findByPk(callId);
    if (!call) throw new Error("not_found");
    if (call.assigned_service_man_id !== serviceManId) throw new Error("forbidden");
    if (call.status !== "in_progress") throw new Error("conflict");
    call.status = "completed";
    call.completed_at = new Date();
    await call.save();
    try {
      await createInvoiceForCompletedCall(call.id);
    } catch (e) {
      console.warn("assist invoice create failed:", e.message);
    }
    return this._notifyBoth(callId);
  }

  async submitDriverReview(callId, driverId, { rating, review }) {
    const call = await db.assist_calls.findByPk(callId);
    if (!call || call.driver_id !== driverId) throw new Error("not_found");
    if (call.status !== "completed") throw new Error("conflict");
    if (call.driver_rating != null) throw new Error("already_reviewed");
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw new Error("invalid_rating");
    }
    call.driver_rating = stars;
    call.driver_review = review ? String(review).slice(0, 2000) : null;
    call.reviewed_at = new Date();
    await call.save();
    return this._notifyBoth(callId);
  }

  async _notifyBoth(callId) {
    const payload = await this.serializeCall(callId);
    if (!payload) return null;
    assistWsHub.send("driver", payload.driver_id, {
      type: "call_update",
      call: payload,
    });
    if (payload.assigned_service_man_id) {
      assistWsHub.send("service_man", payload.assigned_service_man_id, {
        type: "call_update",
        call: payload,
      });
    }
    return payload;
  }

  async updateServiceManLocation(serviceManId, lat, lng, callId) {
    if (lat == null || lng == null) return;
    await db.service_men.update(
      { last_lat: lat, last_lng: lng },
      { where: { id: serviceManId } }
    );

    let call = null;
    if (callId) {
      call = await db.assist_calls.findByPk(callId);
    } else {
      call = await db.assist_calls.findOne({
        where: {
          assigned_service_man_id: serviceManId,
          status: ["assigned", "en_route", "in_progress"],
        },
        order: [["id", "DESC"]],
      });
    }
    if (!call) return;
    if (!["assigned", "en_route", "in_progress"].includes(call.status)) return;

    call.service_man_lat = lat;
    call.service_man_lng = lng;
    call.distance_km = haversineKm(
      call.driver_lat,
      call.driver_lng,
      lat,
      lng
    );
    call.eta_minutes = Math.max(1, Math.round(call.distance_km * 2.2));
    await call.save();

    const payload = {
      type: "location_update",
      call_id: call.id,
      service_man_id: serviceManId,
      lat,
      lng,
      distance_km: call.distance_km,
      eta_minutes: call.eta_minutes,
    };
    assistWsHub.send("driver", call.driver_id, payload);
  }

  _clearTimer(callId) {
    const t = this.timers.get(callId);
    if (t) clearTimeout(t);
    this.timers.delete(callId);
  }
}

const assistCallDispatcher = new AssistCallDispatcher();
module.exports = { assistCallDispatcher, haversineKm };
