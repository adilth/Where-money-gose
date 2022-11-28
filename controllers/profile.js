const User = require("../models/User");
const Tasks = require("../models/Tasks");
const passport = require("passport");
const validator = require("validator");
const bcrypt = require("bcrypt");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const id = req.params.id;
      const tasks = await Tasks.findById({ _id: id });
      const result = await Tasks.count({ user: req.user.id });
      res.render("profile.ejs", {
        tasks: tasks,
        user: req.user,
        error: "",
        result: result,
        search: null,
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
      let user = await User.findById({ _id: id });
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        validationErrors.push({ msg: "Please enter correct old password" });
      }

      if (validationErrors.length) {
        req.flash("errors", validationErrors);
        return res.redirect("/profile/" + req.params.id);
      }

      const salt = await bcrypt.genSalt(10);

      const newPassword = await bcrypt.hash(password, salt);
      const userUpDate = await User.updateOne(
        { _id: id },
        { password: newPassword }
      );
      req.flash("success", {
        msg: "your password has successfully changed",
      });
      res.redirect("/profile/" + req.params.id);
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  changeUserInfo: async (req, res, next) => {
    try {
      const { id } = req.params;
      const validationErrors = [];
      if (!validator.isLength(req.body.userName, { min: 5 }))
        validationErrors.push({
          msg: "user Name must be at least 6 characters long",
        });
      if (!validator.isEmail(req.body.email))
        validationErrors.push({ msg: "Please enter a valid email address." });
      if (req.body.email !== req.body.confirmEmail)
        validationErrors.push({ msg: "please check you email your enter" });
      let user = await User.findById({ _id: id });
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.user.id } },
          { $or: [{ email: req.body.email }, { userName: req.body.userName }] },
        ],
      });
      console.log(existingUser);
      if (existingUser != null && existingUser.userName == req.body.userName) {
        req.flash("errors", {
          msg: "this userName is already exists",
        });
        return res.redirect("/profile/" + req.params.id);
      }
      if (existingUser) {
        req.flash("errors", {
          msg: "this email is already exists",
        });
        return res.redirect("/profile/" + req.params.id);
      }

      if (validationErrors.length) {
        req.flash("errors", validationErrors);
        return res.redirect("/profile/" + req.params.id);
      }
      const tasks = await User.findOneAndUpdate(
        { _id: req.user.id },
        { $set: { userName: req.body.userName, email: req.body.email } }
      );
      req.flash("success", {
        msg: "your user info has successfully changed",
      });
      res.redirect("/profile/" + req.params.id);
    } catch (err) {
      console.error(err);
      res.render("error500.ejs");
    }
  },
};
