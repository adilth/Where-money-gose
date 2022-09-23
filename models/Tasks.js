const mongoose = require("mongoose");

const TasksSchema = new mongoose.Schema({
  task: { type: String, require: true },
  spend: { type: Number, require: true },
  info: { type: String, require: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  spendAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Tasks", TasksSchema);
