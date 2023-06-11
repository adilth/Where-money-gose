const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", ensureAuth, homeController.getHome);
router.get("/new", ensureAuth, homeController.getAddTask);
router.get("/editTask/:id", ensureAuth, homeController.getEditTask);
router.get("/spendsDetail/:id", ensureAuth, homeController.getSpends);
router.get("/chartPage", ensureAuth, homeController.getChartPage);
router.get("/:year", ensureAuth, homeController.getYear);
router.get("/:day", ensureAuth, homeController.getDay);
router.get("/week/:year/:month/:week", ensureAuth, homeController.getWeek);
router.get("/month/:year/:month", ensureAuth, homeController.getMonth);
router.get("/range/:from/:to", ensureAuth, homeController.getRange);
router.delete("/deletePost/:id", homeController.deleteSpends);
router.post("/newTask", homeController.postAddTask);
router.put("/edit/:id", homeController.editTask);

module.exports = router;
