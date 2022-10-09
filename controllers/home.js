const Tasks = require("../models/Tasks");
const User = require("../models/User");
const mongoose = require("mongoose");

module.exports = {
  getHome: async (req, res) => {
    try {
      const tasks = await Tasks.find({ user: req.user.id })
        .sort({ createdAt: "desc" })
        .lean();
      const total = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $group: {
            _id: null,
            count: {
              $sum: "$spend",
            },
          },
        },
      ]);
      res.render("dashboard.ejs", {
        tasks: tasks,
        user: req.user,
        total: total,
      });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  getAddTask: async (req, res) => {
    // const tasks = await Tasks.find();
    res.render("newTask.ejs", {
      // tasks: tasks,
      title: "Add new task Page",
      user: req.user,
      error: "",
    });
  },
  getSpends: async (req, res) => {
    const tasks = await Tasks.find();
    res.render("spend.ejs", {
      tasks: tasks,
      title: "more details about spends Page",
      user: req.user,
      error: "",
    });
  },
  getEditTask: async (req, res) => {
    const tasks = await Tasks.find({ _id: req.params.id });
    res.render("editTask.ejs", {
      title: "Add new task Page",
      tasks: tasks,
      user: req.user,
      error: "",
    });
  },
  postAddTask: async (req, res) => {
    try {
      req.body.user = req.user.id;
      await Tasks.create(req.body);
      res.redirect("/home");
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  editTask: async (req, res) => {
    try {
      const task = await Tasks.findById(req.params.id).lean();
      if (!task) {
        return res.render("error404.ejs");
      }
      if (task.user != req.user.id) {
        res.redirect("/home");
      } else {
        task = await Tasks.findOneAndUpdate({ _id: req.params.id }, req.body);
      }
      res.redirect("/home");
    } catch (err) {
      console.error(err);
      res.render("error500.ejs");
    }
  },
  deleteSpends: async (req, res) => {
    try {
      // Find post by id
      let task = await Tasks.findById({ _id: req.params.id });
      // Delete task from db
      await task.remove({ _id: req.params.id });
      console.log("Deleted task");
      res.redirect("/home");
    } catch (err) {
      res.redirect("/home");
    }
  },
  getYear: async (req, res) => {
    let year = req.params.year;
    const tasks = await Tasks.find({
      $expr: { $eq: [{ $year: "$spendAt" }, year] },
      user: req.user.id,
    });
    res.render("dashboard.ejs", {
      tasks: tasks,
      title: "Show year",
      user: req.user,
      error: "",
    });
  },
  getDay: async (req, res) => {
    const tasks = await Tasks.find();
    res.render("dashboard.ejs", {
      tasks: tasks,
      title: "Add new task Page",
      user: req.user,
      error: "",
    });
  },
  getWeek: async (req, res) => {
    let week = req.params.week;
    let tasks = await Tasks.find({
      $expr: { $eq: [{ $week: "$spendAt" }, week] },
      user: req.user.id,
    });
    res.render("dashboard.ejs", {
      tasks: tasks,
      title: "week spend page",
      user: req.user,
      error: "",
    });
  },
  getMonth: async (req, res) => {
    let month = req.params.month;
    let tasks = await Tasks.find({
      $expr: { $eq: [{ $month: "$spendAt" }, month] },
      user: req.user.id,
    })
      .sort({ createdAt: "desc" })
      .lean();
    res.render("dashboard.ejs", {
      tasks: tasks,
      title: "get month page",
      user: req.user,
      error: "",
    });
  },
  getRange: async (req, res) => {
    let from = req.params.from;
    let to = req.params.to;
    let tasks = await Tasks.find({
      day: {
        $gt: from,
        $lt: to,
      },
      user: req.user.id,
    });
    res.render("dashboard.ejs", {
      tasks: tasks,
      title: "range filter",
      user: req.user,
      error: "",
    });
  },
};
