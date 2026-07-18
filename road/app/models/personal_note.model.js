module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "personal_note",
    {
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      title: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: "Гарчиггүй",
      },
      content: { type: Sequelize.TEXT, allowNull: true },
      parent_id: { type: Sequelize.INTEGER, allowNull: true },
      icon: { type: Sequelize.STRING(40), allowNull: true },
      is_favorite: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    { tableName: "personal_notes" }
  );
};
