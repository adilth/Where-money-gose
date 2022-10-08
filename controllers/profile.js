const User = require("../models/User");
const Tasks = require("../models/Tasks");
module.exports = {
  getProfile: async (req, res) => {
    try {
      const tasks = await Tasks.find();
      const result = await Tasks.count({ user: req.user.id });
      res.render("profile.ejs", {
        tasks: tasks,
        user: req.user,
        error: "",
        result: result,
      });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  getCount: async (req, res) => {
    Tasks.count({}, function (err, result) {
      if (err) {
        res.send(err);
      } else {
        res.render("profile.ejs", { result: result });
      }
    });
  },
};
