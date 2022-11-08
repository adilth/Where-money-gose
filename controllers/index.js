const User = require("../models/User");
const Tasks = require("../models/Tasks");
const mongoose = require("mongoose");
module.exports = {
  getIndex: async (req, res) => {
    const user = await User.find();
    res.render("index.ejs", { user: user });
  },
  getSearch: async (req, res) => {
    let q = req.body.searchInput;
    let { page = 1, limit = 12 } = req.query;

    const count = await Tasks.countDocuments();

    let taskData = null;
    let qry = { $or: [{ task: { $regex: q } }] };
    console.log(qry);
    try {
      if (q != null) {
        let taskResult = await Tasks.find(qry)
          .sort({ spendAt: "desc" })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .lean();
        taskData = taskResult;
        console.log(taskData);
      } else {
        q = "search";
        let taskResult = await Tasks.find({})
          .sort({ spendAt: "desc" })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .lean();
        taskData = taskResult;
      }
      const total = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
            task: q,
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
      res.render("dashboard", {
        title: "task Tracker",
        tasks: taskData,
        search: q,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        user: req.user,
        total: total,
      });
    } catch (e) {
      console.error(e);
    }
  },
};
