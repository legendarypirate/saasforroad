const Sequelize = require("sequelize");
const pg = require("pg");
const dbConfig = require("../config/db.config.js");

const sequelizeOptions = {
  dialect: "postgres",
  dialectModule: pg,
  dialectOptions: dbConfig.dialectOptions || {},
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
};

const sequelize = dbConfig.useUrl
  ? new Sequelize(dbConfig.url, sequelizeOptions)
  : new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
      ...sequelizeOptions,
      host: dbConfig.HOST,
    });

const db = {};

// Assign the Sequelize instance to the db object
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Register all the models
db.roles = require("./role.model.js")(sequelize, Sequelize);
db.permissions = require("./permission.model.js")(sequelize, Sequelize);
db.role_permissions = require("./role_permission.model.js")(sequelize, Sequelize);
db.attendances = require("./attendance.model.js")(sequelize, Sequelize);
db.actions = require("./action.model.js")(sequelize, Sequelize);
db.feedbacks = require("./feedback.model.js")(sequelize, Sequelize);
db.emergency_contacts = require("./emergency_contact.model.js")(sequelize, Sequelize);
db.family_members = require("./family_member.model.js")(sequelize, Sequelize);
db.educations = require("./education.model.js")(sequelize, Sequelize);
db.career_changes = require("./career_change.model.js")(sequelize, Sequelize);
db.contract_terminations = require("./contract_termination.model.js")(sequelize, Sequelize);
db.user_awards = require("./user_award.model.js")(sequelize, Sequelize);
db.schedule_exceptions = require("./schedule_exception.model.js")(sequelize, Sequelize);
db.infos = require("./info.model.js")(sequelize, Sequelize);
db.Categories = require("./category.model.js")(sequelize, Sequelize);
db.users = require("./user.model.js")(sequelize, Sequelize);
db.words = require("./word.model.js")(sequelize, Sequelize);
db.tasks = require("./task.model.js")(sequelize, Sequelize);
db.milestones = require("./milestone.model.js")(sequelize, Sequelize);
db.project_phases = require("./project_phase.model.js")(sequelize, Sequelize);
db.equipments = require("./equipment.model.js")(sequelize, Sequelize);
db.project_equipment_links = require("./project_equipment_link.model.js")(sequelize, Sequelize);
db.equipment_oil_changes = require("./equipment_oil_change.model.js")(sequelize, Sequelize);
db.accidents = require("./accident.model.js")(sequelize, Sequelize);
db.angilals = require("./angilal.model.js")(sequelize, Sequelize);
db.materials = require("./material.model.js")(sequelize, Sequelize);

db.products = require("./product.model.js")(sequelize, Sequelize);
db.banners = require("./banner.model.js")(sequelize, Sequelize);
db.productImages = require("./productImage.model.js")(sequelize, Sequelize);
db.ages = require("./age.model.js")(sequelize, Sequelize);
db.doctors = require("./doctor.model.js")(sequelize, Sequelize);
db.profiles = require("./profile.model.js")(sequelize, Sequelize);
db.privacies = require("./privacy.model.js")(sequelize, Sequelize);
db.questions = require("./question.model.js")(sequelize, Sequelize);
db.projects = require("./project.model.js")(sequelize, Sequelize);
db.invites = require("./invite.model.js")(sequelize, Sequelize);
db.items = require("./item.model.js")(sequelize, Sequelize);
db.notifications = require("./notification.model.js")(sequelize, Sequelize);
db.documents = require("./document.model.js")(sequelize, Sequelize);
db.warehouses = require("./warehouse.model.js")(sequelize, Sequelize);
db.stocks = require("./stock.model.js")(sequelize, Sequelize);
db.transactions = require("./transaction.model.js")(sequelize, Sequelize);
db.suppliers = require("./supplier.model.js")(sequelize, Sequelize);
db.homepage_settings = require("./homepage.model.js")(sequelize, Sequelize);
db.tender_packages = require("./tender_package.model.js")(sequelize, Sequelize);
db.tender_documents = require("./tender_document.model.js")(sequelize, Sequelize);

db.tender_packages.hasMany(db.tender_documents, {
  foreignKey: "tender_package_id",
  as: "documents",
  onDelete: "CASCADE",
});
db.tender_documents.belongsTo(db.tender_packages, {
  foreignKey: "tender_package_id",
});

db.district = require("./district.model.js")(sequelize, Sequelize);
db.horooBoundary = require("./horooBoundary.model.js")(sequelize, Sequelize);

db.transactions.belongsTo(db.materials, {
  foreignKey: "item_id",
  as: "material"  // alias when including
});

// transaction belongsTo project
db.transactions.belongsTo(db.projects, {
  foreignKey: "project_id",
  as: "project"
});

// transaction belongsTo warehouse
db.transactions.belongsTo(db.warehouses, {
  foreignKey: "warehouse_id",
  as: "warehouse"
});

// Optional: reverse relations (if you need)
db.materials.hasMany(db.transactions, { foreignKey: "item_id" });
db.projects.hasMany(db.transactions, { foreignKey: "project_id" });
db.warehouses.hasMany(db.transactions, { foreignKey: "warehouse_id" });

db.stocks.belongsTo(db.materials, {
  foreignKey: "item_id",
  as: "material"
});

// Stock belongs to Warehouse
db.stocks.belongsTo(db.warehouses, {
  foreignKey: "warehouse_id",
  as: "warehouse"
});

// index.js эсвэл db.js дотор
db.district.hasMany(db.horooBoundary, { foreignKey: "district_id" });
db.horooBoundary.belongsTo(db.district, { foreignKey: "district_id" });


// (Optional: You can add reverse relations if needed)
db.materials.hasMany(db.stocks, { foreignKey: "item_id" });
db.warehouses.hasMany(db.stocks, { foreignKey: "warehouse_id" });
// Define the relationships here

db.users.belongsTo(db.roles, { foreignKey: "role_id", as: "roleRecord" });
db.roles.hasMany(db.users, { foreignKey: "role_id" });

db.roles.belongsToMany(db.permissions, {
  through: db.role_permissions,
  foreignKey: "roleId",
  otherKey: "permissionId",
  as: "permissions",
});
db.permissions.belongsToMany(db.roles, {
  through: db.role_permissions,
  foreignKey: "permissionId",
  otherKey: "roleId",
});

db.attendances.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.attendances, { foreignKey: "user_id" });

db.actions.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.actions, { foreignKey: "user_id" });

db.feedbacks.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.feedbacks, { foreignKey: "user_id" });

db.emergency_contacts.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.emergency_contacts, { foreignKey: "user_id" });

db.family_members.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.family_members, { foreignKey: "user_id" });

db.educations.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.educations, { foreignKey: "user_id" });

db.career_changes.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.career_changes, { foreignKey: "user_id" });

db.contract_terminations.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.contract_terminations, { foreignKey: "user_id" });

db.user_awards.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.user_awards, { foreignKey: "user_id" });

db.schedule_exceptions.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.schedule_exceptions, { foreignKey: "user_id" });

db.accidents.belongsTo(db.users, { foreignKey: "user_id" });
db.users.hasMany(db.accidents, { foreignKey: "user_id" });

db.items.belongsTo(db.users, { foreignKey: "user_id" });
db.users.hasMany(db.items, { foreignKey: "user_id" });
// 1. Categories and Infos (One-to-Many)
db.infos.belongsTo(db.Categories, { foreignKey: "cat_id" });
db.Categories.hasMany(db.infos, { foreignKey: "cat_id" });

// 2. Doctors and Infos (One-to-Many)
db.infos.belongsTo(db.doctors, { foreignKey: "doctor_id", as: "doctorInfo" }); // Fix naming collision
db.doctors.hasMany(db.infos, { foreignKey: "doctor_id", as: "infos" });

// 3. Users <-> Projects through Invites (Many-to-Many)
db.users.belongsToMany(db.projects, {
  through: db.invites,
  foreignKey: "userId",
});
db.projects.belongsToMany(db.users, {
  through: db.invites,
  foreignKey: "projectId",
});

// 4. Direct associations to invites (one-to-many relationship)
db.invites.belongsTo(db.users, { foreignKey: "userId", onDelete: "CASCADE" });
db.invites.belongsTo(db.projects, { foreignKey: "projectId", onDelete: "CASCADE" });
db.users.hasMany(db.invites, { foreignKey: "userId" });
db.projects.hasMany(db.invites, { foreignKey: "projectId" });

db.tasks.belongsTo(db.projects, { foreignKey: "project_id" });
db.projects.hasMany(db.tasks, { foreignKey: "project_id" });

db.project_phases.belongsTo(db.projects, { foreignKey: "project_id" });
db.projects.hasMany(db.project_phases, { foreignKey: "project_id", as: "phases" });

db.project_equipment_links.belongsTo(db.projects, { foreignKey: "project_id" });
db.project_equipment_links.belongsTo(db.equipments, { foreignKey: "equipment_id", as: "equipment" });
db.projects.hasMany(db.project_equipment_links, { foreignKey: "project_id" });
db.equipments.hasMany(db.project_equipment_links, { foreignKey: "equipment_id" });

db.projects.belongsToMany(db.equipments, {
  through: db.project_equipment_links,
  foreignKey: "project_id",
  otherKey: "equipment_id",
  as: "assignedEquipment",
});
db.equipments.belongsToMany(db.projects, {
  through: db.project_equipment_links,
  foreignKey: "equipment_id",
  otherKey: "project_id",
  as: "projects",
});

db.equipment_oil_changes.belongsTo(db.equipments, { foreignKey: "equipment_id", onDelete: "CASCADE" });
db.equipments.hasMany(db.equipment_oil_changes, {
  foreignKey: "equipment_id",
  as: "oilChanges",
});

db.tasks.belongsTo(db.milestones, { foreignKey: "milestone_id" });
db.milestones.hasMany(db.tasks, { foreignKey: "milestone_id" });

// Export the db object for easy access throughout the app
module.exports = db;
