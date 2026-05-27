// routes/item.routes.js

module.exports = app => {
    const notification = require("../controllers/notification.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Item
    router.post("/", notification.create);
  
    // Retrieve all Items
    router.get("/", notification.findAll);
  
    // Retrieve a single Item with id
    router.get("/:id", notification.findOne);
  
    // Update an Item with id
    router.put("/:id", notification.update);
  
    // Delete an Item with id
    router.delete("/:id", notification.delete);
  
  

    app.use('/api/notification', router);
  };
  