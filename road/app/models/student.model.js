module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "student",
    {
      last_name: { type: Sequelize.STRING(120), allowNull: false },
      first_name: { type: Sequelize.STRING(120), allowNull: false },
      register_number: { type: Sequelize.STRING(20), allowNull: true },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      email: { type: Sequelize.STRING(120), allowNull: true },
      gender: { type: Sequelize.STRING(20), allowNull: true },
      photo: { type: Sequelize.STRING(512), allowNull: true },
      school: { type: Sequelize.STRING(255), allowNull: true },
      major: { type: Sequelize.STRING(255), allowNull: true },
      course_year: { type: Sequelize.INTEGER, allowNull: true },
      /** Голч дүн (GPA), e.g. 3.45 */
      gpa: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
      /** Skill tags as JSON array of strings */
      skills: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      student_card_no: { type: Sequelize.STRING(80), allowNull: true },
      /** internship | thesis | volunteer | other */
      internship_type: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: "internship",
      },
      /** applied | active | completed | cancelled */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "applied",
      },
      start_date: { type: Sequelize.DATEONLY, allowNull: true },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      project_id: { type: Sequelize.INTEGER, allowNull: true },
      mentor_user_id: { type: Sequelize.INTEGER, allowNull: true },
      department: { type: Sequelize.STRING(120), allowNull: true },
      address: { type: Sequelize.STRING(500), allowNull: true },
      emergency_contact: { type: Sequelize.STRING(120), allowNull: true },
      emergency_phone: { type: Sequelize.STRING(40), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "students" }
  );
};
