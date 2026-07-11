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
db.equipment_categories = require("./equipment_category.model.js")(sequelize, Sequelize);
db.project_equipment_links = require("./project_equipment_link.model.js")(sequelize, Sequelize);
db.equipment_oil_changes = require("./equipment_oil_change.model.js")(sequelize, Sequelize);
db.equipment_service_logs = require("./equipment_service_log.model.js")(sequelize, Sequelize);
db.equipment_documents = require("./equipment_document.model.js")(sequelize, Sequelize);
db.equipment_monthly_finances = require("./equipment_monthly_finance.model.js")(sequelize, Sequelize);
db.accidents = require("./accident.model.js")(sequelize, Sequelize);
db.daily_reports = require("./daily_report.model.js")(sequelize, Sequelize);
db.hse_daily_instructions = require("./hse_daily_instruction.model.js")(sequelize, Sequelize);
db.hse_daily_instruction_acks = require("./hse_daily_instruction_ack.model.js")(sequelize, Sequelize);
db.hse_toolbox_meetings = require("./hse_toolbox_meeting.model.js")(sequelize, Sequelize);
db.hse_toolbox_attendees = require("./hse_toolbox_attendee.model.js")(sequelize, Sequelize);
db.hse_observations = require("./hse_observation.model.js")(sequelize, Sequelize);
db.hse_near_misses = require("./hse_near_miss.model.js")(sequelize, Sequelize);
db.hse_incidents = require("./hse_incident.model.js")(sequelize, Sequelize);
db.hse_risk_assessments = require("./hse_risk_assessment.model.js")(sequelize, Sequelize);
db.hse_permits = require("./hse_permit.model.js")(sequelize, Sequelize);
db.hse_inspection_templates = require("./hse_inspection_template.model.js")(sequelize, Sequelize);
db.hse_inspections = require("./hse_inspection.model.js")(sequelize, Sequelize);
db.hse_inspection_items = require("./hse_inspection_item.model.js")(sequelize, Sequelize);
db.hse_ppe_items = require("./hse_ppe_item.model.js")(sequelize, Sequelize);
db.hse_ppe_assignments = require("./hse_ppe_assignment.model.js")(sequelize, Sequelize);
db.hse_trainings = require("./hse_training.model.js")(sequelize, Sequelize);
db.hse_training_records = require("./hse_training_record.model.js")(sequelize, Sequelize);
db.hse_equipment_inspections = require("./hse_equipment_inspection.model.js")(sequelize, Sequelize);
db.hse_environmental_records = require("./hse_environmental_record.model.js")(sequelize, Sequelize);
db.hse_capas = require("./hse_capa.model.js")(sequelize, Sequelize);
db.hse_documents = require("./hse_document.model.js")(sequelize, Sequelize);

db.fin_accounts = require("./fin_account.model.js")(sequelize, Sequelize);
db.fin_contracts = require("./fin_contract.model.js")(sequelize, Sequelize);
db.fin_invoices = require("./fin_invoice.model.js")(sequelize, Sequelize);
db.fin_invoice_lines = require("./fin_invoice_line.model.js")(sequelize, Sequelize);
db.fin_payments = require("./fin_payment.model.js")(sequelize, Sequelize);
db.fin_budgets = require("./fin_budget.model.js")(sequelize, Sequelize);
db.fin_expenses = require("./fin_expense.model.js")(sequelize, Sequelize);
db.fin_vat_entries = require("./fin_vat_entry.model.js")(sequelize, Sequelize);

db.plant_sites = require("./plant_site.model.js")(sequelize, Sequelize);
db.plant_products = require("./plant_product.model.js")(sequelize, Sequelize);
db.plant_materials = require("./plant_material.model.js")(sequelize, Sequelize);
db.plant_material_stocks = require("./plant_material_stock.model.js")(sequelize, Sequelize);
db.plant_material_movements = require("./plant_material_movement.model.js")(sequelize, Sequelize);
db.plant_batches = require("./plant_batch.model.js")(sequelize, Sequelize);
db.plant_sales = require("./plant_sale.model.js")(sequelize, Sequelize);
db.plant_expenses = require("./plant_expense.model.js")(sequelize, Sequelize);
db.plant_daily_reports = require("./plant_daily_report.model.js")(sequelize, Sequelize);

db.uni_items = require("./uni_item.model.js")(sequelize, Sequelize);
db.uni_stock_movements = require("./uni_stock_movement.model.js")(sequelize, Sequelize);
db.uni_issues = require("./uni_issue.model.js")(sequelize, Sequelize);
db.uni_issue_lines = require("./uni_issue_line.model.js")(sequelize, Sequelize);
db.uni_returns = require("./uni_return.model.js")(sequelize, Sequelize);
db.uni_requests = require("./uni_request.model.js")(sequelize, Sequelize);

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
db.students = require("./student.model.js")(sequelize, Sequelize);
db.brigades = require("./brigade.model.js")(sequelize, Sequelize);
db.brigade_members = require("./brigade_member.model.js")(sequelize, Sequelize);
db.brigade_equipment = require("./brigade_equipment.model.js")(sequelize, Sequelize);
db.hire_requests = require("./hire_request.model.js")(sequelize, Sequelize);
db.hire_request_history = require("./hire_request_history.model.js")(sequelize, Sequelize);
db.brigade_reviews = require("./brigade_review.model.js")(sequelize, Sequelize);
db.brigade_documents = require("./brigade_document.model.js")(sequelize, Sequelize);
db.brigade_timeline_events = require("./brigade_timeline_event.model.js")(sequelize, Sequelize);
db.brigade_progress_reports = require("./brigade_progress_report.model.js")(sequelize, Sequelize);
db.brigade_notifications = require("./brigade_notification.model.js")(sequelize, Sequelize);
db.documents = require("./document.model.js")(sequelize, Sequelize);
db.document_folders = require("./document_folder.model.js")(sequelize, Sequelize);
db.warehouses = require("./warehouse.model.js")(sequelize, Sequelize);
db.stocks = require("./stock.model.js")(sequelize, Sequelize);
db.transactions = require("./transaction.model.js")(sequelize, Sequelize);
db.suppliers = require("./supplier.model.js")(sequelize, Sequelize);
db.homepage_settings = require("./homepage.model.js")(sequelize, Sequelize);
db.tender_packages = require("./tender_package.model.js")(sequelize, Sequelize);
db.tender_documents = require("./tender_document.model.js")(sequelize, Sequelize);
db.equipment_rentals = require("./equipment_rental.model.js")(sequelize, Sequelize);
db.equipment_rental_payments = require("./equipment_rental_payment.model.js")(sequelize, Sequelize);
db.office_locations = require("./office_location.model.js")(sequelize, Sequelize);
db.org_nodes = require("./org_node.model.js")(sequelize, Sequelize);
db.salary_adjustments = require("./salary_adjustment.model.js")(sequelize, Sequelize);
db.salary_month_settings = require("./salary_month_setting.model.js")(sequelize, Sequelize);
db.leave_requests = require("./leave_request.model.js")(sequelize, Sequelize);
db.user_devices = require("./user_device.model.js")(sequelize, Sequelize);
db.inv_stock_movements = require("./inv_stock_movement.model.js")(sequelize, Sequelize);
db.inv_documents = require("./inv_document.model.js")(sequelize, Sequelize);
db.inv_document_lines = require("./inv_document_line.model.js")(sequelize, Sequelize);
db.inv_material_suppliers = require("./inv_material_supplier.model.js")(sequelize, Sequelize);

db.tender_packages.hasMany(db.tender_documents, {
  foreignKey: "tender_package_id",
  as: "documents",
  onDelete: "CASCADE",
});
db.tender_documents.belongsTo(db.tender_packages, {
  foreignKey: "tender_package_id",
});

// DMS folders + documents
db.document_folders.hasMany(db.document_folders, {
  foreignKey: "parent_id",
  as: "children",
});
db.document_folders.belongsTo(db.document_folders, {
  foreignKey: "parent_id",
  as: "parent",
});
db.documents.belongsTo(db.document_folders, {
  foreignKey: "parent_id",
  as: "folder",
});
db.document_folders.hasMany(db.documents, {
  foreignKey: "parent_id",
  as: "files",
});
db.documents.belongsTo(db.projects, {
  foreignKey: "project_id",
  as: "project",
});
db.projects.hasMany(db.documents, {
  foreignKey: "project_id",
  as: "dmsDocuments",
});
db.documents.belongsTo(db.users, {
  foreignKey: "created_by",
  as: "creator",
});
db.documents.belongsTo(db.users, {
  foreignKey: "updated_by",
  as: "updater",
});

db.notifications.belongsTo(db.projects, {
  foreignKey: "project_id",
  as: "project",
});
db.projects.hasMany(db.notifications, {
  foreignKey: "project_id",
  as: "notifications",
});
db.notifications.belongsTo(db.users, {
  foreignKey: "user_id",
  as: "author",
});

db.students.belongsTo(db.projects, {
  foreignKey: "project_id",
  as: "project",
});
db.projects.hasMany(db.students, {
  foreignKey: "project_id",
  as: "students",
});
db.students.belongsTo(db.users, {
  foreignKey: "mentor_user_id",
  as: "mentor",
});
db.users.hasMany(db.students, {
  foreignKey: "mentor_user_id",
  as: "mentees",
});

// Brigada module
db.brigades.belongsTo(db.users, { foreignKey: "leader_user_id", as: "leader" });
db.users.hasMany(db.brigades, { foreignKey: "leader_user_id", as: "ledBrigades" });

db.brigades.hasMany(db.brigade_members, {
  foreignKey: "brigade_id",
  as: "members",
  onDelete: "CASCADE",
});
db.brigade_members.belongsTo(db.brigades, { foreignKey: "brigade_id", as: "brigade" });
db.brigade_members.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.brigade_members, { foreignKey: "user_id", as: "brigadeMemberships" });

db.brigades.hasMany(db.brigade_equipment, {
  foreignKey: "brigade_id",
  as: "equipmentLinks",
  onDelete: "CASCADE",
});
db.brigade_equipment.belongsTo(db.brigades, { foreignKey: "brigade_id", as: "brigade" });
db.brigade_equipment.belongsTo(db.equipments, { foreignKey: "equipment_id", as: "equipment" });
db.equipments.hasMany(db.brigade_equipment, { foreignKey: "equipment_id", as: "brigadeLinks" });

db.brigades.hasMany(db.hire_requests, {
  foreignKey: "brigade_id",
  as: "hireRequests",
  onDelete: "CASCADE",
});
db.hire_requests.belongsTo(db.brigades, { foreignKey: "brigade_id", as: "brigade" });
db.hire_requests.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.projects.hasMany(db.hire_requests, { foreignKey: "project_id", as: "hireRequests" });
db.hire_requests.belongsTo(db.users, { foreignKey: "requested_by", as: "requester" });

db.hire_requests.hasMany(db.hire_request_history, {
  foreignKey: "hire_request_id",
  as: "history",
  onDelete: "CASCADE",
});
db.hire_request_history.belongsTo(db.hire_requests, {
  foreignKey: "hire_request_id",
  as: "hireRequest",
});
db.hire_request_history.belongsTo(db.users, { foreignKey: "changed_by", as: "changer" });

db.brigades.hasMany(db.brigade_reviews, {
  foreignKey: "brigade_id",
  as: "reviews",
  onDelete: "CASCADE",
});
db.brigade_reviews.belongsTo(db.brigades, { foreignKey: "brigade_id", as: "brigade" });
db.brigade_reviews.belongsTo(db.hire_requests, {
  foreignKey: "hire_request_id",
  as: "hireRequest",
});
db.brigade_reviews.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.brigade_reviews.belongsTo(db.users, { foreignKey: "reviewer_user_id", as: "reviewer" });

db.brigades.hasMany(db.brigade_documents, {
  foreignKey: "brigade_id",
  as: "documents",
  onDelete: "CASCADE",
});
db.brigade_documents.belongsTo(db.brigades, { foreignKey: "brigade_id", as: "brigade" });
db.brigade_documents.belongsTo(db.users, { foreignKey: "uploaded_by", as: "uploader" });

db.brigades.hasMany(db.brigade_timeline_events, {
  foreignKey: "brigade_id",
  as: "timeline",
  onDelete: "CASCADE",
});
db.brigade_timeline_events.belongsTo(db.brigades, { foreignKey: "brigade_id", as: "brigade" });
db.brigade_timeline_events.belongsTo(db.users, { foreignKey: "actor_user_id", as: "actor" });

db.brigades.hasMany(db.brigade_progress_reports, {
  foreignKey: "brigade_id",
  as: "progressReports",
  onDelete: "CASCADE",
});
db.brigade_progress_reports.belongsTo(db.brigades, { foreignKey: "brigade_id", as: "brigade" });
db.brigade_progress_reports.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.brigade_progress_reports.belongsTo(db.hire_requests, {
  foreignKey: "hire_request_id",
  as: "hireRequest",
});
db.brigade_progress_reports.belongsTo(db.users, { foreignKey: "created_by", as: "author" });

db.brigade_notifications.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.brigade_notifications.belongsTo(db.brigades, { foreignKey: "brigade_id", as: "brigade" });
db.brigades.hasMany(db.brigade_notifications, {
  foreignKey: "brigade_id",
  as: "brigadeNotifications",
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

db.materials.belongsTo(db.angilals, {
  foreignKey: "category_id",
  as: "category",
});
db.angilals.hasMany(db.materials, { foreignKey: "category_id" });
db.materials.belongsTo(db.warehouses, {
  foreignKey: "default_warehouse_id",
  as: "defaultWarehouse",
});
db.materials.belongsTo(db.suppliers, {
  foreignKey: "default_supplier_id",
  as: "defaultSupplier",
});

db.stocks.belongsTo(db.materials, {
  foreignKey: "item_id",
  as: "material"
});

// Stock belongs to Warehouse
db.stocks.belongsTo(db.warehouses, {
  foreignKey: "warehouse_id",
  as: "warehouse"
});

db.inv_documents.hasMany(db.inv_document_lines, {
  foreignKey: "document_id",
  as: "lines",
  onDelete: "CASCADE",
});
db.inv_document_lines.belongsTo(db.inv_documents, {
  foreignKey: "document_id",
  as: "document",
});
db.inv_document_lines.belongsTo(db.materials, {
  foreignKey: "material_id",
  as: "material",
});
db.inv_documents.belongsTo(db.warehouses, {
  foreignKey: "warehouse_id",
  as: "warehouse",
});
db.inv_documents.belongsTo(db.warehouses, {
  foreignKey: "to_warehouse_id",
  as: "toWarehouse",
});
db.inv_documents.belongsTo(db.projects, {
  foreignKey: "project_id",
  as: "project",
});
db.inv_documents.belongsTo(db.projects, {
  foreignKey: "to_project_id",
  as: "toProject",
});
db.inv_documents.belongsTo(db.suppliers, {
  foreignKey: "supplier_id",
  as: "supplier",
});
db.inv_stock_movements.belongsTo(db.materials, {
  foreignKey: "material_id",
  as: "material",
});
db.inv_stock_movements.belongsTo(db.warehouses, {
  foreignKey: "warehouse_id",
  as: "warehouse",
});
db.inv_stock_movements.belongsTo(db.warehouses, {
  foreignKey: "to_warehouse_id",
  as: "toWarehouse",
});
db.inv_stock_movements.belongsTo(db.projects, {
  foreignKey: "project_id",
  as: "project",
});
db.inv_stock_movements.belongsTo(db.inv_documents, {
  foreignKey: "document_id",
  as: "document",
});
db.inv_material_suppliers.belongsTo(db.materials, {
  foreignKey: "material_id",
  as: "material",
});
db.inv_material_suppliers.belongsTo(db.suppliers, {
  foreignKey: "supplier_id",
  as: "supplier",
});
db.materials.hasMany(db.inv_material_suppliers, {
  foreignKey: "material_id",
  as: "suppliers",
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

db.daily_reports.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.projects.hasMany(db.daily_reports, { foreignKey: "project_id" });
db.daily_reports.belongsTo(db.users, { foreignKey: "created_by", as: "author" });
db.users.hasMany(db.daily_reports, { foreignKey: "created_by" });

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

db.equipment_service_logs.belongsTo(db.equipments, { foreignKey: "equipment_id", onDelete: "CASCADE" });
db.equipments.hasMany(db.equipment_service_logs, {
  foreignKey: "equipment_id",
  as: "serviceLogs",
});

db.equipment_documents.belongsTo(db.equipments, { foreignKey: "equipment_id", onDelete: "CASCADE" });
db.equipments.hasMany(db.equipment_documents, {
  foreignKey: "equipment_id",
  as: "documents",
});

db.equipments.belongsTo(db.equipment_categories, {
  foreignKey: "equipment_category_id",
  as: "equipmentCategory",
});
db.equipment_categories.hasMany(db.equipments, {
  foreignKey: "equipment_category_id",
  as: "equipments",
});

db.equipment_monthly_finances.belongsTo(db.equipments, { foreignKey: "equipment_id", onDelete: "CASCADE" });
db.equipments.hasMany(db.equipment_monthly_finances, {
  foreignKey: "equipment_id",
  as: "monthlyFinances",
});

db.equipments.belongsTo(db.users, {
  foreignKey: "responsible_user_id",
  as: "responsibleUser",
});
db.equipments.belongsTo(db.users, {
  foreignKey: "operator_user_id",
  as: "operatorUser",
});

db.equipment_rentals.belongsTo(db.equipments, { foreignKey: "equipment_id", as: "equipment" });
db.equipments.hasMany(db.equipment_rentals, { foreignKey: "equipment_id", as: "rentals" });

db.equipment_rental_payments.belongsTo(db.equipment_rentals, {
  foreignKey: "rental_id",
  as: "rental",
  onDelete: "CASCADE",
});
db.equipment_rentals.hasMany(db.equipment_rental_payments, {
  foreignKey: "rental_id",
  as: "payments",
  onDelete: "CASCADE",
});

db.tasks.belongsTo(db.milestones, { foreignKey: "milestone_id" });
db.milestones.hasMany(db.tasks, { foreignKey: "milestone_id" });

db.org_nodes.belongsTo(db.org_nodes, { foreignKey: "parent_id", as: "parent" });
db.org_nodes.hasMany(db.org_nodes, { foreignKey: "parent_id", as: "children" });
db.org_nodes.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.org_nodes.belongsTo(db.org_nodes, { foreignKey: "reports_to_id", as: "supervisor" });
db.org_nodes.hasMany(db.org_nodes, { foreignKey: "reports_to_id", as: "directReports" });
db.users.hasOne(db.org_nodes, { foreignKey: "user_id", as: "orgNode" });

db.salary_adjustments.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.salary_adjustments, { foreignKey: "user_id", as: "salaryAdjustments" });

db.leave_requests.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.leave_requests, { foreignKey: "user_id", as: "leaveRequests" });
db.leave_requests.belongsTo(db.users, { foreignKey: "reviewed_by", as: "reviewer" });

db.user_devices.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.users.hasMany(db.user_devices, { foreignKey: "user_id", as: "devices" });
db.user_devices.belongsTo(db.users, { foreignKey: "approved_by", as: "approver" });

// HSE associations
db.hse_daily_instructions.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_daily_instructions.belongsTo(db.users, { foreignKey: "created_by", as: "creator" });
db.hse_daily_instruction_acks.belongsTo(db.hse_daily_instructions, { foreignKey: "instruction_id", as: "instruction" });
db.hse_daily_instruction_acks.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.hse_daily_instruction_acks.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });

db.hse_toolbox_meetings.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_toolbox_meetings.belongsTo(db.users, { foreignKey: "supervisor_id", as: "supervisor" });
db.hse_toolbox_attendees.belongsTo(db.hse_toolbox_meetings, { foreignKey: "meeting_id", as: "meeting" });
db.hse_toolbox_attendees.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.hse_toolbox_meetings.hasMany(db.hse_toolbox_attendees, { foreignKey: "meeting_id", as: "attendees" });

db.hse_observations.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_observations.belongsTo(db.users, { foreignKey: "reported_by", as: "reporter" });
db.hse_observations.belongsTo(db.users, { foreignKey: "responsible_user_id", as: "responsible" });

db.hse_near_misses.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_near_misses.belongsTo(db.users, { foreignKey: "reported_by", as: "reporter" });

db.hse_incidents.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_incidents.belongsTo(db.users, { foreignKey: "reported_by", as: "reporter" });

db.hse_risk_assessments.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_risk_assessments.belongsTo(db.users, { foreignKey: "responsible_user_id", as: "responsible" });

db.hse_permits.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_permits.belongsTo(db.users, { foreignKey: "requested_by", as: "requester" });

db.hse_inspections.belongsTo(db.hse_inspection_templates, { foreignKey: "template_id", as: "template" });
db.hse_inspections.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_inspections.belongsTo(db.equipments, { foreignKey: "equipment_id", as: "equipment" });
db.hse_inspection_items.belongsTo(db.hse_inspections, { foreignKey: "inspection_id", as: "inspection" });
db.hse_inspections.hasMany(db.hse_inspection_items, { foreignKey: "inspection_id", as: "items" });

db.hse_ppe_assignments.belongsTo(db.hse_ppe_items, { foreignKey: "ppe_item_id", as: "ppeItem" });
db.hse_ppe_assignments.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.hse_ppe_assignments.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });

db.hse_training_records.belongsTo(db.hse_trainings, { foreignKey: "training_id", as: "training" });
db.hse_training_records.belongsTo(db.users, { foreignKey: "user_id", as: "user" });

db.hse_equipment_inspections.belongsTo(db.equipments, { foreignKey: "equipment_id", as: "equipment" });
db.hse_equipment_inspections.belongsTo(db.users, { foreignKey: "operator_id", as: "operator" });
db.hse_equipment_inspections.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });

db.hse_environmental_records.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.hse_capas.belongsTo(db.users, { foreignKey: "responsible_user_id", as: "responsible" });

// Finance
db.fin_contracts.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.fin_contracts.belongsTo(db.suppliers, { foreignKey: "supplier_id", as: "supplier" });

db.fin_invoices.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.fin_invoices.belongsTo(db.suppliers, { foreignKey: "supplier_id", as: "supplier" });
db.fin_invoices.belongsTo(db.fin_contracts, { foreignKey: "contract_id", as: "contract" });
db.fin_invoices.belongsTo(db.users, { foreignKey: "created_by", as: "creator" });
db.fin_invoices.hasMany(db.fin_invoice_lines, { foreignKey: "invoice_id", as: "lines" });
db.fin_invoice_lines.belongsTo(db.fin_invoices, { foreignKey: "invoice_id", as: "invoice" });

db.fin_payments.belongsTo(db.fin_accounts, { foreignKey: "account_id", as: "account" });
db.fin_payments.belongsTo(db.fin_invoices, { foreignKey: "invoice_id", as: "invoice" });
db.fin_payments.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.fin_payments.belongsTo(db.suppliers, { foreignKey: "supplier_id", as: "supplier" });
db.fin_payments.belongsTo(db.users, { foreignKey: "created_by", as: "creator" });

db.fin_budgets.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });

db.fin_expenses.belongsTo(db.fin_accounts, { foreignKey: "account_id", as: "account" });
db.fin_expenses.belongsTo(db.users, { foreignKey: "user_id", as: "user" });
db.fin_expenses.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.fin_expenses.belongsTo(db.users, { foreignKey: "created_by", as: "creator" });
db.fin_expenses.belongsTo(db.users, { foreignKey: "approved_by", as: "approver" });

db.fin_vat_entries.belongsTo(db.fin_invoices, { foreignKey: "invoice_id", as: "invoice" });
db.fin_vat_entries.belongsTo(db.fin_expenses, { foreignKey: "expense_id", as: "expense" });

// Uniform / workwear supply
db.uni_stock_movements.belongsTo(db.uni_items, { foreignKey: "item_id", as: "item" });
db.uni_stock_movements.belongsTo(db.users, { foreignKey: "created_by", as: "creator" });

db.uni_issues.belongsTo(db.users, { foreignKey: "user_id", as: "receiver" });
db.uni_issues.belongsTo(db.users, { foreignKey: "issued_by", as: "issuer" });
db.uni_issues.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.uni_issues.hasMany(db.uni_issue_lines, { foreignKey: "issue_id", as: "lines" });

db.uni_issue_lines.belongsTo(db.uni_issues, { foreignKey: "issue_id", as: "issue" });
db.uni_issue_lines.belongsTo(db.uni_items, { foreignKey: "item_id", as: "item" });
db.uni_issue_lines.hasMany(db.uni_returns, { foreignKey: "issue_line_id", as: "returns" });

db.uni_returns.belongsTo(db.uni_issue_lines, { foreignKey: "issue_line_id", as: "issueLine" });
db.uni_returns.belongsTo(db.users, { foreignKey: "received_by", as: "receiver" });

db.uni_requests.belongsTo(db.users, { foreignKey: "user_id", as: "requester" });
db.uni_requests.belongsTo(db.users, { foreignKey: "approved_by", as: "approver" });
db.uni_requests.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.uni_requests.belongsTo(db.uni_items, { foreignKey: "item_id", as: "item" });

// Plant / factory (Үйлдвэр)
db.plant_products.belongsTo(db.plant_sites, { foreignKey: "plant_id", as: "plant" });
db.plant_sites.hasMany(db.plant_products, { foreignKey: "plant_id", as: "products" });

db.plant_material_stocks.belongsTo(db.plant_sites, { foreignKey: "plant_id", as: "plant" });
db.plant_material_stocks.belongsTo(db.plant_materials, { foreignKey: "material_id", as: "material" });
db.plant_sites.hasMany(db.plant_material_stocks, { foreignKey: "plant_id", as: "stocks" });
db.plant_materials.hasMany(db.plant_material_stocks, { foreignKey: "material_id", as: "stocks" });

db.plant_material_movements.belongsTo(db.plant_sites, { foreignKey: "plant_id", as: "plant" });
db.plant_material_movements.belongsTo(db.plant_materials, { foreignKey: "material_id", as: "material" });

db.plant_batches.belongsTo(db.plant_sites, { foreignKey: "plant_id", as: "plant" });
db.plant_batches.belongsTo(db.plant_products, { foreignKey: "product_id", as: "product" });
db.plant_sites.hasMany(db.plant_batches, { foreignKey: "plant_id", as: "batches" });

db.plant_sales.belongsTo(db.plant_sites, { foreignKey: "plant_id", as: "plant" });
db.plant_sales.belongsTo(db.plant_products, { foreignKey: "product_id", as: "product" });
db.plant_sales.belongsTo(db.plant_batches, { foreignKey: "batch_id", as: "batch" });
db.plant_sales.belongsTo(db.projects, { foreignKey: "project_id", as: "project" });
db.plant_sites.hasMany(db.plant_sales, { foreignKey: "plant_id", as: "sales" });

db.plant_expenses.belongsTo(db.plant_sites, { foreignKey: "plant_id", as: "plant" });
db.plant_sites.hasMany(db.plant_expenses, { foreignKey: "plant_id", as: "expenses" });

db.plant_daily_reports.belongsTo(db.plant_sites, { foreignKey: "plant_id", as: "plant" });
db.plant_sites.hasMany(db.plant_daily_reports, { foreignKey: "plant_id", as: "dailyReports" });

// Export the db object for easy access throughout the app
module.exports = db;
