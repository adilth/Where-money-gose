const User = require("../models/User");
const Tasks = require("../models/Tasks");
const validator = require("validator");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");

module.exports = {
  getProfile: asyncHandler(async (req, res) => {
    try {
      const tasks = await Tasks.findById(req.params.id);
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
  }),
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
      const { userName, email } = req.body;
      const validationErrors = [];

      if (!validator.isLength(userName, { min: 5 }))
        validationErrors.push({
          msg: "user Name must be at least 6 characters long",
        });
      if (!validator.isEmail(email))
        validationErrors.push({ msg: "Please enter a valid email address." });
      if (email !== req.body.confirmEmail)
        validationErrors.push({ msg: "please check you email your enter" });
      let user = await User.findById({ _id: id });
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.user.id } },
          { $or: [{ email }, { userName }] },
        ],
      });

      console.log(user, existingUser);
      if (existingUser != null && existingUser.userName == userName) {
        req.flash("errors", {
          msg: "this userName is already exists",
        });
        return res.redirect("/profile/" + id);
      }

      if (existingUser) {
        req.flash("errors", {
          msg: "this email is already exists",
        });
        return res.redirect("/profile/" + id);
      }
      if (user.email == email && user.userName == userName) {
        req.flash("errors", {
          msg: "please enter what you want to change",
        });
        return res.redirect("/profile/" + id);
      }

      if (validationErrors.length) {
        req.flash("errors", validationErrors);
        return res.redirect("/profile/" + id);
      }
      const tasks = await User.findOneAndUpdate(
        { _id: req.user.id },
        { $set: { userName: userName, email: email } }
      );
      req.flash("success", {
        msg: "your user info has successfully changed",
      });
      res.redirect("/profile/" + id);
    } catch (err) {
      console.error(err);
      res.render("error500.ejs");
    }
  },
};
