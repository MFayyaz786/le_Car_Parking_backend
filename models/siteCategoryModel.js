const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    site: {
      type: Schema.Types.ObjectId,
      ref: "Site",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    initialFee: {
      type: Number,
      default: null,
    },
    initialHours: {
      type: Number,
      default: null,
    },
    recursiveFee: {
      type: Number,
      default: null,
    },
    recursiveHours: {
      type: Number,
      default: null,
    },
  },

  { timestamps: true }
);

const siteCategoryModel = mongoose.model("SiteCategory", schema);
module.exports = siteCategoryModel;
