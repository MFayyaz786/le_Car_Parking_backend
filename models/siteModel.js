const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    site: {
      type: String,
      required: true,
      // unique: true,
    },
    location: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    onCheckInFee: {
      type: Boolean,
      required: true,
    },
    isDynamicFee: { type: Boolean, required: true },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const siteModel =new mongoose.model("Site", schema);
module.exports = siteModel;
