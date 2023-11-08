const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    qrId: { type: String, required: true, unique: true },
    vehicleRegNumber: {
      type: String,
      default: null,
    },
    vehicleModal: {
      type: String,
      default: null,
    },
    vehicleColor: {
      type: String,
      default: null,
    },
    vehiclePic: {
      type: String,
      default: null,
    },
    path: {
      type: String,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    autoIncrement: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: "QR",
      enum: ["QR", "RF"],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const QRModel = mongoose.model("QR", schema);
module.exports = QRModel;
