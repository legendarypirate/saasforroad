module.exports = (sequelize, Sequelize) => {
  const EquipmentInsurance = sequelize.define(
    "equipment_insurance",
    {
      equipment_id: { type: Sequelize.INTEGER, allowNull: false },
      /** Даатгалын байгууллага */
      company: { type: Sequelize.STRING, allowNull: true },
      /** Хүчинтэй | Хугацаа дууссан | ... */
      status: { type: Sequelize.STRING, allowNull: true },
      contract_no: { type: Sequelize.STRING, allowNull: true },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      start_date: { type: Sequelize.DATEONLY, allowNull: true },
      expiry: { type: Sequelize.DATEONLY, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    { tableName: "equipment_insurances" }
  );

  return EquipmentInsurance;
};
