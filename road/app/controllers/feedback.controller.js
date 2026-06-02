const db = require("../models");
const Feedback = db.feedbacks;
const User = db.users;

exports.createPublic = async (req, res) => {
  const { message, is_anonymous, user_id, username, phone, email } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).send({ success: false, message: "Саналын текст шаардлагатай" });
  }

  try {
    const anonymous = is_anonymous !== false;
    const data = await Feedback.create({
      user_id: anonymous ? null : user_id || null,
      username: anonymous ? null : username || null,
      phone: anonymous ? null : phone || null,
      email: anonymous ? null : email || null,
      message,
      is_anonymous: anonymous,
      status: "new",
    });
    res.send({ success: true, data, message: "Санал хүсэлт амжилттай илгээгдлээ" });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const data = await Feedback.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "phone", "email"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
