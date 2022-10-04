const User = require("../models/User");
const Tasks = require("../models/Tasks");
module.exports = {
  getProfile: async (req, res) => {
    try {
      res.render("profile.ejs", { user: req.user, error: "" });
      const tasks = await Tasks.find().sort({ createdAt: "desc" }).lean();
      // const user = await User.find();
      res.render("profile.ejs", { tasks: tasks, user: req.user });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
};
