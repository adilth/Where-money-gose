const mongoose = require("mongoose");

const TasksSchema = new mongoose.Schema(
  {
    task: { type: String, trim: true, require: true },
    spend: { type: Number, require: true },
    info: { type: String, trim: true, require: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
    spendAt: { type: Date, require: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Tasks", TasksSchema);
