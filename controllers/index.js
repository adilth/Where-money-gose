const User = require("../models/User");
const Tasks = require("../models/Tasks");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const getDate = require("../utility/getDate");
module.exports = {
  getIndex: async (req, res) => {
    const user = await User.find();
    res.render("index.ejs", { user: user });
  },
  getSearch: async (req, res) => {
    try {
      const q = req.body.searchInput;
      let { page = 1, limit = 9 } = req.query;
      const count = await getTaskCountBySearch(req.user.id, q);
      console.log(count);
      let tasks;
      let search = q;
      if (q !== null) {
        tasks = await getTasksBySearch(q, limit, page);
      } else {
        search = "search";
        tasks = await getAllTasks(limit, page);
      }
      const total = await getTotalSpendBySearch(req.user.id, q);
      console.log(total);
      const { yearFilter, weekFilter, fullUrl } = await getDate(req);

      res.render("dashboard", {
        title: "task Tracker",
        tasks,
        search,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        user: req.user,
        yearl: yearFilter,
        fullUrl,
        weekly: weekFilter,
        total,
      });
    } catch (e) {
      console.error(e);
      res.render("error500.ejs");
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
      _id: await transporter.sendMail(data);
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

async function getTaskCountBySearch(userId, q) {
  return Tasks.countDocuments({
    $or: [{ task: { $regex: `${q}` } }],
    user: userId,
  });
}

async function getTasksBySearch(q, limit, page) {
  return Tasks.find({ $or: [{ task: { $regex: `${q}` } }] })
    .sort({ spendAt: "desc" })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
}

async function getAllTasks(limit, page) {
  return Tasks.find({})
    .sort({ spendAt: "desc" })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
}

async function getTotalSpendBySearch(userId, q) {
  return Tasks.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        task: { $regex: q, $options: "i" },
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
}
