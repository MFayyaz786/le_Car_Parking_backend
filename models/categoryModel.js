const mongoose = require("mongoose");
const Schema = mongoose.Schema;
 // Define a sub-schema for fee details
const FeeDetailsSchema = new Schema({
  hours: { type: Number, required: true },
  fee: { type: Number, required: true },
  isContinuousHours:{type:Boolean}
});
const schema = new Schema(
  {
    name: {
      type: String,
      // unique: true,
    },
    icon: {
      type: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

const CategoryModel = mongoose.model("Category", schema);
module.exports = CategoryModel;
