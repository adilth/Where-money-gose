const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", homeController.getHome);
router.get("/new", ensureAuth, homeController.getAddTasks);
router.post("/newTask", ensureAuth, homeController.postAddTask);

module.exports = router;
