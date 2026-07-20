module.exports = app => {
    const auth = require("../controllers/auth.controller");
  
    var router = require("express").Router();
  
    // Login route
    router.post("/login", auth.login);

    router.post("/mobile_login", auth.mobile_login);

    // Register route
    router.post("/register", auth.register);
    router.post("/mobile_register", auth.mobile_register);
    router.post("/forgot_pass", auth.forgot_pass);

    // Verify token route (to protect routes that need authentication)
    router.get("/verify", auth.verifyToken, (req, res) => {
      res.status(200).send("Token is valid!");
    });

    router.get("/me", auth.verifyToken, auth.getMe);
    router.post("/refresh", auth.verifyToken, auth.refresh);
    router.post("/mobile_logout", auth.verifyToken, auth.mobile_logout);
    router.patch("/preferences", auth.verifyToken, auth.updatePreferences);
    router.put("/preferences", auth.verifyToken, auth.updatePreferences);

    router.post("/verifyOtp", auth.verifyOtp);
    router.post("/verifyOtpForgot", auth.verifyOtpForgot);

    router.post("/updateInfo", auth.updateInfo);
    router.post("/updateForgotPass", auth.updateForgotPass);

  
    app.use("/api/auth", router);
  };
  