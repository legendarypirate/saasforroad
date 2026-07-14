module.exports = (sequelize, Sequelize) => {
    const Banner = sequelize.define("banner", {
      text: {
        type: Sequelize.STRING
      },
      link: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      image: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
        tenant_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
  });
  
    return Banner;
  };
  