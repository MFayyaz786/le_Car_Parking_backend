const { default: mongoose } = require("mongoose");
const QRModel = require("../models/QRModel");
const uploadQRs = require("../utils/uploadQRs");

const QRServices = {
  create: async (
    body
    // qrId,
    // vehicleRegNumber = null,
    // vehicleModal = null,
    // vehiclePic = null,
    // vehicleColor = null,
    // image
  ) => {
    let count;
    const lastIncrement = await QRModel.findOne().sort({ _id: -1 });
    if (lastIncrement) {
      count = lastIncrement.autoIncrement;
    } else {
      count = 0;
    }
    console.log(body);
    //return;
    // lastIncrement = lastIncrement.autoIncrement;
    // let count = lastIncrement;
    const session = await mongoose.startSession();
    let qrs = [];
    try {
      session.startTransaction();
      for (var i = 0; i < body.length; i++) {
        if (!body[i].qrId || !body[i].path) {
          throw new Error("The body parameter cannot be null or undefined.");
        }
        count = count + 1;
        const qrId = await body[i].qrId;
        const path = await uploadQRs(body[i].path, qrId);
        const qr = new QRModel({
          qrId,
          vehicleRegNumber: null,
          vehicleModal: null,
          vehiclePic: null,
          vehicleColor: null,
          path,
          type: "QR",
          autoIncrement: count,
        });
        const result = await qr.save();
        qrs.push(result);
      }
      await session.commitTransaction();
      return qrs;
    } catch (error) {
      // Abort the transaction if any operation fails
      await session.abortTransaction();
      console.error("Transaction aborted. Error: ", error);
      throw error; // rethrow the error to the caller
    } finally {
      // End the session
      session.endSession();
    }
  },
  createQR: async (qrId) => {
    let count;
    const lastIncrement = await QRModel.findOne().sort({ _id: -1 });
    if (lastIncrement) {
      count = lastIncrement.autoIncrement;
    } else {
      count = 0;
    }
    const qr = new QRModel({
      qrId,
      vehicleRegNumber: null,
      vehicleModal: null,
      vehiclePic: null,
      vehicleColor: null,
      path: "",
      autoIncrement: count,
    });
    const result = await qr.save();
    return result;
  },
  updateQR: async () => {
    const result = await QRModel.updateMany(
      {},
      { $set: { isAvailable: true } }
    );
    return result;
  },
  getAllRFIDs: async (page) => {
    const RFIDS = await QRModel.find(
      { type: "RF" },
      { qrId: 1, autoIncrement: 1 }
    )
      .populate({
        path: "uploadedBy",
        select: { firstName: 1, lastName: 1, phone: 1, email: 1 },
      })
      .skip(15 * (page - 1))
      .limit(15);
    return RFIDS;
  },
  getById: async (id) => {
    const result = await QRModel.findById(id);
    return result;
  },
  getByQRId: async (qrId) => {
    const result = await QRModel.findOne({ qrId });
    return result;
  },

  getAll: async () => {
    const result = await QRModel.find();
    return result;
  },
  deleteById: async (id) => {
    const result = await QRModel.findByIdAndDelete(id);
    return result;
  },
  deleteAll: async () => {
    const result = await QRModel.deleteMany({});
    return result;
  },
};

module.exports = QRServices;
