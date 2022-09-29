const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", ensureAuth, homeController.getHome);
router.get("/new", ensureAuth, homeController.getAddTask);
router.get("/editTask/:id", ensureAuth, homeController.getEditTask);
router.get("/spend/:id", ensureAuth, homeController.getSpends);
router.delete("//deletePost/:id", homeController.deleteSpends);
router.post("/newTask", homeController.postAddTask);
router.put("/edit/:id", homeController.editTask);

module.exports = router;
