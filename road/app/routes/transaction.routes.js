module.exports = app => {
    const transaction = require("../controllers/transaction.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.post("/", transaction.create);
  
    // Retrieve all Tutorials
    router.get("/", transaction.findAll);
  

    // Retrieve all published Tutorials
  
    // Retrieve a single Tutorial with id
   
    // Update a Tutorial with id
    router.patch("/:id", transaction.update);
  
    // Delete a Tutorial with id
    router.delete("/:id", transaction.delete);
  
    // Delete all Tutorials
    router.delete("/", transaction.deleteAll);
    router.get("/:id", transaction.findOne);

    app.use('/api/transaction', router);
  };
  