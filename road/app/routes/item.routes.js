// routes/item.routes.js

module.exports = app => {
    const item = require("../controllers/item.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Item
    router.post("/", item.create);
  
    // Retrieve all Items
    router.get("/", item.findAll);
  
    // Retrieve a single Item with id
    router.get("/:id", item.findOne);
  
    // Update an Item with id
    router.put("/:id", item.update);
  
    // Delete an Item with id
    router.delete("/:id", item.delete);
  
    // Delete all Items
    router.delete("/", item.deleteAll);
    router.patch("/:id/accept", item.accept);

  // ✅ Decline Item
    router.patch("/:id/decline", item.decline);

    app.use('/api/item', router);
  };
  