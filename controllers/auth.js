const passport = require("passport");
const validator = require("validator");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

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
      return res.redirect("/user/login");
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
        return res.redirect("/user/login");
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
    const { email } = req.body;
    const validationErrors = [];
    try {
      User.findOne({ email }, async (err, user) => {
        if (!validator.isEmail(req.body.email)) {
          validationErrors.push({ msg: "please enter a valid email address" });
        }

        if (err || !user) {
          validationErrors.push({
            msg: "No account with that email address exists.",
          });
        }
        if (validationErrors.length) {
          req.flash("errors", validationErrors);
          return res.redirect("/user/forget");
        }
        const token = await jwt.sign(
          { _id: user._id },
          process.env.RESET_PASSWORD_KEY,
          {
            expiresIn: "20m",
          }
        );
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.BUSINESS_EMAIL,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
        const url = `http://localhost:3001/user/resetPas/${user._id}`;
        console.log({ url });
        const data = {
          from: process.env.BUSINESS_EMAIL,
          to: user.email,
          subject: "change user password",
          html: ` <p>Hey ${user.name || user.email}, </p> /n 
        <p>we have received request for reset your account password </p>
        <h3> <a href=${url}>${url}</a></h3>
        `,
        };
        // let emailTransporter = await createTransporter();
        await transporter.sendMail(data);
        req.flash("success", { msg: "Success! You are logged in." });
        res.redirect("/user/forget");
      });
    } catch (e) {
      console.log(e);
      res.render("error404.ejs");
    }
  },
  getForgetPass: async (req, res) => {
    try {
      const user = await User.find();
      if (req.user) {
        return res.redirect("/home");
      }
      res.render("forgetPass.ejs", {
        title: "forget page",
        user: user,
      });
    } catch (err) {
      console.log(e);
      res.render("error404.ejs");
    }
  },
  getResetPass: async (req, res) => {
    const id = req.params.id;
    console.log(id);
    try {
      // let user = await User.find({ _id: req.params.id });
      const user = await User.findById({ _id: id });
      if (await req.user) {
        return res.redirect("/home");
      }
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/index");
      }
      console.log(user);
      res.render("resetPass.ejs", {
        title: "change password",
        user: null,
        use: user,
      });
    } catch (e) {
      console.log(e);
      res.render("error404.ejs");
    }
  },
  putResetPass: async (req, res, next) => {
    try {
      const validationErrors = [];
      const { confirmPassword, newPassword } = req.body;
      const { id } = req.params;
      const user = await User.findById(req.params.id);
      console.log(id, user);
      // , async (err, user) => {
      console.log(id);
      console.log(user._id);
      if (req.user) {
        return res.redirect("/home");
      }
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/index");
      }
      if (!validator.isLength(newPassword, { min: 8 }))
        validationErrors.push({
          msg: "Password must be at least 8 characters long",
        });
      if (newPassword !== confirmPassword)
        validationErrors.push({ msg: "Passwords do not match" });
      const salt = await bcrypt.genSalt(10);
      if (validationErrors.length) {
        req.flash("errors", validationErrors);
        return res.redirect(`/user/resetPas/${user.id}`);
      }
      const newPass = await bcrypt.hash(newPassword, salt);
      const userPassword = await User.findOneAndUpdate(
        { _id: id },
        { password: newPass },
        { new: true }
      );
      console.log(userPassword);
      // console.log(transporter);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.BUSINESS_EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      const data = {
        from: process.env.BUSINESS_EMAIL,
        to: user.email,
        subject: "Your password has been changed",
        html: ` <p>Hey ${user.userName || user.email}, </p>
        <p>This is a confirmation that the password for your account  ${
          user.email
        } has just been changed.\n </p>
        <h3> thank you /h3>
        `,
      };
      console.log(data);
      // let emailTransporter = await createTransporter();
      await transporter.sendMail(data);
      // res.redirect(req.session.returnTo || "/home");
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
      // });
    } catch (err) {
      console.log(err);
      res.render("error404.ejs");
    }
  },
  changePass: async (req, res) => {
    try {
      const validationErrors = [];
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
