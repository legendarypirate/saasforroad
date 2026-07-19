const db = require("../models");
const User = db.users;
const Role = db.roles;
const Op = db.Sequelize.Op;
const bcrypt = require('bcryptjs');
const multer = require("multer");
const { uploadImage } = require("../utils/cloudinary");
const saltRounds = 10;

const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/");
    cb(ok ? null : new Error("Зөвхөн зураг файл хүлээн авна"), ok);
  },
}).single("image");

const userInclude = [
  { model: Role, as: "roleRecord", attributes: ["id", "name", "mobile_access"] },
];

async function resolveRoleFields(body, tenantId) {
  const roleId = body.role_id || body.roleId || null;
  if (!roleId) {
    return { role_id: null, role: body.role || "user" };
  }
  const where = { id: roleId };
  if (tenantId) where.tenant_id = tenantId;
  const role = await Role.findOne({ where });
  if (!role) {
    throw new Error("Role not found");
  }
  return { role_id: role.id, role: role.name };
}

/** Normalize active flag — DB stores STRING "1" / "0". */
function normalizeIsActive(value, fallback = "1") {
  if (value === undefined || value === null || value === "") return fallback;
  if (value === true || value === 1 || value === "1" || value === "true") return "1";
  if (value === false || value === 0 || value === "0" || value === "false") return "0";
  return fallback;
}

function assertSameTenant(req, user) {
  if (req.tenant?.id && user.tenant_id && user.tenant_id !== req.tenant.id) {
    return false;
  }
  return true;
}

exports.create = async (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(400).send({
      success: false,
      message: "Username and password are required!",
    });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const roleFields = await resolveRoleFields(req.body, req.tenant?.id);

    const user = {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      tenant_id: req.tenant?.id || req.body.tenant_id || null,
      // Default active — admin list tabs filter on is_active; null looked "missing"
      is_active: normalizeIsActive(req.body.is_active, "1"),
      ...roleFields,
    };

    const data = await User.create(user);
    const full = await User.findByPk(data.id, { include: userInclude });
    res.status(201).send({ success: true, data: full });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while creating the User.",
    });
  }
};

exports.findAll = async (req, res) => {
  const username = req.query.username;
  const role_id = req.query.role_id;
  const includeBrigada = req.query.include_brigada === "1" || req.query.include_brigada === "true";
  let condition = {};

  if (username) {
    condition.username = { [Op.like]: `%${username}%` };
  }
  if (role_id) {
    condition.role_id = role_id;
  }
  if (req.tenant?.id) {
    condition.tenant_id = req.tenant.id;
  }

  // Brigade accounts are outside the company — hide from company user lists by default.
  if (!includeBrigada) {
    condition[Op.and] = [
      ...(condition[Op.and] || []),
      {
        [Op.or]: [
          { affiliation: { [Op.ne]: "brigada" } },
          { affiliation: null },
        ],
      },
      {
        [Op.or]: [
          { role: { [Op.ne]: "brigada" } },
          { role: null },
        ],
      },
    ];
  }

  try {
    // Heal legacy creates that left is_active null (showed as "missing" on active tab)
    if (req.tenant?.id) {
      await User.update(
        { is_active: "1" },
        {
          where: {
            tenant_id: req.tenant.id,
            [Op.or]: [
              { is_active: { [Op.is]: null } },
              { is_active: "" },
            ],
          },
        }
      );
    }

    const data = await User.findAll({
      where: condition,
      include: userInclude,
      order: [["id", "DESC"]],
    });

    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving users.",
    });
  }
};

exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await User.findByPk(id, { include: userInclude });
    if (!data) {
      return res.status(404).send({
        success: false,
        message: `Cannot find User with id=${id}.`,
      });
    }
    if (!assertSameTenant(req, data)) {
      return res.status(403).send({
        success: false,
        message: "User belongs to another tenant",
      });
    }
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: "Error retrieving User with id=" + id,
    });
  }
};

exports.uploadProfileImage = (req, res) => {
  const id = req.params.id;

  profileUpload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.code === "LIMIT_FILE_SIZE" ? "Файл 5MB-аас их байна" : "Файл upload алдаа" });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Файл upload алдаа" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "image файл шаардлагатай" });
    }

    try {
      const existingUser = await User.findByPk(id);
      if (!existingUser) {
        return res.status(404).json({ success: false, message: `User with id=${id} not found.` });
      }
      if (!assertSameTenant(req, existingUser)) {
        return res.status(403).json({
          success: false,
          message: "User belongs to another tenant",
        });
      }

      const result = await uploadImage(req.file.buffer, req.file.mimetype, {
        folder: "rd_zam/users",
        public_id: `user_${id}`,
        overwrite: true,
        invalidate: true,
      });

      await User.update({ profile_image: result.secure_url }, { where: { id } });
      const updatedUser = await User.findByPk(id, { include: userInclude });

      res.json({
        success: true,
        message: "Цээж зураг хадгалагдлаа",
        data: updatedUser,
        profile_image: result.secure_url,
      });
    } catch (uploadErr) {
      res.status(500).json({
        success: false,
        message: uploadErr.message || "Цээж зураг хадгалахад алдаа гарлаа",
      });
    }
  });
};

exports.update = async (req, res) => {
  const id = req.params.id;

  const updateData = {
    email: req.body.email !== undefined ? req.body.email : undefined,
    phone: req.body.phone !== undefined ? req.body.phone : undefined,
    end_date: req.body.end_date !== undefined ? req.body.end_date : undefined,
    is_active:
      req.body.is_active !== undefined
        ? normalizeIsActive(req.body.is_active)
        : undefined,
    gender: req.body.gender !== undefined ? req.body.gender : undefined,
    department_number: req.body.department_number !== undefined ? req.body.department_number : undefined,
    personal_case_number: req.body.personal_case_number !== undefined ? req.body.personal_case_number : undefined,
    project_number: req.body.project_number !== undefined ? req.body.project_number : undefined,
    position: req.body.position !== undefined ? req.body.position : undefined,
    register_number: req.body.register_number !== undefined ? req.body.register_number : undefined,
    sap_number: req.body.sap_number !== undefined ? req.body.sap_number : undefined,
    social_insurance_years: req.body.social_insurance_years !== undefined ? req.body.social_insurance_years : undefined,
    driver_license_class: req.body.driver_license_class !== undefined ? req.body.driver_license_class : undefined,
    driver_license_number: req.body.driver_license_number !== undefined ? req.body.driver_license_number : undefined,
    driver_license_expiry: req.body.driver_license_expiry !== undefined ? req.body.driver_license_expiry : undefined,
    affiliation: req.body.affiliation !== undefined ? req.body.affiliation : undefined,
    residential_address: req.body.residential_address !== undefined ? req.body.residential_address : undefined,
    id_card_home_address: req.body.id_card_home_address !== undefined ? req.body.id_card_home_address : undefined,
    bank_account_number: req.body.bank_account_number !== undefined ? req.body.bank_account_number : undefined,
    company_email: req.body.company_email !== undefined ? req.body.company_email : undefined,
    responsible_equipment: req.body.responsible_equipment !== undefined ? req.body.responsible_equipment : undefined,
    working_conditions: req.body.working_conditions !== undefined ? req.body.working_conditions : undefined,
    job_description: req.body.job_description !== undefined ? req.body.job_description : undefined,
    employment_start_date: req.body.employment_start_date !== undefined ? req.body.employment_start_date : undefined,
    employment_order_number: req.body.employment_order_number !== undefined ? req.body.employment_order_number : undefined,
    labor_contract_number: req.body.labor_contract_number !== undefined ? req.body.labor_contract_number : undefined,
    labor_contract_date: req.body.labor_contract_date !== undefined ? req.body.labor_contract_date : undefined,
    golden_order: req.body.golden_order !== undefined ? req.body.golden_order : undefined,
    probation_period: req.body.probation_period !== undefined ? req.body.probation_period : undefined,
    probation_end_date: req.body.probation_end_date !== undefined ? req.body.probation_end_date : undefined,
    permanent_order_number: req.body.permanent_order_number !== undefined ? req.body.permanent_order_number : undefined,
    permanent_date: req.body.permanent_date !== undefined ? req.body.permanent_date : undefined,
    work_schedule_type: req.body.work_schedule_type !== undefined ? req.body.work_schedule_type : undefined,
    cycle_start_date: req.body.cycle_start_date !== undefined ? req.body.cycle_start_date : undefined,
    cycle_work_days: req.body.cycle_work_days !== undefined ? req.body.cycle_work_days : undefined,
    cycle_rest_days: req.body.cycle_rest_days !== undefined ? req.body.cycle_rest_days : undefined,
    daily_work_hours: req.body.daily_work_hours !== undefined ? req.body.daily_work_hours : undefined,
    extended_cycle: req.body.extended_cycle !== undefined ? req.body.extended_cycle : undefined,
    salary: req.body.salary !== undefined ? req.body.salary : undefined,
  };

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  try {
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).send({
        message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
      });
    }

    if (req.body.role_id) {
      const roleFields = await resolveRoleFields(
        req.body,
        req.tenant?.id || existingUser.tenant_id
      );
      Object.assign(updateData, roleFields);
    }

    if (req.tenant?.id && existingUser.tenant_id && existingUser.tenant_id !== req.tenant.id) {
      return res.status(403).send({ message: "User belongs to another tenant" });
    }

    const [num] = await User.update(updateData, { where: { id } });

    if (num === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes were made.",
      });
    }

    const updatedUser = await User.findByPk(id, { include: userInclude });

    res.json({
      success: true,
      message: "User was updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Error updating User with id=${id}`,
      error: err.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  const id = req.params.id;
  const { password } = req.body;

  if (!password || String(password).trim().length < 4) {
    return res.status(400).json({
      success: false,
      message: "Нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой",
    });
  }

  try {
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User with id=${id} not found.`,
      });
    }
    if (!assertSameTenant(req, existingUser)) {
      return res.status(403).json({
        success: false,
        message: "User belongs to another tenant",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password).trim(), saltRounds);
    await User.update({ password: hashedPassword }, { where: { id } });

    res.json({
      success: true,
      message: "Нууц үг амжилттай солигдлоо",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Нууц үг солиход алдаа гарлаа",
    });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).send({
        success: false,
        message: `Cannot delete User with id=${id}.`,
      });
    }
    if (!assertSameTenant(req, existingUser)) {
      return res.status(403).send({
        success: false,
        message: "User belongs to another tenant",
      });
    }

    const num = await User.destroy({ where: { id } });
    if (num === 1) {
      res.send({ success: true, message: "User was deleted successfully!" });
    } else {
      res.status(400).send({
        success: false,
        message: `Cannot delete User with id=${id}.`,
      });
    }
  } catch (err) {
    res.status(500).send({
      success: false,
      message: "Could not delete User with id=" + id,
    });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    const where = {};
    if (req.tenant?.id) where.tenant_id = req.tenant.id;
    const nums = await User.destroy({ where, truncate: false });
    res.send({
      success: true,
      message: `${nums} User were deleted successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while removing all User.",
    });
  }
};

exports.findAllPublished = (req, res) => {
  User.findAll({ where: { published: true } })
    .then(data => res.send(data))
    .catch(err => {
      res.status(500).send({ message: err.message || "Some error occurred while retrieving User." });
    });
};
