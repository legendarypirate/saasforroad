module.exports = (sequelize, Sequelize) => {
  const Supplier = sequelize.define("supplier", {
    name: {
      type: Sequelize.STRING
    },
    phone: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    address: {
      type: Sequelize.STRING
    },
    productTypes: {
      type: Sequelize.JSON,  // ✅ Use Sequelize here
      allowNull: true,
    },
    register: {
      type: Sequelize.STRING
    }
  });

  return Supplier;
};
