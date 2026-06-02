const db = require("../models");
const Action = db.actions;
const User = db.users;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  const { title, description, user_id, status, priority } = req.body;
  if (!title) {
    return res.status(400).send({ success: false, message: "title шаардлагатай" });
  }

  try {
    const data = await Action.create({ title, description, user_id, status, priority });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { username, phone, email, user_id } = req.query;

  const userWhere = {};
  if (user_id) userWhere.id = user_id;
  if (username) userWhere.username = { [Op.iLike]: `%${username}%` };
  if (phone) userWhere.phone = { [Op.iLike]: `%${phone}%` };
  if (email) userWhere.email = { [Op.iLike]: `%${email}%` };

  try {
    const data = await Action.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "phone", "email"],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
