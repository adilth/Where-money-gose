const User = require("../models/User");
const Tasks = require("../models/Tasks");
const passport = require("passport");
const validator = require("validator");
const bcrypt = require("bcrypt");

module.exports = {
  getProfile: async (req, res) => {
    try {
      // const id = req.params.id;
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
  changePass: async (req, res) => {
    try {
      const validationErrors = [];
      const { id } = req.params;
      const { oldPassword, password } = req.body;
      if (!validator.isLength(req.body.password, { min: 8 }))
        validationErrors.push({
          msg: "Password must be at least 8 characters long",
        });
      if (req.body.password !== req.body.confirmPassword)
        validationErrors.push({ msg: "Passwords do not match" });

      if (validationErrors.length) {
        req.flash("errors", validationErrors);
        return res.redirect("/profile");
      }
      // const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      // if (!isValidPassword) {
      //   validationErrors.push({ msg: "Please enter correct old password" });
      // }

      const salt = await bcrypt.genSalt(10);

      const newPassword = await bcrypt.hash(password, salt);
      const user = await User.updateOne({ _id: id }, { password: newPassword });
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  changeUserInfo: async (req, res) => {
    try {
      const validationErrors = [];
      if (!validator.isLength(req.body.userName, { min: 6 }))
        validationErrors.push({
          msg: "user Name must be at least 6 characters long",
        });
      if (!validator.isEmail(req.body.email))
        validationErrors.push({ msg: "Please enter a valid email address." });
      if (req.body.email !== req.body.confirmEmail)
        validationErrors.push({ msg: "please check you email your enter" });
      if (validationErrors.length) {
        req.flash("errors", validationErrors);
        console.log(validationErrors);
        return res.redirect("/profile");
      }
      const { id } = req.params;
      console.log(id);
      const tasks = await User.findOneAndUpdate(
        { _id: req.user.id },
        { $set: { userName: req.body.userName, email: req.body.email } }
      );
      res.redirect("/profile");
    } catch (err) {
      console.error(err);
    }
  },
};
