module.exports = (sequelize, Sequelize) => {
  const District = sequelize.define("district", {
    name: {
      type: Sequelize.STRING(50),
      unique: true,
      allowNull: false
    }
  });

  return District;
};
