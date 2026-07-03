module.exports = (sequelize, Sequelize) => {
  const OrgNode = sequelize.define("org_node", {
    parent_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    node_type: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "department",
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
    },
    position_title: {
      type: Sequelize.STRING,
    },
    sort_order: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
  });

  return OrgNode;
};
