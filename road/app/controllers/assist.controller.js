const db = require("../models");
const { Op } = require("sequelize");
const { assistCallDispatcher } = require("../services/assist_call_dispatcher");
const { assistWsHub } = require("../services/assist_ws_hub");
const { lookupEquipmentByPlate } = require("../services/assist_invoice_service");
const multer = require("multer");
const { saveLocalUpload } = require("../utils/localUpload");

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Зөвхөн зураг файл"));
    }
    cb(null, true);
  },
});

exports.uploadImage = (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Зураг шаардлагатай" });
    }
    try {
      const saved = saveLocalUpload(req.file, "assist");
      res.json({
        success: true,
        data: {
          url: saved.secure_url,
          path: saved.secure_url,
        },
      });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
};

exports.listCategories = async (_req, res) => {
  const rows = await db.assist_service_categories.findAll({
    where: { is_active: true },
    include: [
      {
        model: db.assist_services,
        as: "services",
        where: { is_active: true },
        required: false,
      },
    ],
    order: [
      ["sort_order", "ASC"],
      [{ model: db.assist_services, as: "services" }, "sort_order", "ASC"],
    ],
  });
  res.json({ success: true, data: rows });
};

exports.listServices = async (_req, res) => {
  const rows = await db.assist_services.findAll({
    where: { is_active: true },
    include: [{ model: db.assist_service_categories, as: "category" }],
    order: [["sort_order", "ASC"]],
  });
  res.json({ success: true, data: rows });
};

// ---- Admin CRUD (tenant / platform tools) ----
exports.adminCreateCategory = async (req, res) => {
  try {
    const row = await db.assist_service_categories.create({
      name: req.body.name,
      name_mn: req.body.name_mn || req.body.name,
      icon: req.body.icon || null,
      image: req.body.image || null,
      sort_order: req.body.sort_order || 0,
      is_active: req.body.is_active !== false,
      tenant_id: req.tenant?.id || null,
    });
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.adminUpdateCategory = async (req, res) => {
  const row = await db.assist_service_categories.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
  Object.assign(row, {
    name: req.body.name ?? row.name,
    name_mn: req.body.name_mn ?? row.name_mn,
    icon: req.body.icon ?? row.icon,
    image: req.body.image ?? row.image,
    sort_order: req.body.sort_order ?? row.sort_order,
    is_active: req.body.is_active ?? row.is_active,
  });
  await row.save();
  res.json({ success: true, data: row });
};

exports.adminDeleteCategory = async (req, res) => {
  const n = await db.assist_service_categories.destroy({
    where: { id: req.params.id },
  });
  res.json({ success: true, deleted: n });
};

exports.adminCreateService = async (req, res) => {
  try {
    const row = await db.assist_services.create({
      category_id: req.body.category_id,
      name: req.body.name,
      name_mn: req.body.name_mn || req.body.name,
      description: req.body.description || null,
      icon: req.body.icon || null,
      image: req.body.image || null,
      sort_order: req.body.sort_order || 0,
      is_active: req.body.is_active !== false,
      tenant_id: req.tenant?.id || null,
    });
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.adminUpdateService = async (req, res) => {
  const row = await db.assist_services.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
  Object.assign(row, {
    category_id: req.body.category_id ?? row.category_id,
    name: req.body.name ?? row.name,
    name_mn: req.body.name_mn ?? row.name_mn,
    description: req.body.description ?? row.description,
    icon: req.body.icon ?? row.icon,
    image: req.body.image ?? row.image,
    sort_order: req.body.sort_order ?? row.sort_order,
    is_active: req.body.is_active ?? row.is_active,
  });
  await row.save();
  res.json({ success: true, data: row });
};

exports.adminDeleteService = async (req, res) => {
  const n = await db.assist_services.destroy({ where: { id: req.params.id } });
  res.json({ success: true, deleted: n });
};

exports.adminListAll = async (_req, res) => {
  const categories = await db.assist_service_categories.findAll({
    include: [{ model: db.assist_services, as: "services" }],
    order: [["sort_order", "ASC"]],
  });
  res.json({ success: true, data: categories });
};

// ---- Nearby available service men (map) ----
exports.driverNearbyServiceMen = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Math.min(
      100,
      Math.max(1, Number(req.query.radius_km) || 25)
    );
    const serviceId = req.query.service_id
      ? Number(req.query.service_id)
      : null;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: "lat, lng заавал",
      });
    }

    let idFilter = null;
    if (serviceId && !Number.isNaN(serviceId)) {
      const links = await db.service_man_services.findAll({
        where: { assist_service_id: serviceId },
        attributes: ["service_man_id"],
      });
      idFilter = links.map((l) => l.service_man_id);
      if (!idFilter.length) {
        return res.json({ success: true, data: [] });
      }
    }

    const where = {
      is_active: true,
      is_online: true,
      last_lat: { [Op.ne]: null },
      last_lng: { [Op.ne]: null },
      ...(idFilter ? { id: idFilter } : {}),
    };

    const men = await db.service_men.findAll({
      where,
      attributes: [
        "id",
        "full_name",
        "photo",
        "vehicle_label",
        "last_lat",
        "last_lng",
        "is_online",
      ],
      include: [
        {
          model: db.assist_services,
          as: "services",
          attributes: ["id", "name", "name_mn"],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    const data = men
      .map((m) => {
        const row = m.toJSON();
        const distanceKm = haversineKm(
          lat,
          lng,
          row.last_lat,
          row.last_lng
        );
        return {
          id: row.id,
          full_name: row.full_name,
          photo: row.photo,
          vehicle_label: row.vehicle_label,
          lat: row.last_lat,
          lng: row.last_lng,
          distance_km: Math.round(distanceKm * 10) / 10,
          socket_online: assistWsHub.isOnline("service_man", row.id),
          services: row.services || [],
        };
      })
      .filter((m) => m.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---- Calls ----
exports.driverLookupEquipmentByPlate = async (req, res) => {
  try {
    const plate = req.query.plate || req.body?.plate;
    if (!plate || !String(plate).trim()) {
      return res.status(400).json({
        success: false,
        message: "Улсын дугаар оруулна уу",
      });
    }
    const row = await lookupEquipmentByPlate(plate);
    if (!row) {
      return res.status(404).json({
        success: false,
        found: false,
        message:
          "Энэ техник системд бүртгэлгүй байна. Компанитайгаа холбогдоно уу.",
      });
    }
    res.json({
      success: true,
      found: true,
      equipment: {
        id: row.id,
        name: row.name,
        model: row.model,
        registration_number: row.registration_number,
        tenant_id: row.tenant_id,
        tenant_name:
          row.tenant_company_name || row.tenant_name || "Компани",
        tenant_slug: row.tenant_slug,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.driverCreateCall = async (req, res) => {
  try {
    const serviceId = Number(req.body.assist_service_id || req.body.service_id);
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    const equipmentId = Number(req.body.equipment_id);
    // Tenant mobile callers: always use JWT tenant_id (ignore client spoofing).
    const tenantId = Number(
      req.driverAuth?.tenant_id || req.body.tenant_id
    );
    if (
      !serviceId ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      !equipmentId ||
      !tenantId
    ) {
      return res.status(400).json({
        success: false,
        message: "service_id, equipment_id, tenant_id, lat, lng заавал",
      });
    }
    const call = await assistCallDispatcher.createCall({
      driverId: req.driverAuth.driver_id,
      serviceId,
      note: req.body.note,
      lat,
      lng,
      equipmentId,
      tenantId,
      plateNumber: req.body.plate_number || req.body.plate,
    });
    res.status(201).json({ success: true, call });
  } catch (e) {
    const msg = e.message;
    const code =
      msg === "equipment_required" || msg === "equipment_not_found" ? 400 : 500;
    res.status(code).json({
      success: false,
      message:
        msg === "equipment_not_found"
          ? "Энэ техник системд бүртгэлгүй байна. Компанитайгаа холбогдоно уу."
          : msg,
    });
  }
};

/** Tenant app: plate lookup scoped to the caller's company. */
exports.tenantLookupEquipmentByPlate = async (req, res) => {
  try {
    const plate = req.query.plate || req.body?.plate;
    const tenantId = Number(req.driverAuth?.tenant_id);
    if (!plate || !String(plate).trim()) {
      return res.status(400).json({
        success: false,
        message: "Улсын дугаар оруулна уу",
      });
    }
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Компани олдсонгүй",
      });
    }
    const {
      lookupEquipmentByPlateForTenant,
    } = require("../services/assist_invoice_service");
    const row = await lookupEquipmentByPlateForTenant(plate, tenantId);
    if (!row) {
      return res.status(404).json({
        success: false,
        found: false,
        message: "Энэ техник танай компанид бүртгэлгүй байна.",
      });
    }
    res.json({
      success: true,
      found: true,
      equipment: {
        id: row.id,
        name: row.name,
        model: row.model,
        registration_number: row.registration_number,
        tenant_id: row.tenant_id,
        tenant_name:
          row.tenant_company_name || row.tenant_name || "Компани",
        tenant_slug: row.tenant_slug,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/** Bootstrap linked road_driver + WS token for tenant mobile. */
exports.tenantAssistSession = async (req, res) => {
  try {
    const { publicDriver } = require("./assist_driver_auth.controller");
    const {
      signLinkedDriverToken,
    } = require("../middleware/assistTenantDriver");
    const driver = req.assistDriver;
    res.json({
      success: true,
      driver_id: driver.id,
      driver_token: signLinkedDriverToken(driver),
      tenant_id: req.driverAuth.tenant_id,
      user: publicDriver(driver),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.driverCancelCall = async (req, res) => {
  try {
    const call = await assistCallDispatcher.cancel(
      Number(req.params.id),
      req.driverAuth.driver_id
    );
    res.json({ success: true, call });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.driverHistory = async (req, res) => {
  const rows = await db.assist_calls.findAll({
    where: { driver_id: req.driverAuth.driver_id },
    include: [
      { model: db.assist_services, as: "service" },
      {
        model: db.service_men,
        as: "assignedServiceMan",
        attributes: { exclude: ["password"] },
      },
    ],
    order: [["id", "DESC"]],
    limit: 50,
  });
  res.json({ success: true, data: rows });
};

exports.serviceManHistory = async (req, res) => {
  const id = req.serviceManAuth.service_man_id;
  const { Op } = require("sequelize");
  const rows = await db.assist_calls.findAll({
    where: {
      [Op.or]: [
        { assigned_service_man_id: id },
        { current_service_man_id: id },
      ],
    },
    include: [
      { model: db.assist_services, as: "service" },
      {
        model: db.road_drivers,
        as: "driver",
        attributes: { exclude: ["password"] },
      },
    ],
    order: [["id", "DESC"]],
    limit: 50,
  });
  res.json({ success: true, data: rows });
};

exports.serviceManAccept = async (req, res) => {
  try {
    const call = await assistCallDispatcher.accept(
      Number(req.params.id),
      req.serviceManAuth.service_man_id
    );
    res.json({ success: true, call });
  } catch (e) {
    res.status(409).json({ success: false, message: e.message });
  }
};

exports.serviceManDecline = async (req, res) => {
  try {
    await assistCallDispatcher.declineOrTimeout(
      Number(req.params.id),
      req.serviceManAuth.service_man_id,
      "declined"
    );
    res.json({ success: true });
  } catch (e) {
    res.status(409).json({ success: false, message: e.message });
  }
};

exports.serviceManStartWork = async (req, res) => {
  try {
    const call = await assistCallDispatcher.startWork(
      Number(req.params.id),
      req.serviceManAuth.service_man_id
    );
    res.json({ success: true, call });
  } catch (e) {
    res.status(409).json({ success: false, message: e.message });
  }
};

exports.serviceManFinishWork = async (req, res) => {
  try {
    const call = await assistCallDispatcher.finishWork(
      Number(req.params.id),
      req.serviceManAuth.service_man_id
    );
    res.json({ success: true, call });
  } catch (e) {
    res.status(409).json({ success: false, message: e.message });
  }
};

exports.driverSubmitReview = async (req, res) => {
  try {
    const call = await assistCallDispatcher.submitDriverReview(
      Number(req.params.id),
      req.driverAuth.driver_id,
      { rating: req.body.rating, review: req.body.review }
    );
    res.json({ success: true, call });
  } catch (e) {
    const code = e.message === "not_found" ? 404 : 409;
    res.status(code).json({ success: false, message: e.message });
  }
};

exports.getCall = async (req, res) => {
  const call = await assistCallDispatcher.serializeCall(Number(req.params.id));
  if (!call) return res.status(404).json({ success: false, message: "Олдсонгүй" });
  res.json({ success: true, call });
};

/** Tenant admin: list roadside-assist invoices for current tenant */
exports.listInvoices = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.q) {
      const q = `%${String(req.query.q).trim()}%`;
      where[Op.or] = [
        { invoice_number: { [Op.iLike]: q } },
        { plate_number: { [Op.iLike]: q } },
        { equipment_name: { [Op.iLike]: q } },
        { service_name: { [Op.iLike]: q } },
        { driver_name: { [Op.iLike]: q } },
      ];
    }
    const rows = await db.assist_invoices.findAll({
      where,
      include: [
        {
          model: db.assist_calls,
          as: "call",
          attributes: [
            "id",
            "request_code",
            "status",
            "completed_at",
            "driver_rating",
          ],
        },
      ],
      order: [["id", "DESC"]],
      limit: Math.min(Number(req.query.limit) || 200, 500),
    });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/** Tenant admin: mark invoice paid */
exports.markInvoicePaid = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await db.assist_invoices.findByPk(id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    if (row.status === "paid") {
      return res.json({ success: true, data: row });
    }
    if (row.status === "cancelled") {
      return res.status(409).json({
        success: false,
        message: "Цуцлагдсан нэхэмжлэхийг төлсөн болгох боломжгүй",
      });
    }
    row.status = "paid";
    row.paid_at = new Date();
    row.paid_by_user_id = req.user?.id || req.userId || null;
    if (req.body?.notes) row.notes = String(req.body.notes).slice(0, 2000);
    await row.save();
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
