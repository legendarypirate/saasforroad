module.exports = (sequelize, Sequelize) => {
  const TenderPackage = sequelize.define("tender_package", {
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    tender_number: {
      type: Sequelize.STRING,
    },
    project_name: {
      type: Sequelize.STRING,
    },
    client_name: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "draft",
    },
    notes: {
      type: Sequelize.TEXT,
    },
    summary: {
      type: Sequelize.JSON,
      defaultValue: {},
    },
  });

  return TenderPackage;
};
