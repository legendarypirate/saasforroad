// routes/item.routes.js

module.exports = app => {
    const stock = require("../controllers/stock.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Item
    router.post("/", stock.create);
  
    // Retrieve all Items
    router.get("/", stock.findAll);
  
    // Retrieve a single Item with id
    router.get("/:id", stock.findOne);
  
    // Update an Item with id
    router.put("/:id", stock.update);
  
    // Delete an Item with id
    router.delete("/:id", stock.delete);
  
    // Delete all Items
    router.delete("/", stock.deleteAll);
  
    app.use('/api/stock', router);
  };
  