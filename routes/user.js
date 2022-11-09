const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
// const postsController = require("../controllers/posts");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.get("/forget", authController.getForgetPass);
router.get("/resetPas/:id", authController.getResetPass);
router.post("/signup", authController.postSignup);
router.post("/forgetPass", authController.postConfirmEmail);
router.put("/resetPass/:id", authController.putResetPass);

module.exports = router;
