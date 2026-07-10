const db = require("../models");
const Info = db.infos;
const Op = db.Sequelize.Op;
const multer = require("multer");
const Category = db.Categories;
const Doctor = db.doctors;
const { memoryUpload } = require("../utils/multerMemory");
const { uploadMulterFile } = require("../utils/cloudinary");

const upload = memoryUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (_req, file, cb) {
    if (file.mimetype.startsWith("image/") || file.mimetype === "audio/mpeg") {
      cb(null, true);
    } else {
      cb(new Error("Only image and MP3 files are allowed!"), false);
    }
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);

exports.create = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ success: false, message: "Error uploading file." });
    } else if (err) {
      return res.status(500).json({ success: false, message: err.message || "Unknown error." });
    }

    if (!req.body.title || !req.files?.image) {
      return res.status(400).json({ success: false, message: "Title and image are required!" });
    }

    try {
      const imageResult = await uploadMulterFile(req.files.image[0], "info");
      let audioUrl = null;
      if (req.files.audio?.[0]) {
        const audioResult = await uploadMulterFile(req.files.audio[0], "info-audio");
        audioUrl = audioResult.secure_url;
      }

      const info = {
        title: req.body.title,
        doctor: req.body.doctor,
        gender: req.body.gender,
        category: req.body.category,
        age: req.body.age,
        richtext: req.body.richtext,
        image: imageResult.secure_url,
        audio: audioUrl,
      };

      const data = await Info.create(info);
      res.json({ success: true, data });
    } catch (createErr) {
      res.status(500).json({ success: false, message: createErr.message || "Some error occurred while creating the entry." });
    }
  });
};

// Retrieve all Infos from the database

exports.findAll = async (req, res) => {
  const title = req.query.title;
  let condition = { isactive: 1 }; // Default condition

  if (title) {
    condition.title = { [Op.like]: `%${title}%` }; // Add title condition if provided
  }

  try {
    const data = await Info.findAll({
      where: condition,
      order: [['createdAt', 'DESC']], // Order by createdAt column in descending order
    });

    res.json({ success: true, data: data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while retrieving data."
    });
  }
};

exports.title = async (req, res) => {
  const categoryName = req.params.categoryName; // Get categoryName from route parameter
  const title = req.query.title; // Optionally filter by title
  let condition = { 
    isactive: 1, 
    category: categoryName  // Filter by category name
  };

  if (title) {
    condition.title = { [Op.like]: `%${title}%` }; // Add title condition if provided
  }

  try {
    const data = await Info.findAll({ where: condition });
    res.json({ success: true, data: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Some error occurred while retrieving data." });
  }
};


// Find a single Info entry by ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Fetching info with ID: ${id}`);

    const info = await Info.findByPk(id, {
      include: {
        model: Doctor,
        as: "doctorInfo", // Ensure alias matches your association in `index.js`
        attributes: ["id", "name", "image", "prof"], // Ensure "profession" is correct
      },
    });

    if (!info) {
      console.log(`Info with ID ${id} not found`);
      return res.status(404).json({ message: "Info not found" });
    }

    console.log("Fetched Info:", JSON.stringify(info, null, 2));
    res.json(info);
  } catch (error) {
    console.error("Error fetching info:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getInfosByCategory = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ["id", "name"],
      include: [
        {
          model: Info,
          as: "infos", // Alias used in the association
          attributes: ["id", "title", "richtext", "image","createdAt"],
          limit: 3, // Limit the number of Info items
          order: [["createdAt", "DESC"]], // Order by createdAt in descending order
        },
      ],
      order: [["id", "ASC"]], // Order categories by id
    });

    console.log("Categories and infos:", categories);

    const response = categories.map(category => ({
      category: category.name,
      category_id: category.id,
      infos: category.infos.map(info => ({
        id: info.id,
        title: info.title,
        image: info.image,
        richtext: info.richtext,
        createdAt: info.createdAt,
      })),
    }));

    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error retrieving data", error });
  }
};


exports.getInfosByCatId = async (req, res) => {
  try {
    const cat_id = req.params.cat_id;
    const infos = await Info.findAll({ where: { cat_id } });

    if (infos.length === 0) {
      return res.status(404).json({ message: "No infos found for this category" });
    }

    res.json(infos);
  } catch (error) {
    console.error("Error fetching infos by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// Update an Info entry by ID
exports.update = (req, res) => {
  const id = req.params.id;

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ success: false, message: "Error uploading file." });
    } else if (err) {
      return res.status(500).json({ success: false, message: err.message || "Unknown error." });
    }

    if (Object.keys(req.body).length === 0 && !req.files?.image && !req.body.title) {
      return res.status(400).json({
        success: false,
        message: "Request body cannot be empty and image/title is required.",
      });
    }

    try {
      const existingEntry = await Info.findByPk(id);
      if (!existingEntry) {
        return res.status(404).json({ success: false, message: "Entry not found." });
      }

      let imageUrl = existingEntry.image;
      let audioUrl = existingEntry.audio;

      if (req.files?.image?.[0]) {
        const imageResult = await uploadMulterFile(req.files.image[0], "info");
        imageUrl = imageResult.secure_url;
      }
      if (req.files?.audio?.[0]) {
        const audioResult = await uploadMulterFile(req.files.audio[0], "info-audio");
        audioUrl = audioResult.secure_url;
      }

      const updateData = {
        title: req.body.title || existingEntry.title,
        doctor: req.body.doctor || existingEntry.doctor,
        gender: req.body.gender || existingEntry.gender,
        category: req.body.category || existingEntry.category,
        age: req.body.age || existingEntry.age,
        isactive: req.body.isactive || existingEntry.isactive,
        richtext: req.body.richtext || existingEntry.richtext,
        image: imageUrl,
        audio: audioUrl,
      };

      const num = await Info.update(updateData, { where: { id } });
      if (num != 1) {
        throw new Error("No changes were made or entry not found.");
      }

      const updatedEntry = await Info.findByPk(id);
      res.json({
        success: true,
        message: "Entry was updated successfully.",
        data: updatedEntry,
      });
    } catch (updateErr) {
      res.status(500).json({
        success: false,
        message: "Error updating entry with id=" + id,
        error: updateErr.message,
      });
    }
  });
};

// Delete an Info entry by ID
exports.delete = (req, res) => {
  const id = req.params.id;

  Info.destroy({ where: { id: id } })
    .then((num) => {
      if (num == 1) {
        res.json({ success: true, message: "Entry was deleted successfully!" });
      } else {
        res.status(404).json({ success: false, message: `Cannot delete entry with id=${id}. Maybe it was not found!` });
      }
    })
    .catch((err) => {
      res.status(500).json({ success: false, message: "Could not delete entry with id=" + id });
    });
};

// Delete all Info entries from the database
exports.deleteAll = (req, res) => {
  Info.destroy({ where: {}, truncate: false })
    .then((nums) => {
      res.json({ success: true, message: `${nums} entries were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).json({ success: false, message: err.message || "Some error occurred while removing all entries." });
    });
};

// Find all published entries
exports.findAllPublished = (req, res) => {
  Info.findAll({ where: { published: true } })
    .then((data) => {
      res.json({ success: true, data: data });
    })
    .catch((err) => {
      res.status(500).json({ success: false, message: err.message || "Some error occurred while retrieving data." });
    });
};
