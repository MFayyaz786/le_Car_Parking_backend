const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    method: String,
    path: String,
    request: Object,
    response: Object,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const apiLogsModel = new mongoose.model("ApiLog", schema);
module.exports = apiLogsModel;
