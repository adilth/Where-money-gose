const Tasks = require("../models/Tasks");
const User = require("../models/User");

module.exports = {
  getHome: async (req, res) => {
    try {
      const tasks = await Tasks.find().sort({ createdAt: "desc" }).lean();
      // const user = await User.find();
      res.render("dashboard.ejs", { tasks: tasks, user: req.user });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  getAddTask: async (req, res) => {
    const tasks = await Tasks.find();
    res.render("newTask.ejs", {
      tasks: tasks,
      title: "Add new task Page",
      user: req.user,
      error: "",
    });
  },
  getEditTask: async (req, res) => {
    const tasks = await Tasks.find();
    res.render("editTask.ejs", {
      title: "Add new task Page",
      tasks: tasks,
      user: req.user,
      error: "Invalid Request",
    });
  },
  postAddTask: async (req, res) => {
    try {
      req.body.user = req.user.id;
      await Tasks.create(req.body);
      res.redirect("/dashboard");
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  editTask: async (req, res) => {
    try {
      req.body.user = req.user.id;
      await Tasks.create(req.body);
      res.redirect("/dashboard");
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
};
