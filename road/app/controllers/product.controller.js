const db = require("../models");
const Product = db.products;
const ProductImage = db.productImages;
const Op = db.Sequelize.Op;
const multer = require("multer");
const { memoryUpload } = require("../utils/multerMemory");
const { uploadMulterFile } = require("../utils/cloudinary");

const upload = memoryUpload({
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype?.startsWith("image/");
    cb(ok ? null : new Error("Зөвхөн зураг"), ok);
  },
}).array("images", 5);

// Create and Save a new Product
exports.create = (req, res) => {
  // Handle file upload
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      // A multer error occurred
      return res.status(500).json({ success: false, message: "Error uploading files." });
    } else if (err) {
      // An unknown error occurred
      return res.status(500).json({ success: false, message: "Unknown error." });
    }
    
    // Validate request
    if (!req.body.name ||  !req.body.stock || !req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "Name, catid, stock, and at least one image are required!" });
    }

    try {
      // Create a product
      const product = {
        name: req.body.name,
        catid: req.body.catid,
        stock: req.body.stock,
      };

      // Save product in the database
      const savedProduct = await Product.create(product);

      // Handle product images
      const productImages = [];
      for (const file of req.files) {
        const result = await uploadMulterFile(file, "products");
        const productImage = {
          productId: savedProduct.id,
          image: result.secure_url,
        };
        // Save product image in the database
        const savedProductImage = await ProductImage.create(productImage);
        productImages.push(savedProductImage);
      }

      res.status(201).json({ success: true, product: savedProduct, images: productImages });
    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({ success: false, message: "Some error occurred while creating the product." });
    }
  });
};


// Retrieve all Categories from the database.
exports.findAll = async (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  try {
      console.log("ss");    
    const data = await Product.findAll({ where: condition });
    console.log(data);

    res.send({
      success: true,
      data: data
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving Categories."
    });
  }
};



// Find a single Categories with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  category.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find category with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving category with id=" + id
      });
    });
};

// Update a Categories by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  category.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "category was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update category with id=${id}. Maybe category was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating category with id=" + id
      });
    });
};

// Delete a category with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  category.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "category was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Categories with id=${id}. Maybe category was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete category with id=" + id
      });
    });
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
  category.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} category were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all category."
      });
    });
};

// find all published Categories
exports.findAllPublished = (req, res) => {
  category.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving category."
      });
    });
};
