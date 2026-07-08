module.exports = (app) => {
  const device = require("../controllers/device.controller.js");
  const auth = require("../controllers/auth.controller.js");
  const mobileAuth = require("../middleware/mobileAuth.js");
  const router = require("express").Router();

  router.get("/", device.findAll);
  router.patch("/:id/approve", device.approve);
  router.patch("/:id/reject", device.reject);
  router.patch("/:id/revoke", device.revoke);

  const mobileRouter = require("express").Router();
  mobileRouter.post("/register", mobileAuth.verifyMobileToken, device.register);
  mobileRouter.get("/me", mobileAuth.verifyMobileToken, device.myDevice);

  app.use("/api/devices", router);
  app.use("/api/devices/mobile", mobileRouter);
};
