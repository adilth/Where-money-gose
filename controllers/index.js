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
    console.log(q);
    let taskData = null;
    let qry = { $or: [{ task: { $regex: q } }] };
    console.log(qry);
    try {
      if (q != null) {
        let taskResult = await Tasks.find(qry);
        taskData = taskResult;
        console.log(taskData);
      } else {
        q = "search";
        let taskResult = await Tasks.find({});
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
        user: req.user,
        total: total,
      });
    } catch (e) {
      console.error(e);
    }
  },
};
