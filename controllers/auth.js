const passport = require("passport");
const validator = require("validator");
const bcrypt = require("bcrypt");
const User = require("../models/User");

module.exports = {
  getLogin: async (req, res) => {
    const user = await User.find();
    if (req.user) {
      return res.redirect("/home");
    }
    res.render("login", {
      title: "Login",
      user: user,
    });
  },
  postLogin: (req, res, next) => {
    const validationErrors = [];
    if (!validator.isEmail(req.body.email))
      validationErrors.push({ msg: "Please enter a valid email address." });
    if (validator.isEmpty(req.body.password))
      validationErrors.push({ msg: "Password cannot be blank." });

    if (validationErrors.length) {
      req.flash("errors", validationErrors);
      return res.redirect("/login");
    }
    req.body.email = validator.normalizeEmail(req.body.email, {
      gmail_remove_dots: false,
    });

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash("errors", info);
        return res.redirect("/login");
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        req.flash("success", { msg: "Success! You are logged in." });
        res.redirect(req.session.returnTo || "/home");
      });
    })(req, res, next);
  },
  logout: (req, res) => {
    // req.logout(() => {
    //   console.log("User has logged out.");
    // });
    // req.session.destroy((err) => {
    //   if (err)
    //     console.log(
    //       "Error : Failed to destroy the session during logout.",
    //       err
    //     );
    //   req.user = null;
    //   res.redirect("/");
    // });
    req.session.user = null;
    req.session.save(function (err) {
      if (err) next(err);

      // regenerate the session, which is good practice to help
      // guard against forms of session fixation
      req.session.regenerate(function (err) {
        if (err) next(err);
        res.redirect("/");
      });
    });
  },
  getSignup: async (req, res) => {
    const user = await User.find();
    if (req.user) {
      return res.redirect("/home");
    }
    res.render("signup", {
      title: "Create Account",
      user: user,
    });
  },
  postSignup: (req, res, next) => {
    const validationErrors = [];
    if (!validator.isEmail(req.body.email))
      validationErrors.push({ msg: "Please enter a valid email address." });
    if (!validator.isLength(req.body.password, { min: 8 }))
      validationErrors.push({
        msg: "Password must be at least 8 characters long",
      });
    if (req.body.password !== req.body.confirmPassword)
      validationErrors.push({ msg: "Passwords do not match" });

    if (validationErrors.length) {
      req.flash("errors", validationErrors);
      return res.redirect("/user/signup");
    }
    req.body.email = validator.normalizeEmail(req.body.email, {
      gmail_remove_dots: false,
    });

    const user = new User({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
    });

    User.findOne(
      { $or: [{ email: req.body.email }, { userName: req.body.userName }] },
      (err, existingUser) => {
        if (err) {
          return next(err);
        }
        if (existingUser) {
          req.flash("errors", {
            msg: "Account with that email address or username already exists.",
          });
          return res.redirect("/user/signup");
        }
        user.save((err) => {
          if (err) {
            return next(err);
          }
          req.logIn(user, (err) => {
            if (err) {
              return next(err);
            }
            res.redirect("/home");
          });
        });
      }
    );
  },
  postConfirmEmail: async (req, res) => {
    const user = await User.find();
    if (req.user) {
      return res.redirect("/home");
    }
    res.render("signup", {
      title: "Create Account",
      user: user,
    });
  },
  getForgetPass: async (req, res) => {
    const user = await User.find();
    if (req.user) {
      return res.redirect("/home");
    }
    res.render("forgetPass", {
      title: "Create Account",
      user: user,
    });
  },
  getResetPass: async (req, res) => {
    const user = await User.find();
    if (req.user) {
      return res.redirect("/home");
    }
    res.render("resetPass", {
      title: "Create Account",
      user: user,
    });
  },
  putResetPass: async (req, res) => {
    const user = await User.find();
    if (req.user) {
      return res.redirect("/home");
    }
    res.render("signup", {
      title: "Create Account",
      user: user,
    });
  },
  changePass: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.find({ _id: id });
      const { oldPassword, password } = req.body;
      if (!validator.isLength(req.body.password, { min: 8 }))
        validationErrors.push({
          msg: "Password must be at least 8 characters long",
        });
      if (req.body.password !== req.body.confirmPassword)
        validationErrors.push({ msg: "Passwords do not match" });

      if (validationErrors.length) {
        req.flash("errors", validationErrors);
        return res.redirect("/home/profile");
      }
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        validationErrors.push({ msg: "Please enter correct old password" });
      }
      const salt = await bcrypt.genSalt(10);

      const newPassword = await bcrypt.hash(password, salt);
      // const userPassword = await User.findOneAndUpdate(
      //   { _id: req.user.id },
      //   { password: passport },
      //   { new: true }
      // );
      await newPassword.save();
      res.render("profile.ejs", {
        title: "Profile Page",
        user: user,
      });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
};
