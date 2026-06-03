const db = require("../models");
const User = db.users;
const Role = db.roles;
const Op = db.Sequelize.Op;
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const userInclude = [
  { model: Role, as: "roleRecord", attributes: ["id", "name", "mobile_access"] },
];

async function resolveRoleFields(body) {
  const roleId = body.role_id || body.roleId || null;
  if (!roleId) {
    return { role_id: null, role: body.role || "user" };
  }
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new Error("Role not found");
  }
  return { role_id: role.id, role: role.name };
}

exports.create = async (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(400).send({ message: "Username and password are required!" });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const roleFields = await resolveRoleFields(req.body);

    const user = {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      ...roleFields,
    };

    const data = await User.create(user);
    const full = await User.findByPk(data.id, { include: userInclude });
    res.send({ success: true, data: full });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the User.",
    });
  }
};

exports.findAll = async (req, res) => {
  const username = req.query.username;
  const role_id = req.query.role_id;
  let condition = {};

  if (username) {
    condition.username = { [Op.like]: `%${username}%` };
  }
  if (role_id) {
    condition.role_id = role_id;
  }

  try {
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

exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id, { include: userInclude })
    .then(data => {
      if (data) {
        res.send({ success: true, data });
      } else {
        res.status(404).send({ message: `Cannot find User with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving User with id=" + id });
    });
};

exports.update = async (req, res) => {
  const id = req.params.id;

  const updateData = {
    end_date: req.body.end_date !== undefined ? req.body.end_date : undefined,
    is_active: req.body.is_active !== undefined ? req.body.is_active : undefined,
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
  };

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  try {
    if (req.body.role_id) {
      const roleFields = await resolveRoleFields(req.body);
      Object.assign(updateData, roleFields);
    }

    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User with id=${id} not found.`,
      });
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

exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({ where: { id } })
    .then(num => {
      if (num == 1) {
        res.send({ message: "User was deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete User with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete User with id=" + id });
    });
};

exports.deleteAll = (req, res) => {
  User.destroy({ where: {}, truncate: false })
    .then(nums => {
      res.send({ message: `${nums} User were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Some error occurred while removing all User." });
    });
};

exports.findAllPublished = (req, res) => {
  User.findAll({ where: { published: true } })
    .then(data => res.send(data))
    .catch(err => {
      res.status(500).send({ message: err.message || "Some error occurred while retrieving User." });
    });
};
