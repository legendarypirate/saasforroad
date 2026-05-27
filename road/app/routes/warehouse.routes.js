// routes/item.routes.js

module.exports = app => {
    const warehouse = require("../controllers/warehouse.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Item
    router.post("/", warehouse.create);
  
    // Retrieve all Items
    router.get("/", warehouse.findAll);
  
    // Retrieve a single Item with id
    router.get("/:id", warehouse.findOne);
  
    // Update an Item with id
    router.put("/:id", warehouse.update);
  
    // Delete an Item with id
    router.delete("/:id", warehouse.delete);
  
    // Delete all Items
    router.delete("/", warehouse.deleteAll);
  
    app.use('/api/warehouse', router);
  };
  