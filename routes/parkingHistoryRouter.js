const express = require("express");
const QRModel = require("../models/QRModel");
const parkingHistoryRouter = express.Router();
const parkingHistoryServices = require("../services/parkingHistoryService");
const calculateParkingFee = require("../utils/calculateParkingFee");
const userModel = require("../models/userModel");
const { default: mongoose } = require("mongoose");
const parkingHistoryModel = require("../models/parkingHisotryModel");
const userServices = require("../services/userServices");
const siteServices = require("../services/siteServices");
const siteCategoryModel = require("../models/siteCategoryModel");
//const { getUserSocket } = require("../utils/userSocketId");
parkingHistoryRouter.get("/all", async (req, res) => {
  try {
    const {userId, fromDate, toDate,type } = req.query;
    console.log("body: ", req.query);
    const histories = await parkingHistoryServices.getAll(userId,fromDate, toDate,type);
    res.json(histories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to get parking histories" });
  }
});
parkingHistoryRouter.get("/dashboard/all", async (req, res) => {
  try {
    const {fromDate, toDate } = req.query;
    const histories = await parkingHistoryServices.dashboardGetAll(fromDate, toDate);
    res.json(histories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to get parking histories" });
  }
});
parkingHistoryRouter.get("/summary", async (req, res) => {
    const { fromDate, toDate,booth,site } = req.query;
    if(!fromDate||!toDate){
      return res.status(400).send({msg:"Fields Missing!"})
    }
    try {
      const histories = await parkingHistoryServices.summary(
        fromDate,
        toDate,
        site,
        booth
      );
      res.status(200).send({ msg: "list", data: histories });
    } catch (error) { res.status(400).send({msg:error.message})}
});
// Route to check in a vehicle
parkingHistoryRouter.post("/checkin", async (req, res, next) => {
  try {
    const { qrId, vehicleRegNumber, userId, vehicleType,checkInTime } = req.body;
    console.log("body: ", req.body);
    if (!qrId || !vehicleRegNumber || !userId || !vehicleType||!checkInTime) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const boothSite = await userServices.getSingle(userId);
if (
  !boothSite ||
  boothSite.deleted ||
  boothSite.site.deleted ||
  boothSite.boothId.deleted
) {
  return res
    .status(400)
    .send({ msg: "This feature is unavailable for an inactive assistant." });
}
    let qr = await QRModel.findOne({ qrId: qrId });
    console.log("qr: ", qr);
    if (!qr) {
      return res.status(400).send({ msg: `QR code with ID ${qrId} not found` });
    }
    let parked = await parkingHistoryServices.parked(vehicleRegNumber);
    //const isQrUsed = await parkingHistoryServices.isQr(qr._id);
    if (qr.isAvailable===false) {
     return res.status(400).send({ msg: "This QR already used" });
    }
    if (parked) {
      return res.status(400).send({ msg: "This Vehicle already checkIn" });
    }

    // const boothSite=await userServices.getSingle(userId);
    const isVehicleTypeExist=await siteCategoryModel.findOne({site:boothSite.site._id,category:vehicleType});
    if(!isVehicleTypeExist){
      return res.status(400).send({msg:"This vehicle type not exist against requested site!"})
    }
    const site=await siteServices.getById(boothSite.site._id);
    let parkingFee;
    if(site && site.onCheckInFee===true){
     parkingFee = await calculateParkingFee(
      "checkIn",
       qr._id,
       site,
       vehicleType
     );
    }else{
      parkingFee=0
    }
    const parkingHistory = await parkingHistoryServices.checkIn(
      qr._id,
      vehicleRegNumber,
      userId,
      vehicleType,
      parkingFee,
      boothSite.site._id,
      checkInTime
    );
    return res.json(parkingHistory);
  } catch (err) {
    next(err);
  }
});
// Route to check out a vehicle
parkingHistoryRouter.post("/checkout", async (req, res, next) => {
  try {
    const { qrId, checkOutBy,checkOutTime } = req.body;
    console.log("body: ", req.body);
    let qr = await QRModel.findOne({ qrId: qrId });
    if (!qr) {
      return res.status(400).send({ msg: `QR code with ID ${qrId} not found` });
    }
    let checkout = await parkingHistoryServices.isCheckout(qr._id);
    if (!checkout){
      res.status(400).send({ msg: "Vehicle not found or already checked out" });
      return;
    }
    const checkInSite = await userServices.getSingle(checkout.checkInBy);
    const boothSite=await userServices.getSingle(checkOutBy);
    if (!Object.is(checkInSite.site._id.toString(), boothSite.site._id.toString())) {
      return res
        .status(400)
        .send({
          msg: "Check-in and check-out sites should be the same location for your reservation to proceed.",
        });
    }
    const site=await siteServices.getById(boothSite.site._id);
    const parkingFee = await calculateParkingFee(
      "checkout",
      qr._id,
      site,
      checkout.vehicleType,
      checkOutTime
    );
    const parkingHistory = await parkingHistoryServices.checkOut(
      qr._id,
      checkOutBy,
      parkingFee,
      site,
      checkOutTime
    );
    return res.json(parkingHistory);
  } catch (err) {
    next(err);
  }
});
parkingHistoryRouter.post("/bulkCheckin", async (req, res, next) => {
  try {
    // const { qrId, vehicleRegNumber, userId, vehicleType } = req.body;
    console.log(req.body);
    const parkingHistory = await parkingHistoryServices.bulkCheckIn(req.body);
    return res.json(parkingHistory);
  } catch (err) {
    next(err);
  }
});

parkingHistoryRouter.post("/bulkCheckOut", async (req, res, next) => {
  try {
    // const { qrId, vehicleRegNumber, userId, vehicleType } = req.body;
    const parkingHistory = await parkingHistoryServices.bulkCheckOut(req.body);
    return res.json(parkingHistory);
  } catch (err) {
    next(err);
  }
});
parkingHistoryRouter.get("/userHistory", async (req, res, next) => {
  try {
    const { userId } = req.query;
    const parkingHistory = await parkingHistoryServices.history(userId);
    // if (parkingHistory.length !== 0) {
    //   const io = req.app.get("socket");
    //   const user = getUserSocket(userId.toString());
    //   console.log(user);
    //   if (user?.socketId) {
    //     io.to(user.socketId).emit("history", parkingHistory, (error) => {
    //       if (error) {
    //         console.error("Error emitting message: ", error);
    //       } else {
    //         console.log("Message emitted successfully", parkingHistory);
    //       }
    //     });
    //   }
    // }
    res.json(parkingHistory);
  } catch (err) {
    next(err);
  }
});
parkingHistoryRouter.get("/checkinCheckoutHistory", async (req, res, next) => {
  try {
    const parkingHistory =
      await parkingHistoryServices.checkinCheckoutHistory();
    res.json(parkingHistory);
  } catch (err) {
    next(err);
  }
});
// Route to get the number of check-ins
parkingHistoryRouter.get("/checkins", async (req, res, next) => {
  try {
    const count = await parkingHistoryServices.getCheckIns();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});
// Route to get the number of check-outs
parkingHistoryRouter.get("/checkouts", async (req, res, next) => {
  try {
    const count = await parkingHistoryServices.getCheckOuts();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});
parkingHistoryRouter.get("/dashboard", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const histories = await parkingHistoryServices.state(fromDate, toDate);
    res.json(histories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to get parking histories" });
  }
});
parkingHistoryRouter.get("/checkInCheckOutState", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const histories = await parkingHistoryServices.checkInCheckOutState(
      fromDate,
      toDate
    );
    res.json(histories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to get parking histories" });
  }
});
parkingHistoryRouter.get("/boothState", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const histories = await parkingHistoryServices.boothState(fromDate, toDate);
    res.json(histories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to get parking histories" });
  }
});
parkingHistoryRouter.get("/stateByCategory", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const histories = await parkingHistoryServices.stateByCategory(
      fromDate,
      toDate
    );
    res.json(histories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to get parking histories" });
  }
});
parkingHistoryRouter.get("/userHistory?", async (req, res) => {});
module.exports = parkingHistoryRouter;
