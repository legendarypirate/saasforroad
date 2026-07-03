module.exports = (sequelize, Sequelize) => {
  const TenderDocument = sequelize.define("tender_document", {
    doc_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    engineer_name: {
      type: Sequelize.STRING,
    },
    original_filename: {
      type: Sequelize.STRING,
    },
    file_path: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    mime_type: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "uploaded",
    },
    extracted_data: {
      type: Sequelize.JSON,
      defaultValue: {},
    },
    extraction_error: {
      type: Sequelize.TEXT,
    },
    tender_package_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return TenderDocument;
};
