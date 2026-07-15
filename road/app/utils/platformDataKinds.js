const PLATFORM_DATA_KINDS = [
  { id: "brigada", label: "Бригад", labelEn: "Brigade" },
  { id: "job-seeker", label: "Ажил горилогч", labelEn: "Job seeker" },
  { id: "factory", label: "Үйлдвэр", labelEn: "Factory" },
  { id: "student", label: "Оюутан", labelEn: "Student" },
  { id: "laboratory", label: "Лаборатори", labelEn: "Laboratory" },
  { id: "technique", label: "Техник", labelEn: "Technique" },
  { id: "road-sign", label: "Замын тэмдэг", labelEn: "Road sign" },
];

const KIND_IDS = new Set(PLATFORM_DATA_KINDS.map((k) => k.id));

function isValidKind(kind) {
  return KIND_IDS.has(String(kind || "").trim());
}

function serializeEntry(row) {
  const j = typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: j.id,
    kind: j.kind,
    name: j.name,
    contact_name: j.contact_name,
    phone: j.phone,
    email: j.email,
    province: j.province,
    location: j.location,
    description: j.description,
    meta: j.meta && typeof j.meta === "object" ? j.meta : {},
    image: j.image,
    status: j.status,
    is_active: j.is_active,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

module.exports = {
  PLATFORM_DATA_KINDS,
  isValidKind,
  serializeEntry,
};
