const passport = require("passport");
const validator = require("validator");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

async function nodemailerEmail(subject, message, userEmail) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.BUSINESS_EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const data = {
    from: process.env.BUSINESS_EMAIL,
    to: userEmail,
    subject: subject,
    html: message,
  };
  return await transporter.sendMail(data);
}
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
    let { email } = req.body;
    if (!validator.isEmail(email))
      validationErrors.push({ msg: "Please enter a valid email address." });
    if (validator.isEmpty(req.body.password))
      validationErrors.push({ msg: "Password cannot be blank." });

    if (validationErrors.length) {
      req.flash("errors", validationErrors);
      return res.redirect("/user/login");
    }
    email = validator.normalizeEmail(email, {
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
        req.flash("info", "Success! You are logged in.");
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
  postSignup: async (req, res, next) => {
    try {
      const { email, password, confirmPassword, userName } = req.body;
      const validationErrors = [];

      if (!validator.isEmail(email)) {
        validationErrors.push({ msg: "Please enter a valid email address." });
      }

      if (!validator.isLength(password, { min: 8 })) {
        validationErrors.push({
          msg: "Password must be at least 8 characters long.",
        });
      }

      if (password !== confirmPassword) {
        validationErrors.push({ msg: "Passwords do not match." });
      }

      if (validationErrors.length > 0) {
        req.flash("errors", validationErrors);
        return res.redirect("/user/signup");
      }

      const normalizedEmail = validator.normalizeEmail(email, {
        gmail_remove_dots: false,
      });

      const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { userName: userName }],
      });

      if (existingUser) {
        req.flash("errors", {
          msg: "An account with that email address or username already exists.",
        });
        return res.redirect("/user/signup");
      }

      const user = new User({
        userName,
        email: normalizedEmail,
        password,
      });

      await user.save();

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        req.flash("info", "Welcome to the pocket process.");
        res.redirect("/home");
      });
    } catch (err) {
      console.log(err);
      res.render("error500.ejs");
      return next(err);
    }
  },
  postConfirmEmail: async (req, res) => {
    const { email } = req.body;
    const validationErrors = [];
    try {
      User.findOne({ email }, async (err, user) => {
        if (!validator.isEmail(email)) {
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
        const url = `https://${req.get("host")}/user/resetPas/${user._id}`;
        nodemailerEmail(
          "change user password",
          `<p>Hey ${user.userName || user.email}, </p> 
        <p>we have received request for reset your account password </p>
        <h3> <a href=${url}>${url}</a></h3>
        `,
          user.email
        );
        req.flash("info", {
          msg: "Please check your Email to reset your password ",
        });
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
    try {
      const user = await User.findById({ _id: id });
      if (await req.user) {
        return res.redirect("/home");
      }
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/index");
      }
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
      const user = await User.findById(id);

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

      nodemailerEmail(
        "Your password has been changed",
        ` <p>Hey ${user?.userName || user?.email}, </p>
        <p>This is a confirmation that the password for your account ${
          user.email
        } has just been changed. </p>
        <h3> thank you /h3>
        `,
        user.email
      );
      user.save((err) => {
        if (err) {
          return next(err);
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          req.flash("info", "you Successfully reset your password");
          res.redirect("/home");
        });
      });
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
