module.exports = app => {
    const supplier = require("../controllers/supplier.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.post("/", supplier.create);
  
    // Retrieve all Tutorials
    router.get("/", supplier.findAll);

    // Retrieve a single Tutorial with id
    router.get("/:id", supplier.findOne);
  
    // Update a Tutorial with id
    router.patch("/:id", supplier.update);
  
    // Delete a Tutorial with id
    router.delete("/:id", supplier.delete);
  
    // Delete all Tutorials
    router.delete("/", supplier.deleteAll);
  
    app.use('/api/supplier', router);
  };
  