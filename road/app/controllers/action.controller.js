const db = require("../models");
const Action = db.actions;
const User = db.users;
const Op = db.Sequelize.Op;
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, "app/assets/documents");
  },
  filename: function (_, file, cb) {
    cb(null, `action-doc-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage }).single("file");

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

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await Action.destroy({ where: { id } });
    if (num === 1) {
      return res.send({ success: true, message: "Арга хэмжээ устгагдлаа" });
    }
    return res.status(404).send({ success: false, message: "Арга хэмжээ олдсонгүй" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  const id = req.params.id;
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).send({ success: false, message: "File upload error" });
    }
    if (err) {
      return res.status(500).send({ success: false, message: "Unexpected upload error" });
    }
    if (!req.file) {
      return res.status(400).send({ success: false, message: "file шаардлагатай" });
    }

    try {
      const row = await Action.findByPk(id);
      if (!row) {
        return res.status(404).send({ success: false, message: "Арга хэмжээ олдсонгүй" });
      }

      await row.update({ document_url: req.file.filename });
      return res.send({ success: true, data: row, message: "Файл амжилттай хадгалагдлаа" });
    } catch (error) {
      return res.status(500).send({ success: false, message: error.message });
    }
  });
};
