const User = require("../models/User");
const Tasks = require("../models/Tasks");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
module.exports = {
  getIndex: async (req, res) => {
    const user = await User.find();
    res.render("index.ejs", { user: user });
  },
  getSearch: async (req, res) => {
    let q = req.body.searchInput;
    let { page = 1, limit = 12 } = req.query;

    const count = await Tasks.countDocuments({ _id: req.params.id });

    let taskData = null;
    let qry = { $or: [{ task: { $regex: q } }] };
    try {
      if (q != null) {
        let taskResult = await Tasks.find(qry)
          .sort({ spendAt: "desc" })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .lean();
        taskData = taskResult;
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
      const yearly = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$spendAt" },
              month: { $month: "$spendAt" },
            },
            count: {
              $sum: "$spend",
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
      const weekly = await Tasks.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$spendAt" },
              month: { $month: "$spendAt" },
              week: { $week: "$spendAt" },
            },
            count: {
              $sum: "$spend",
            },
          },
        },
      ]);
      const yearFilter = yearly.map((el) => el._id.year);
      const weekFilter = weekly.map((el) => el._id.week);
      const yearId = yearly.map((el) => el._id);
      res.render("dashboard", {
        title: "task Tracker",
        tasks: taskData,
        search: q,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        user: req.user,
        yearl: yearFilter,
        monthly: yearId,
        weekly: weekFilter,
        total: total,
      });
    } catch (e) {
      console.error(e);
    }
  },
  getContactUs: async (req, res) => {
    try {
      const user = await Tasks.find({ user: req.user.id });
      res.render("contact.ejs", { user: req.user, msg: "", search: null });
    } catch (e) {
      console.error(err);
      res.render("error500.ejs");
    }
  },
  contactUs: async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (name === "" || email === "" || subject == "" || message === "") {
        req.flash("errors", "please fill all fields");
        return res.redirect("/contact");
      }
      const user = await Tasks.find({ user: req.user.id });
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.BUSINESS_EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      const data = {
        from: email,
        to: process.env.BUSINESS_EMAIL,
        subject: subject,
        html: ` <p>email from ${name} and his ${email} send from spend money  </p>
        <p> ${message} </p>
        `,
      };
      await transporter.sendMail(data);
      req.flash("success", {
        msg: "your email has successfully send message",
      });
      res.render("contact", { user: req.user, search: null });
    } catch (err) {
      console.error(err);
      res.render("error500.ejs");
    }
  },
};
