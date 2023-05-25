const Tasks = require("../models/Tasks");
const User = require("../models/User");
const mongoose = require("mongoose");

async function getDate(req, res) {
  let month = req.params.month;
  let year = req.params.year;
  let { page = 1, limit = 9 } = req.query;
  let tasks = await Tasks.find({
    $expr: {
      $and: [
        { $eq: [{ $year: "$spendAt" }, year] },
        { $eq: [{ $month: "$spendAt" }, month] },
      ],
    },
    user: req.user.id,
  })
    .sort({ spendAt: "desc" })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
  const count = await Tasks.countDocuments({
    $expr: {
      $and: [
        { $eq: [{ $year: "$spendAt" }, year] },
        { $eq: [{ $month: "$spendAt" }, month] },
      ],
    },
    user: req.user.id,
  });
  const total = await Tasks.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(req.user.id),
        spendAt: {
          $gte: new Date(`2022-${month}-01`),
          $lte: new Date(`2022-${month}-31`),
        },
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
  return {
    tasks,
    yearly,
    weekly,
    count,
    total,
  };
}

module.exports = getDate();
