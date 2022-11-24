const Tasks = require("../models/Tasks");
const User = require("../models/User");
const mongoose = require("mongoose");
const moment = require("moment");

module.exports = {
  getHome: async (req, res) => {
    try {
      let { page = 1, limit = 12 } = req.query;
      const tasks = await Tasks.find({ user: req.user.id })
        .sort({ spendAt: "desc" })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      const count = await Tasks.countDocuments({ user: req.user.id });
      console.log(page);
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
      const yearly = await Tasks.aggregate([
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
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
      const weekly = await Tasks.aggregate([
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
              week: { $week: "$spendAt" },
            },
            count: {
              $sum: "$spend",
            },
          },
        },
      ]);
      const yearFilter = yearly.map((el) => el._id.year);
      const weekFilter = weekly.map((el) => el._id.week);
      const yearId = yearly.map((el) => el._id);

      console.log(yearId);
      res.render("dashboard.ejs", {
        tasks: tasks,
        user: req.user,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        yearl: yearFilter,
        monthly: yearId,
        weekly: weekFilter,
        total: total,
        search: "",
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
      search: null,
    });
  },
  getSpends: async (req, res) => {
    const tasks = await Tasks.find({ _id: req.params.id });
    console.log(tasks);
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
    let { page = 1, limit = 9 } = req.query;
    let year = req.params.year;
    const tasks = await Tasks.find({
      $expr: { $eq: [{ $year: "$spendAt" }, year] },
      user: req.user.id,
    })
      .sort({ spendAt: "desc" })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
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
    const years = await Tasks.aggregate([
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
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);
    const yearly = await Tasks.aggregate([
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
        },
      },
    ]);
    const weekly = await Tasks.aggregate([
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
            week: { $week: "$spendAt" },
          },
          count: {
            $sum: "$spend",
          },
        },
      },
    ]);
    const yearFilter = yearly.map((el) => el._id.year);
    const weekFilter = weekly.map((el) => el._id.week);
    const yearId = yearly.map((el) => el._id);
    console.log(years);
    res.render("dashboard.ejs", {
      tasks: tasks,
      total: total,
      search: "",
      totalPages: Math.ceil(count / limit),
      title: "Show year",
      user: req.user,
      yearl: yearFilter,
      monthly: yearId,
      weekly: weekFilter,
    });
  },
  getDay: async (req, res) => {
    const tasks = await Tasks.find();
    res.render("dashboard.ejs", {
      tasks: tasks,
      total: total,
      totalPages: Math.ceil(count / limit),
      search: "",
      title: "Add new task Page",
      user: req.user,
      yearl: yearFilter,
      monthly: yearId,
    });
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
            $gte: new Date(`2022-${month}-01`),
            $lte: new Date(`2022-${month}-31`),
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
    const yearly = await Tasks.aggregate([
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
        },
      },
    ]);
    const weekly = await Tasks.aggregate([
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
            week: { $week: "$spendAt" },
          },
          count: {
            $sum: "$spend",
          },
        },
      },
    ]);
    const yearFilter = yearly.map((el) => el._id.year);
    const weekFilter = weekly.map((el) => el._id.week);
    const yearId = yearly.map((el) => el._id);
    res.render("dashboard.ejs", {
      tasks: tasks,
      total: total,
      totalPages: Math.ceil(count / limit),
      search: "",
      title: "get month page",
      user: req.user,
      yearl: yearFilter,
      monthly: yearId,
      weekly: weekFilter,
    });
  },
  getWeek: async (req, res) => {
    let { page = 1, limit = 12 } = req.query;
    let week = req.params.week;
    let tasks = await Tasks.find({
      $expr: { $eq: [{ $week: "$spendAt" }, week] },
      user: req.user.id,
    })
      .sort({ spendAt: "desc" })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
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
    const yearly = await Tasks.aggregate([
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
            week: { $week: "$spendAt" },
          },
          count: {
            $sum: "$spend",
          },
        },
      },
    ]);
    const weekly = await Tasks.aggregate([
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
            week: { $week: "$spendAt" },
          },
          count: {
            $sum: "$spend",
          },
        },
      },
    ]);
    const yearFilter = yearly.map((el) => el._id.year);
    const weekFilter = weekly.map((el) => el._id.week);
    const yearId = yearly.map((el) => el._id);
    res.render("dashboard.ejs", {
      tasks: tasks,
      total: total,
      search: "",
      totalPages: Math.ceil(count / limit),
      title: "week spend page",
      user: req.user,
      yearl: yearFilter,
      monthly: yearId,
      weekly: weekFilter,
    });
  },
  getRange: async (req, res) => {
    let from = req.query.from;
    let to = req.query.to;
    let { page = 1, limit = 9 } = req.query;
    let formatFrom = new Date(moment(from, "YYYY-MM-DD").format());
    let formatTo = new Date(moment(to, "YYYY-MM-DD").format());
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
    const yearly = await Tasks.aggregate([
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
        },
      },
    ]);
    const weekly = await Tasks.aggregate([
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
            week: { $week: "$spendAt" },
          },
          count: {
            $sum: "$spend",
          },
        },
      },
    ]);
    const yearFilter = yearly.map((el) => el._id.year);
    const weekFilter = weekly.map((el) => el._id.week);
    const yearId = yearly.map((el) => el._id);
    res.render("dashboard.ejs", {
      tasks: tasks,
      search: "",
      title: "range filter",
      totalPages: Math.ceil(count / limit),
      total: total,
      user: req.user,
      yearl: yearFilter,
      monthly: yearId,
      weekly: weekFilter,
    });
  },
  getChartPage: async (req, res) => {
    try {
      const tasks = await Tasks.find({ user: req.user.id }).lean();
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
          },
        },
        {
          $sort: { _id: -1 },
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
          },
        },
        {
          $sort: { _id: -1 },
        },
      ]);
      console.log(days);
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
