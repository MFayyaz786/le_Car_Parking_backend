const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    site:{
      type:Schema.Types.ObjectId,
      ref:"Site",
      required:true
    },
    name: {
      type: String,
      required: true,
    },
    direction: { type: String },
    state: {
      type: String,
      enum: ["entrance", "exit", "dual"],
      default:"dual"
    },
    location: {
      type: String,
    },
    latitude: {
      type: Number,
      default:4
    },
    longitude: {
      type: Number,
      default:4
    },
    active: {
      type: Boolean,
      default: false,
    },
    deleted:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

const boothModel = mongoose.model("Booth", schema);
module.exports = boothModel;
