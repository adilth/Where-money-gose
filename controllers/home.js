const Tasks = require("../models/Tasks");
const User = require("../models/User");
const mongoose = require("mongoose");
const moment = require("moment");
const getDate = require("../utility/getDate");

module.exports = {
  getHome: async (req, res) => {
    try {
      let { page = 1, limit = 12 } = req.query;
      const tasks = await Tasks.find({ user: req.user.id })
        .sort({ spendAt: "desc" })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      if (!tasks) {
        res.status(404);
        throw new Error("No tasks found");
      }
      const count = await Tasks.countDocuments({ user: req.user.id });
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

      let { yearFilter, weekFilter, fullUrl } = await getDate(req, res);
      res.render("dashboard.ejs", {
        tasks: tasks,
        user: req.user,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        yearl: yearFilter,
        fullUrl,
        weekly: weekFilter,
        total: total,
        search: "",
      });
    } catch (err) {
      console.log(err);
      res.render("error500.ejs");
    }
  },
  getAddTask: async (req, res) => {
    // const tasks = await Tasks.find();
    res.render("newTask.ejs", {
      title: "Add new task Page",
      user: req.user,
      error: "",
      search: null,
    });
  },
  getSpends: async (req, res) => {
    const tasks = await Tasks.find({ _id: req.params.id });
    res.render("spend.ejs", {
      tasks: tasks,
      title: "more details about spends Page",
      user: req.user,
      search: null,
    });
  },
  getEditTask: async (req, res) => {
    const tasks = await Tasks.find({ _id: req.params.id });
    res.render("editTask.ejs", {
      title: "Add new task Page",
      tasks: tasks,
      user: req.user,
      error: "",
      search: null,
    });
  },
  postAddTask: async (req, res) => {
    try {
      if (
        req.body.task === "" ||
        req.body.spendAt === "" ||
        req.body.spend == "" ||
        req.body.info === ""
      ) {
        req.flash("errors", "please fill all fields");
        return res.redirect("/home/new");
      }
      req.body.user = req.user.id;
      let task = await Tasks.create(req.body);
      if (task) {
        req.flash("info", "you have successfully create the speed");
        return res.redirect("/home");
      }
    } catch (err) {
      console.log(err);
      res.render("error500.ejs");
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
        if (
          req.body.task === "" ||
          req.body.spendAt === "" ||
          req.body.spend == "" ||
          req.body.info === ""
        ) {
          req.flash("errors", "please fill all fields");
          return res.redirect("/home/editTask/" + req.params.id);
        }
        task = await Tasks.findOneAndUpdate({ _id: req.params.id }, req.body);
        if (task) {
          req.flash("info", "you have successfully updated the task");
          return res.redirect("/home");
        }
      }
      // res.redirect("/home");
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
      let removed = await task.remove({ _id: req.params.id });
      console.log("Deleted task");
      if (removed) {
        req.flash("success", "the spend was successfully removed");
        return res.redirect("/home");
      }
    } catch (err) {
      res.redirect("/home");
    }
  },
  getYear: async (req, res) => {
    let { page = 1, limit = 9 } = req.query;
    let year = req.params.year;
    // Find the distinct years in the Tasks collection if not available redirect to home
    try {
      const distinctYears = await Tasks.distinct("spendAt", {
        user: req.user.id,
      });
      const years = distinctYears.map((date) => date.getFullYear());
      if (!years.includes(parseInt(year))) {
        res.status(404);
        req.flash("errors", "invalid date provided");
        return res.redirect("/home");
      }
      const tasks = await Tasks.find({
        $expr: { $eq: [{ $year: "$spendAt" }, parseInt(year)] },
        user: req.user.id,
      })
        .sort({ spendAt: "desc" })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      if (!tasks) {
        res.status(404);
        throw new Error("No tasks found");
      }
      const count = await Tasks.countDocuments({
        $expr: { $eq: [{ $year: "$spendAt" }, year] },
        user: req.user.id,
      });
      const total = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
            spendAt: {
              $gte: new Date(`${year}-1-01`),
              $lte: new Date(`${year}-12-31`),
            },
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
      let { yearFilter, weekFilter, fullUrl } = await getDate(req);
      res.render("dashboard.ejs", {
        tasks: tasks,
        total: total,
        search: "",
        totalPages: Math.ceil(count / limit),
        title: "Show year",
        user: req.user,
        yearl: yearFilter,
        weekly: weekFilter,
        fullUrl,
      });
    } catch (err) {
      console.error(err);
      res.redirect("/home");
    }
  },
  getDay: async (req, res) => {
    const { page = 1, limit = 9 } = req.query;
    try {
      const tasks = await Tasks.find();
      res.render("dashboard.ejs", {
        tasks: tasks,
        total: total,
        totalPages: Math.ceil(count / limit),
        search: "",
        title: "Add new task Page",
        user: req.user,
        yearl: yearFilter,
        fullUrl,
      });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  getMonth: async (req, res) => {
    let month = req.params.month;
    let year = req.params.year;
    let { page = 1, limit = 9 } = req.query;
    let tasks = await Tasks.find({
      $expr: {
        $and: [
          { $eq: [{ $year: "$spendAt" }, year] },
          { $eq: [{ $month: "$spendAt" }, month] },
        ],
      },
      user: req.user.id,
    })
      .sort({ spendAt: "desc" })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    const count = await Tasks.countDocuments({
      $expr: {
        $and: [
          { $eq: [{ $year: "$spendAt" }, year] },
          { $eq: [{ $month: "$spendAt" }, month] },
        ],
      },
      user: req.user.id,
    });
    const total = await Tasks.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(req.user.id),
          spendAt: {
            $gte: new Date(`${year}-${month}-01`),
            $lte: new Date(`${year}-${month}-31`),
          },
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
    let { yearFilter, weekFilter, fullUrl } = await getDate(req, res);
    res.render("dashboard.ejs", {
      tasks: tasks,
      total: total,
      totalPages: Math.ceil(count / limit),
      search: "",
      title: "get month page",
      user: req.user,
      yearl: yearFilter,
      fullUrl,
      weekly: weekFilter,
    });
  },
  getWeek: async (req, res) => {
    let { page = 1, limit = 12 } = req.query;
    let week = req.params.week;
    let year = req.params.year;
    let month = req.params.month;
    let tasks = await Tasks.find({
      $expr: {
        $and: [
          { $eq: [{ $year: "$spendAt" }, year] },
          { $eq: [{ $month: "$spendAt" }, month] },
          { $eq: [{ $week: "$spendAt" }, week] },
        ],
      },
      user: req.user.id,
    })
      .sort({ spendAt: "desc" })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    if (!tasks) {
      res.status(404);
      throw new Error("No tasks found");
    }
    let { yearFilter, weekFilter, count, total, fullUrl } = await getDate(
      req,
      res
    );
    res.render("dashboard.ejs", {
      tasks: tasks,
      total: total,
      search: "",
      totalPages: Math.ceil(count / limit),
      title: "week spend page",
      user: req.user,
      yearl: yearFilter,
      fullUrl,
      weekly: weekFilter,
    });
  },
  getRange: async (req, res) => {
    let { from, to } = req.query;
    let { page = 1, limit = 9 } = req.query;
    // Validate the 'from' and 'to' values using moment.js
    const validFrom = moment(from, "YYYY-MM-DD", true).isValid();
    const validTo = moment(to, "YYYY-MM-DD", true).isValid();

    if (!validFrom || !validTo) {
      res.status(400);
      req.flash("errors", "please enter a valid date");
      return res.redirect("/home");
    }
    let formatFrom = new Date(moment(from, "YYYY-MM-DD").format());
    let formatTo = new Date(moment(to, "YYYY-MM-DD").format());
    try {
      const count = await Tasks.countDocuments({
        spendAt: {
          $gte: formatFrom,
          $lt: formatTo,
        },

        user: req.user.id,
      });

      let tasks = await Tasks.find({
        spendAt: {
          $gte: formatFrom,
          $lt: formatTo,
        },
        user: req.user.id,
      })
        .sort({ spendAt: "desc" })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      if (!tasks) {
        res.status(404);
        throw new Error("No tasks found");
      }
      const total = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
            spendAt: { $gte: formatFrom, $lte: formatTo },
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
      let { yearFilter, weekFilter, fullUrl } = await getDate(req, res);
      res.render("dashboard.ejs", {
        tasks: tasks,
        search: "",
        title: "range filter",
        totalPages: Math.ceil(count / limit),
        total: total,
        user: req.user,
        yearl: yearFilter,
        fullUrl,
        weekly: weekFilter,
      });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  getChartPage: async (req, res) => {
    try {
      const tasks = await Tasks.find({ user: req.user.id })
        .sort({ createdAt: 1 })
        .lean();
      if (!tasks) {
        res.status(404);
        throw new Error("No tasks found");
      }
      const count = await Tasks.countDocuments({ user: req.user.id });
      const total = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$spendAt" },
            },
            count: {
              $sum: "$spend",
            },
            average: {
              $avg: "$spend",
            },
          },
        },
      ]);
      const months = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$spendAt" },
              month: { $month: "$spendAt" },
            },
            count: {
              $sum: "$spend",
            },
            average: {
              $avg: "$spend",
            },
            doc: {
              $sum: 1,
            },
          },
        },
        {
          $sort: { "_id.year": -1, "_id.month": 1 },
        },
      ]);
      const days = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$spendAt" },
            },
            count: {
              $sum: "$spend",
            },
            average: {
              $avg: "$spend",
            },
            doc: {
              $sum: 1,
            },
          },
        },
      ]);

      res.render("chartjs.ejs", {
        tasks: tasks,
        months: months,
        days: days,
        user: req.user,
        total: total,
        spendCards: count,
        search: "",
      });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
};
