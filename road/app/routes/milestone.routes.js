// routes/item.routes.js

module.exports = app => {
    const milestone = require("../controllers/milestone.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Item
    router.post("/", milestone.create);
  
    // Retrieve all Items
    router.get("/", milestone.findAll);
  
    // Retrieve a single Item with id
    router.get("/:id", milestone.findOne);
  
    // Update an Item with id
    router.put("/:id", milestone.update);
  
    // Delete an Item with id
    router.delete("/:id", milestone.delete);
  
    // Delete all Items
    router.delete("/", milestone.deleteAll);
  
    app.use('/api/milestone', router);
  };
  