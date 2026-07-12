module.exports = (sequelize, Sequelize) => {
  const Permission = sequelize.define("permission", {
    /** Nav namespace, e.g. finance | system | gps (legacy column `module` kept in sync). */
    index: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    /** Legacy alias of index — kept for older queries/seeds. */
    module: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    /**
     * Hierarchy level:
     * - module → show/hide module folder (key = module_key)
     * - menu   → open page (key = menu_key)
     * - action → button / API (key = full action key)
     */
    level: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "action",
      validate: {
        isIn: [["module", "menu", "action"]],
      },
    },
    /** Always set, e.g. finance:module */
    module_key: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    /** Set for menu/action rows, e.g. finance.accounts:read. Null for module-level. */
    menu_key: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    /** Action type: module | read | create | update | delete | approve | write | … */
    action: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    /** Unique runtime check value (what login returns / frontend can()). */
    key: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    /** Optional UI label */
    label: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  return Permission;
};
