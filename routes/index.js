const express = require("express");
const router = express.Router();
const indexController = require("../controllers/index");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", indexController.getIndex);
router.get("/contact", ensureAuth, indexController.getContactUs);
router.post("/home/q", ensureAuth, indexController.getSearch);
router.post("/contact", ensureAuth, indexController.contactUs);
// router.get("dashboard", ensureAuth, postsController.getFeed);

module.exports = router;
