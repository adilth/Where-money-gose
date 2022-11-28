const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/:id", ensureAuth, profileController.getProfile);
router.get("/countSpend", ensureAuth, profileController.getCount);
router.put("/:id", profileController.changePass);
router.put("/user/:id", profileController.changeUserInfo);
// router.get("/profile/:id", ensureAuth, postsController.getProfile);

module.exports = router;
