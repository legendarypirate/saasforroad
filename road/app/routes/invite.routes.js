module.exports = app => {
    const invite = require("../controllers/invite.controller.js");
    
    var router = require("express").Router();
    
    // Create a new Invite
    router.post("/", invite.create);
    
    // Retrieve all Invites
    router.get("/", invite.findAll);
    
    // Retrieve a single Invite with id
    router.get("/:id", invite.findOne);
    
    // Update an Invite with id
    router.patch("/:id", invite.update);
    
    // Delete a project member (by userId + projectId)
    router.delete("/member", invite.removeMember);

    // Delete an Invite with id
    router.delete("/:id", invite.delete);
    
    // Delete all Invites
    router.delete("/", invite.deleteAll);
  
    // Register the routes with /api/invite
    app.use('/api/invite', router);
  };
  