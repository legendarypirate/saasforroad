const db = require("../models");
const Permission = db.permissions;

exports.findAll = async (req, res) => {
  try {
    const data = await Permission.findAll({
      order: [
        ["index", "ASC"],
        ["module", "ASC"],
        ["sort_order", "ASC"],
        ["level", "ASC"],
        ["action", "ASC"],
      ],
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
