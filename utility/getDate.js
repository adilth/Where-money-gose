const Tasks = require("../models/Tasks");
const User = require("../models/User");
const mongoose = require("mongoose");

async function getDate(req, res) {
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
      $sort: { _id: -1 },
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
  const dateData = {};

  weekly.forEach((el) => {
    const { year, month, week } = el._id;

    if (!dateData[year]) {
      dateData[year] = {};
    }

    if (!dateData[year][month]) {
      dateData[year][month] = [];
    }

    dateData[year][month].push(week);
  });
  let fullUrl = req.originalUrl;
  console.log(fullUrl);
  let weekFilter = Object.entries(dateData);
  return {
    yearFilter,
    weekFilter,
    fullUrl,
  };
}

module.exports = getDate;
