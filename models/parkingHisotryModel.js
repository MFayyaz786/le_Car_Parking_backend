const mongoose = require("mongoose");
const moment = require("moment");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    QR: {
      type: Schema.Types.ObjectId,
      ref: "QR",
    },
    vehicleRegNumber: {
      type: String,
    },
    checkIn: {
      type: Boolean,
      default: true,
    },
    checkout: {
      type: Boolean,
      default: false,
    },
    checkInTime: {
      type: String,
      //type: Date,
      // default: null,
    },
    checkOutTime: {
      type: String,
      //type: Date,
      // default: null,
    },
    vehicleType: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },
    checkInBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    site: {
      type: mongoose.Types.ObjectId,
      ref: "Site",
    },
    checkOutBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    createdDate: {
      //type: String,
      type: Date,
    },
    parkingFee: {
      type: Number,
      default: 0,
    },
    checkInMode: {
      type: String,
    },
    checkOutMode: {
      type: String,
    },
  },
  { timestamps: true }
);
const parkingHistoryModel = mongoose.model("ParkingHistory", schema);
module.exports = parkingHistoryModel;
