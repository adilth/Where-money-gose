const express = require("express");
const router = express.Router();
const indexController = require("../controllers/index");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", indexController.getIndex);
router.post("/q", ensureAuth, indexController.getSearch);
// router.get("dashboard", ensureAuth, postsController.getFeed);

module.exports = router;
