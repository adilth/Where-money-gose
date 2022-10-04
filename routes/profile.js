const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", ensureAuth, profileController.getProfile);
// router.get("/profile/:id", ensureAuth, postsController.getProfile);
// router.get("dashboard", ensureAuth, postsController.getFeed);

module.exports = router;
