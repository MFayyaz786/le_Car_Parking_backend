const express = require("express");
const QRServices = require("../services/QRServices");
const expressAsyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const uploadFile = require("../utils/uploadFile");
const qr = require("qrcode");
const fs = require("fs");
const uploadQRs = require("../utils/uploadQRs");
const QRModel = require("../models/QRModel");
const multer = require("multer");
const XLSX = require("xlsx");
const { default: mongoose } = require("mongoose");
const QRRouter = express.Router();
// Create a new QR code
QRRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    try {
      const result = await QRServices.create(req.body);
      res.status(201).send({ msg: "QRS successfully created", data: result });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);

QRRouter.patch(
  "/updateQR",
  expressAsyncHandler(async (req, res) => {
    try {
      const result = await QRServices.updateQR();
      res.status(200).send({ msg: "QRS successfully updated", data: result });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);

QRRouter.post(
  "/generate",
  expressAsyncHandler(async (req, res) => {
    const { numberOfCodes } = req.body;
    const qrIds = [];
    for (var i = 0; i < numberOfCodes; i++) {
      const qrId = uuidv4();
      qrIds.push(qrId);
    }
    const result = await Promise.all(
      qrIds.map(async (id) => {
        return await QRServices.create(id);
      })
    );
    res.status(201).send({ msg: "Generated", data: result });
  })
);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Route for file upload
QRRouter.post(
  "/upload/:id",
  upload.single("file"),
  expressAsyncHandler(async (req, res) => {
    const filePath = req.file.path;
    // Process the uploaded file
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      // Extract the required data and send it back to the frontend
      const processedData = await processData(req.params.id, data);
      res.status(200).send({msg:"Success", data: processedData });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: error.message });
    }
  })
);
QRRouter.get(
  "/RFIDs",
  expressAsyncHandler(async (req, res) => {
    const result = await QRServices.getAllRFIDs(req.query.page);
    res.status(200).send({ msg: "RF IDs", data: result });
  })
);
// Get a QR code by ID
QRRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
      const result = await QRServices.getById(id);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ msg: `No QR code found with ID ${id}` });
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);

// Get a QR code by QR ID
QRRouter.post(
  "/getById",
  expressAsyncHandler(async (req, res) => {
    const { qrId } = req.body;
    try {
      const result = await QRServices.getByQRId(qrId);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ msg: `No QR code found with QR ID ${qrId}` });
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);

// Get all QR codes
QRRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    try {
      const result = await QRServices.getAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);

// Delete a QR code by ID
QRRouter.delete(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
      const result = await QRServices.deleteById(id);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ msg: `No QR code found with ID ${id}` });
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);

// Delete all QR codes
QRRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    try {
      const result = await QRServices.deleteAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);
async function processData(uploadedBy, data) {
  let count = 0;
  // Find the last increment
  const lastIncrement = await QRModel.findOne().sort({ _id: -1 });
  if (lastIncrement) {
    count = lastIncrement.autoIncrement + 1;
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const processedData = data.slice(1).map(async (row) => {
      if (row.length === 0 || !row[0]) {
        // Skip empty lines
        return null;
      }
      // Check if the qrId already exists in the collection
      const existingEntry = await QRModel.findOne({ qrId: row[0] });
      if (existingEntry) {
        // Skip if entry already exists
        return null;
      }
      const newData = {
        uploadedBy,
        qrId: row[0],
        vehicleRegNumber: null,
        vehicleModal: null,
        vehiclePic: null,
        vehicleColor: null,
        path: null,
        type: "RF",
        autoIncrement: count,
      };
      count++; // Increment autoIncrement
      return newData;
    });
    const filteredData = (await Promise.all(processedData)).filter(
      (entry) => entry !== null
    );
    var result;
    if (filteredData.length > 0) {
     result = await QRModel.insertMany(filteredData);
    }
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error;
  } finally {
    session.endSession();
  }
  return result;
}

module.exports = QRRouter;
