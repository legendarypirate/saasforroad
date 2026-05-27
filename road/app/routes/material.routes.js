// routes/item.routes.js

module.exports = app => {
    const material = require("../controllers/material.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Item
    router.post("/", material.create);
  
    // Retrieve all Items
    router.get("/", material.findAll);
  
    // Retrieve a single Item with id
    router.get("/:id", material.findOne);
  
    // Update an Item with id
    router.put("/:id", material.update);
  
    // Delete an Item with id
    router.delete("/:id", material.delete);
  
    // Delete all Items
    router.delete("/", material.deleteAll);
    router.patch("/:id/accept", material.accept);

  // ✅ Decline Item
    router.patch("/:id/decline", material.decline);

    app.use('/api/material', router);
  };
  