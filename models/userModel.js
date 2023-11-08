const mongoose = require("mongoose");
const { isValidPassword } = require("mongoose-custom-validators");

const Schema = mongoose.Schema;

const schema = new Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    cnic: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: isValidPassword,
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
      },
    },
    gateRole: {
      type: String,
      enum: ["entry", "exit", "dual"],
      default: "dual",
    },
    status: {
      type: Boolean,
      default: true,
    },
    site: {
      type: mongoose.Types.ObjectId,
      ref: "Site",
    },
    boothId: {
      type: mongoose.Types.ObjectId,
      ref: "Booth",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    otp: {
      type: Number,
      default: null,
    },
    otpExpire: {
      type: Date,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const userModel = mongoose.model("User", schema);

module.exports = userModel;
