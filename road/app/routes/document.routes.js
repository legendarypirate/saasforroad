// routes/item.routes.js

module.exports = app => {
    const document = require("../controllers/document.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Item
    router.post("/", document.create);
  
    // Retrieve all Items
    router.get("/", document.findAll);
  
    // Retrieve a single Item with id
    router.get("/:id", document.findOne);
  
    // Update an Item with id
    router.put("/:id", document.update);
  
    // Delete an Item with id
    router.delete("/:id", document.delete);
  
    // Delete all Items
    router.delete("/", document.deleteAll);
  
    app.use('/api/document', router);
  };
  