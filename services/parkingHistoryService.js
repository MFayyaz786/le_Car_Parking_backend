const ParkingHistoryModel = require("../models/parkingHisotryModel");
const QRModel = require("../models/QRModel");
const mongoose = require("mongoose");
const parkingHistoryModel = require("../models/parkingHisotryModel");
const QRServices = require("./QRServices");
const calculateParkingFee = require("../utils/calculateParkingFee");
const moment = require("moment");
const userServices = require("./userServices");
const userModel = require("../models/userModel");
const siteModel = require("../models/siteModel");
const siteServices = require("./siteServices");
const boothServices = require("./boothServices");
const { isFloat64Array } = require("util/types");
const parkingHistoryServices = {
  checkIn: async (
    qrId,
    vehicleRegNumber,
    userId,
    vehicleType,
    parkingFee,
    site,
    checkInTime
  ) => {
    // const checkInTime = new Date(
    //   Date.UTC(
    //     new Date().getUTCFullYear(),
    //     new Date().getUTCMonth(),
    //     new Date().getUTCDate(),
    //     new Date().getUTCHours(),
    //     new Date().getUTCMinutes(),
    //     new Date().getUTCSeconds()
    //   )
    // );

    // console.log(checkInTime.toISOString());
     const now = new Date();
    //.toLocaleString();
    // const newCheckInTime=moment(checkInTime, "MM-DD-YYYY, h:mm:ss A").format(
    //   "YYYY-MM-DD, h:mm:ss A"
    // );
    const createdDate = moment(now, "MM-DD-YYYY, h:mm:ss A").format(
      "YYYY-MM-DD"
    );
    // let createdDate = new Date();
    // createdDate = createdDate.setUTCHours(0, 0, 0, 0);
    // createdDate = new Date(createdDate).toISOString();
    const parkingHistory = new ParkingHistoryModel({
      QR: mongoose.Types.ObjectId(qrId),
      vehicleRegNumber,
      checkIn: true,
      checkout: false,
      checkInTime,
      createdDate: createdDate,
      checkInBy: mongoose.Types.ObjectId(userId),
      site: mongoose.Types.ObjectId(site),
      vehicleType: mongoose.Types.ObjectId(vehicleType),
      checkInMode: "online",
      parkingFee,
    });
    const result = parkingHistory.save();
    if (result) {
      await QRModel.findOneAndUpdate(
        { _id: qrId },
        { isAvailable: false },
        { new: true }
      );
    }
    return result;
  },
  bulkCheckIn:async(body)=>{
const session = await mongoose.startSession();
let parkHistory = [];
let commitTime;

try {
  session.startTransaction();

  for (let i = 0; i < body.length; i++) {
    if (
      !body[i].qrId ||
      !body[i].checkInTime ||
      !body[i].vehicleRegNumber ||
      !body[i].userId ||
      !body[i].vehicleType ||
      body[i].parkingFee === undefined ||
      body[i].parkingFee === null
    ) {
      // Skip this iteration and continue with the next one
      console.log("Skipping invalid data:", body[i]);
      continue;
    }

    let qr = await QRModel.findOne({ qrId: body[i].qrId });

    // Check if the QR code exists
    if (!qr) {
      // Skip this iteration and continue with the next one
      console.log("QR code not found for data:", body[i]);
      continue;
    }

        const checkInTime = body[i].checkInTime;
        const checkInBy = body[i].userId;
        console.log("checkInBy: ", checkInBy);
        const vehicleType = body[i].vehicleType;
        const parkingFee = body[i].parkingFee;
        const boothSite = await userServices.getSingle(checkInBy);
        console.log("boothSite: ", boothSite);
        //let createdDate=body[i].createdDate;
       // const now = new Date().toLocaleString();
        const createdDate = moment(checkInTime).format("YYYY-MM-DD");
    const parkingHistory = new ParkingHistoryModel({
          QR: mongoose.Types.ObjectId(qr._id),
          vehicleRegNumber: body[i].vehicleRegNumber,
          checkIn: true,
          checkout: false,
          checkInTime,
          createdDate,
          checkInBy: mongoose.Types.ObjectId(checkInBy),
          site: mongoose.Types.ObjectId(boothSite.site._id),
          vehicleType: mongoose.Types.ObjectId(vehicleType),
          checkInMode: "offline",
          parkingFee: parkingFee, 
   });

    let history = await parkingHistory.save();
    
    let qrUpdate = await QRModel.findOneAndUpdate(
      { _id: history.QR },
      { isAvailable: false },
      { new: true }
      );
     parkHistory.push(history);
  }

  await session.commitTransaction();
   commitTime = moment(new Date()).format("YYYY-MM-DDTHH:mm:ss");
} catch (error) {
  // Abort the transaction if any operation fails
  await session.abortTransaction();
  console.error("Transaction aborted. Error: ", error);
  throw error; // rethrow the error to the caller
} finally {
  // End the session
  session.endSession();
}

return { parkHistory, commitTime };

  },
  // bulkCheckIn: async (body) => {
  //   const session = await mongoose.startSession();
  //   let parkHistory = [];
  //   try {
  //     session.startTransaction();
  //     for (var i = 0; i < body.length; i++) {
  //       if (
  //         !body[i].qrId ||
  //         !body[i].checkInTime ||
  //         !body[i].vehicleRegNumber ||
  //         !body[i].userId ||
  //         !body[i].vehicleType ||
  //         body[i].parkingFee === undefined ||
  //         body[i].parkingFee === null
  //       ) {
  //         throw new Error("The body parameter cannot be null or undefined");
  //       }
  //       let qr = await QRModel.findOne({ qrId: body[i].qrId });
  //       const checkInTime = body[i].checkInTime;
  //       const checkInBy = body[i].userId;
  //       console.log("checkInBy: ", checkInBy);
  //       const vehicleType = body[i].vehicleType;
  //       const parkingFee = body[i].parkingFee;
  //       const boothSite = await userServices.getSingle(checkInBy);
  //       console.log("boothSite: ", boothSite);
  //       //let createdDate=body[i].createdDate;
  //       const now = new Date().toLocaleString();
  //       const createdDate = moment(checkInTime).format("YYYY-MM-DD");
  //       const parkingHistory = new ParkingHistoryModel({
  //         QR: mongoose.Types.ObjectId(qr._id),
  //         vehicleRegNumber: body[i].vehicleRegNumber,
  //         checkIn: true,
  //         checkout: false,
  //         checkInTime,
  //         createdDate,
  //         checkInBy: mongoose.Types.ObjectId(checkInBy),
  //         site: mongoose.Types.ObjectId(boothSite.site._id),
  //         vehicleType: mongoose.Types.ObjectId(vehicleType),
  //         checkInMode: "offline",
  //         parkingFee: parkingFee,
  //       });
  //       const history = await parkingHistory.save();
  //       let qrUpdate = await QRModel.findOneAndUpdate(
  //         { _id: history.QR },
  //         { isAvailable: false },
  //         { new: true }
  //       );

  //       parkHistory.push(history);
  //     }
  //     await session.commitTransaction();
  //     commitTime = new Date();
  //     return { parkHistory, commitTime };
  //   } catch (error) {
  //     // Abort the transaction if any operation fails
  //     await session.abortTransaction();
  //     console.error("Transaction aborted. Error: ", error);
  //     throw error; // rethrow the error to the caller
  //   } finally {
  //     // End the session
  //     session.endSession();
  //   }
  // },
 bulkCheckOut : async (body) => {
  const session = await mongoose.startSession();
  let parkHistory = [];
  try {
    session.startTransaction();
    for (var i = 0; i < body.length; i++) {
      if (
        !body[i].qrId ||
        !body[i].checkOutTime ||
        !body[i].checkOutBy ||
        body[i].parkingFee === undefined ||
        body[i].parkingFee === null
      ) {
        // Skip this iteration and continue with the next one
        console.log("Skipping invalid data:", body[i]);
        continue;
      }

      const qr = await QRModel.findOne({ qrId: body[i].qrId });

      if (!qr) {
        // Skip this iteration and continue with the next one
        console.log("QR code not found for data:", body[i]);
        continue;
      }

      const checkOutTime = body[i].checkOutTime;
      const checkOutBy = body[i].checkOutBy;
      const parkingFee = body[i].parkingFee;
      const parkingHistoryLog = await ParkingHistoryModel.findOne({
        QR: qr._id,
        checkIn: true,
        checkout: false,
      }).sort("-createdAt");

      if (!parkingHistoryLog) {
        // Skip this iteration and continue with the next one
        console.log(`Unable to find check-in record for QR code with ID ${body[i].qrId}`);
        continue;
      }

      // Add the incoming parking fee to the current parking fee
      const existingParkingFee = parkingHistoryLog.parkingFee || 0;
      const updatedParkingFee = existingParkingFee + parkingFee;
      const parkingHistory = await ParkingHistoryModel.findOneAndUpdate(
        {
          QR: mongoose.Types.ObjectId(qr._id),
          checkIn: true,
          checkout: false,
        },
        {
          checkIn: false,
          checkout: true,
          checkIn: false,
          checkOutTime,
          checkOutBy: mongoose.Types.ObjectId(checkOutBy),
          checkOutMode: "offline",
          parkingFee: updatedParkingFee,
        },
        { new: true }
      );

      await QRModel.findOneAndUpdate(
        { _id: parkingHistory.QR },
        { isAvailable: true },
        { new: true }
      );

      parkHistory.push(parkingHistory);
    }

    await session.commitTransaction();
    commitTime = moment(new Date()).format("YYYY-MM-DDTHH:mm:ss");
  } catch (error) {
    // Abort the transaction if any operation fails
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error; // rethrow the error to the caller
  } finally {
    // End the session
    session.endSession();
  }

  return { parkHistory, commitTime };
},

  // bulkCheckOut: async (body) => {
  //   const session = await mongoose.startSession();
  //   let parkHistory = [];
  //   try {
  //     session.startTransaction();
  //     for (var i = 0; i < body.length; i++) {
  //       if (
  //         !body[i].qrId ||
  //         !body[i].checkOutTime ||
  //         !body[i].checkOutBy ||
  //        !body[i].parkingFee
  //       ) {
  //         throw new Error("The body parameter cannot be null or undefined.");
  //       }
  //       const checkOutTime = body[i].checkOutTime;
  //       const checkOutBy = body[i].checkOutBy;
  //       const parkingFee = body[i].parkingFee;
  //       const qr = await QRModel.findOne({ qrId: body[i].qrId });
  //       const parkingHistoryLog = await ParkingHistoryModel.findOne({
  //         QR: qr._id,
  //         checkIn: true,
  //         checkout: false,
  //       }).sort("-createdAt");

  //       if (!parkingHistoryLog) {
  //         throw new Error(
  //           `Unable to find check-in record for QR code with ID ${body[i].qrId}`
  //         );
  //       }
  //       // Add the incoming parking fee to the current parking fee
  //       const existingParkingFee = parkingHistoryLog.parkingFee || 0;
  //       const updatedParkingFee = existingParkingFee + parkingFee;
  //       const parkingHistory = await ParkingHistoryModel.findOneAndUpdate(
  //         {
  //           QR: mongoose.Types.ObjectId(qr._id),
  //           checkIn: true,
  //           checkout: false,
  //         },
  //         {
  //           checkIn: false,
  //           checkout: true,
  //           checkIn: false,
  //           checkOutTime,
  //           checkOutBy: mongoose.Types.ObjectId(checkOutBy),
  //           checkOutMode: "offline",
  //           parkingFee: updatedParkingFee,
  //         },
  //         { new: true }
  //       );
  //       await QRModel.findOneAndUpdate(
  //         { _id: parkingHistory.QR },
  //         { isAvailable: true },
  //         { new: true }
  //       );
  //       parkHistory.push(parkingHistory);
  //     }
  //     await session.commitTransaction();
  //     commitTime = new Date();
  //     return { parkHistory, commitTime };
  //   } catch (error) {
  //     // Abort the transaction if any operation fails
  //     await session.abortTransaction();
  //     console.error("Transaction aborted. Error: ", error);
  //     throw error; // rethrow the error to the caller
  //   } finally {
  //     // End the session
  //     session.endSession();
  //   }
  // },

  parked: async (vehicleRegNumber) => {
    const isPark = await ParkingHistoryModel.findOne({
      vehicleRegNumber: vehicleRegNumber,
      checkIn: true,
    });
    return isPark;
  },
  isCheckout: async (qrId) => {
    const isPark = await ParkingHistoryModel.findOne({
      QR: qrId,
      checkout: false,
    });
    return isPark;
  },
  history: async (userId) => {
    let checkInHistory = await parkingHistoryModel
      .find({
        checkInBy: { $in: userId },
      })
      .populate({
        path: "vehicleType",
        select: { name: 1, _id: 1 },
      })
      .populate({
        path: "checkInBy",
        select: { firstName: 1, lastName: 1, _id: 1 },
      })
      .populate({
        path: "checkOutBy",
        select: { firstName: 1, lastName: 1, _id: 1 },
      })
      .sort({ createdAt: -1 });

    let checkOutHistory = await parkingHistoryModel
      .find({
        checkOutBy: { $in: userId },
      })
      .populate({
        path: "vehicleType",
        select: { name: 1, _id: 1 },
      })
      .populate({
        path: "checkInBy",
        select: { firstName: 1, lastName: 1, _id: 1 },
      })
      .populate({
        path: "checkOutBy",
        select: { firstName: 1, lastName: 1, _id: 1 },
      })
      .sort({ createdAt: -1 });

    return { checkInHistory, checkOutHistory };
  },
  checkinCheckoutHistory: async () => {
    let checkIns = await parkingHistoryModel
      .find({
        checkIn: { $eq: true },
      })
      .populate({
        path: "vehicleType",
        select: { name: 1, _id: 1 },
      })
      .populate({
        path: "checkInBy",
        select: { firstName: 1, lastName: 1, _id: 1 },
      })
      .populate({
        path: "checkOutBy",
        select: { firstName: 1, lastName: 1, _id: 1 },
      })
      .sort({ createdAt: -1 });

    let checkOuts = await parkingHistoryModel
      .find({
        checkout: { $eq: true },
      })
      .populate({
        path: "vehicleType",
        select: { name: 1, _id: 1 },
      })
      .populate({
        path: "checkInBy",
        select: { firstName: 1, lastName: 1, _id: 1 },
      })
      .populate({
        path: "checkOutBy",
        select: { firstName: 1, lastName: 1, _id: 1 },
      })
      .sort({ createdAt: -1 });

    return { checkIns, checkOuts };
  },
  isQr: async (qrId) => {
    const qrID = await parkingHistoryModel.findOne({
      QR: qrId,
      checkout: false,
      checkIn: true,
      isAvailable: false,
    });
    return qrID;
  },
  checkOut: async (qrId, checkOutBy, parkingFee, site, checkOutTime) => {
    //let checkOutTime = new Date().toLocaleString();
    // const checkOutTime = new Date(
    //   Date.UTC(
    //     new Date().getUTCFullYear(),
    //     new Date().getUTCMonth(),
    //     new Date().getUTCDate(),
    //     new Date().getUTCHours(),
    //     new Date().getUTCMinutes(),
    //     new Date().getUTCSeconds()
    //   )
    // );
    //  checkOutTime = moment(checkOutTime, "MM-DD-YYYY, h:mm:ss A").format(
    //    "YYYY-MM-DD, h:mm:ss A"
    //  );
    const parkingHistoryLog = await ParkingHistoryModel.findOne({
      QR: qrId,
      checkIn: true,
      checkout: false,
    }).sort("-createdAt");

    if (!parkingHistoryLog) {
      throw new Error(
        `Unable to find check-in record for QR code with ID ${qrId}`
      );
    }

    // Add the incoming parking fee to the current parking fee
    const existingParkingFee = parkingHistoryLog.parkingFee || 0;
    const updatedParkingFee = existingParkingFee + parkingFee;
    const parkingHistory = await ParkingHistoryModel.findOneAndUpdate(
      {
        QR: qrId,
        checkIn: true,
        checkout: false,
      },
      {
        checkIn: false,
        checkout: true,
        checkOutTime,
        checkOutBy: mongoose.Types.ObjectId(checkOutBy),
        checkOutMode: "online",
        parkingFee: updatedParkingFee,
      },
      { new: true }
    )
      .lean()
      .sort("-createdAt");
    console.log("parking", parkingHistory);
    if (!parkingHistory) {
      throw new Error(
        `Unable to find check-in record for QR code with ID ${qrId}`
      );
    }
    if (parkingHistory) {
      if (site.onCheckInFee && site.isDynamicFee) {
        parkingHistory.parkingFee = parkingFee;
        console.log("existingParkingFee: ", parkingFee);
      }
      await QRModel.findOneAndUpdate({ _id: qrId }, { isAvailable: true });
    }
    return parkingHistory;
  },
  getCheckIns: async () => {
    const count = await ParkingHistoryModel.countDocuments({
      checkIn: true,
    }).sort({ createdAt: -1 });

    return count;
  },
  getCheckOuts: async () => {
    const count = await ParkingHistoryModel.countDocuments({
      checkout: true,
    }).sort({ createdAt: -1 });
    return count;
  },
  getAll: async (userId, fromDate, toDate, type) => {
    // fromDate = moment(fromDate, "M/D/YYYY").format(
    //   "YYYY-MM-DD"
    // );
    // toDate = moment(toDate, "M/D/YYYY").format(
    //   "YYYY-MM-DD"
    // );
    const query = generateQuery(userId, fromDate, toDate, type);
    console.log("history query", query);
    const histories = await ParkingHistoryModel.aggregate([
      {
        $project: {
          checkInTime: 1,
          checkOutTime: 1,
          checkInTimeDate: {
            $toDate: "$checkInTime",
          },
          checkOutTimeDate: {
            $toDate: "$checkOutTime",
          },
          QR: 1,
          vehicleRegNumber: 1,
          checkIn: 1,
          checkout: 1,
          checkInBy: 1,
          checkOutBy: 1,
          site: 1,
          createdDate: 1,
          parkingFee: 1,
          checkInMode: 1,
          checkOutMode: 1,
          createdAt: 1,
          updatedAt: 1,
          vehicleType: 1,
          __v: 1,
        },
      },
      {
        $match: query,
        //'checkOutBy': new mongoose.Types.ObjectId(userId)
      },
      {
        $lookup: {
          from: "users",
          localField: "checkInBy",
          foreignField: "_id",
          as: "checkInBy",
        },
      },
      {
        $unwind: {
          path: "$checkInBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "booths", // Replace with the actual name of the 'boothId' collection
          localField: "checkInBy.boothId",
          foreignField: "_id",
          as: "checkInBy.boothId",
        },
      },
      {
        $unwind: {
          path: "$checkInBy.boothId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "checkOutBy",
          foreignField: "_id",
          as: "checkOutBy",
        },
      },
      {
        $unwind: {
          path: "$checkOutBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "vehicleType",
          foreignField: "_id",
          as: "vehicleType",
        },
      },
      {
        $unwind: {
          path: "$vehicleType",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "booths", // Replace with the actual name of the 'boothId' collection
          localField: "checkOutBy.boothId",
          foreignField: "_id",
          as: "checkOutBy.boothId",
        },
      },
      {
        $unwind: {
          path: "$checkOutBy.boothId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    console.log("historiesLength", histories.length);
    const siteUser = await userModel
      .findOne({ _id: userId })
      .populate({ path: "site" });
    let totalQuery;
    if (siteUser.site.onCheckInFee && !siteUser.site.isDynamicFee) {
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      totalQuery = {
        checkInBy: new mongoose.Types.ObjectId(userId),
        checkInTime: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      };
    } else if (!siteUser.site.onCheckInFee && !siteUser.site.isDynamicFee) {
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      totalQuery = {
        checkOutBy: new mongoose.Types.ObjectId(userId),
        checkOutTime: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
    } else if (siteUser.site.onCheckInFee && siteUser.site.isDynamicFee) {
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      totalQuery = {
        $or: [
          {
            $and: [
              { checkInBy: new mongoose.Types.ObjectId(userId) },
              {
                checkInTime: {
                  $gte: new Date(fromDate),
                  $lte: new Date(toDate),
                },
              },
            ],
          },
          {
            $and: [
              { checkOutBy: new mongoose.Types.ObjectId(userId) },
              {
                checkOutTime: {
                  $gte: new Date(fromDate),
                  $lte: new Date(toDate),
                },
              },
            ],
          },
        ],
      };
    } else {
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      totalQuery = {
        checkOutBy: new mongoose.Types.ObjectId(userId),
        checkOutTime: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
    }

    console.log("totalQuery", totalQuery);
    let total = await parkingHistoryModel
      .aggregate([
        {
          $project: {
            checkInTime: {
              $toDate: "$checkInTime",
            },
            checkOutTime: {
              $toDate: "$checkOutTime",
            },
            QR: 1,
            vehicleRegNumber: 1,
            checkIn: 1,
            checkout: 1,
            checkInBy: 1,
            checkOutBy: 1,
            site: 1,
            createdDate: 1,
            parkingFee: 1,
            checkInMode: 1,
            checkOutMode: 1,
            createdAt: 1,
            updatedAt: 1,
            vehicleType: 1,
            __v: 1,
          },
        },
        {
          $match: totalQuery, // Your filter conditions go here
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
    console.log("total", total);
    total = total.length > 0 ? total[0].count : 0;
    //const total = await parkingHistoryModel.countDocuments(totalQuery);
    // const parkToTime = new Date(toDate);
    // parkToTime.setUTCHours(23, 55, 0, 0);
    // console.log("parkToTime: ", parkToTime);
    const parked = await parkingHistoryModel.countDocuments({
      checkInBy: userId,
      checkIn: true,
      checkout: false,
      createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    });
    console.log("parked", parked);
    const existToDate = new Date(toDate);
    existToDate.setUTCHours(23, 55, 0, 0);
    let exit = await parkingHistoryModel
      .aggregate([
        {
          $project: {
            checkInTime: {
              $toDate: "$checkInTime",
            },
            checkOutTime: {
              $toDate: "$checkOutTime",
            },
            QR: 1,
            vehicleRegNumber: 1,
            checkIn: 1,
            checkout: 1,
            checkInBy: 1,
            checkOutBy: 1,
            site: 1,
            createdDate: 1,
            parkingFee: 1,
            checkInMode: 1,
            checkOutMode: 1,
            createdAt: 1,
            updatedAt: 1,
            vehicleType: 1,
            __v: 1,
          },
        },
        {
          $match: {
            checkIn: false,
            checkout: true,
            checkOutBy: new mongoose.Types.ObjectId(userId),
            checkOutTime: {
              $gte: new Date(fromDate),
              $lte: new Date(existToDate),
            },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
    exit = exit.length > 0 ? exit[0].count : 0;
    console.log("exit: ", exit);
    let statesQuery;
    //if (type==='1'){
    if (siteUser.site.onCheckInFee && !siteUser.site.isDynamicFee) {
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      statesQuery = {
        checkInBy: new mongoose.Types.ObjectId(userId),
        checkInTime: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
    } else if (!siteUser.site.onCheckInFee && !siteUser.site.isDynamicFee) {
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      statesQuery = {
        checkOutBy: new mongoose.Types.ObjectId(userId),
        checkOutTime: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
    } else if (siteUser.site.onCheckInFee && siteUser.site.isDynamicFee) {
      const tODate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      statesQuery = {
        $or: [
          {
            $and: [
              { checkInBy: new mongoose.Types.ObjectId(userId) },
              {
                checkInTime: {
                  $gte: new Date(fromDate),
                  $lte: new Date(toDate),
                },
              },
            ],
          },
          {
            $and: [
              { checkOutBy: new mongoose.Types.ObjectId(userId) },
              {
                checkOutTime: {
                  $gte: new Date(fromDate),
                  $lte: new Date(toDate),
                },
              },
            ],
          },
        ],
      };
    } else if (!siteUser.site.onCheckInFee && siteUser.site.isDynamicFee) {
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      statesQuery = {
        checkOutBy: new mongoose.Types.ObjectId(userId),
        checkOutTime: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
    }
    //total:total,parked:parked,exit:exit,
    console.log("statesQuery: ", statesQuery);
    let totalCategoryWise = await parkingHistoryModel.aggregate([
      {
        $project: {
          checkInTime: {
            $toDate: "$checkInTime",
          },
          checkOutTime: {
            $toDate: "$checkOutTime",
          },
          QR: 1,
          vehicleRegNumber: 1,
          checkIn: 1,
          checkout: 1,
          checkInBy: 1,
          checkOutBy: 1,
          site: 1,
          createdDate: 1,
          parkingFee: 1,
          checkInMode: 1,
          checkOutMode: 1,
          createdAt: 1,
          updatedAt: 1,
          vehicleType: 1,
          __v: 1,
        },
      },
      {
        $match: statesQuery,
      },
      {
        $lookup: {
          from: "categories",
          localField: "vehicleType",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$category.name",
          totalVehicle: {
            $sum: 1,
          },
          totalParkingFee: {
            $sum: "$parkingFee",
          },
        },
      },
      {
        $group: {
          _id: null,
          totalParkingFee: {
            $sum: "$totalParkingFee",
          },
          data: {
            $push: {
              category: "$_id",
              totalFee: "$totalParkingFee",
              totalVehicle: "$totalVehicle",
            },
          },
        },
      },
    ]);
    let totalParkingFee;
    let state;
    if (totalCategoryWise.length !== 0) {
      totalCategoryWise = totalCategoryWise[0];
      totalParkingFee = totalCategoryWise.totalParkingFee;
      state = totalCategoryWise.data;
    } else {
      totalParkingFee = 0;
      state = [];
    }
    return {
      total: total,
      parked: parked,
      exit: exit,
      totalParkingFee: totalParkingFee,
      state: state,
      list: histories,
    };
  },
  dashboardGetAll: async (fromDate, toDate) => {
    const histories = await ParkingHistoryModel.aggregate([
      {
        $project: {
          checkInTime: {
            $toDate: "$checkInTime",
          },
          checkOutTime: {
            $toDate: "$checkOutTime",
          },
          QR: 1,
          vehicleRegNumber: 1,
          checkIn: 1,
          checkout: 1,
          checkInBy: 1,
          checkOutBy: 1,
          site: 1,
          createdDate: 1,
          parkingFee: 1,
          checkInMode: 1,
          checkOutMode: 1,
          createdAt: 1,
          updatedAt: 1,
          vehicleType: 1,
          __v: 1,
        },
      },
      {
        $match: {
          createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "vehicleType",
          foreignField: "_id",
          as: "vehicleType",
        },
      },
      {
        $unwind: {
          path: "$vehicleType",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "checkInBy",
          foreignField: "_id",
          as: "checkInBy",
        },
      },
      {
        $unwind: {
          path: "$checkInBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "booths",
          localField: "checkInBy.boothId",
          foreignField: "_id",
          as: "checkInBy.boothId",
        },
      },
      {
        $unwind: {
          path: "$checkInBy.boothId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sites",
          localField: "checkInBy.boothId.site",
          foreignField: "_id",
          as: "checkInBy.boothId.site",
        },
      },
      {
        $unwind: {
          path: "$checkInBy.boothId.site",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "checkOutBy",
          foreignField: "_id",
          as: "checkOutBy",
        },
      },
      {
        $unwind: {
          path: "$checkOutBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "booths",
          localField: "checkOutBy.boothId",
          foreignField: "_id",
          as: "checkOutBy.boothId",
        },
      },
      {
        $unwind: {
          path: "$checkOutBy.boothId",
          preserveNullAndEmptyArrays: true,
        },
      },
      //   {
      //     $project: {
      //       _id: 1,
      //       createdAt: 1,
      //       vehicleType: "$vehicleType.name",
      //       checkInBy: {
      //         firstName: "$checkInBy.firstName",
      //         lastName: "$checkInBy.lastName",
      //         boothId: "$checkInBy.boothId.name",
      //         site: "$checkInBy.boothId.site",
      //       },
      //       checkOutBy: {
      //         firstName: "$checkOutBy.firstName",
      //         lastName: "$checkOutBy.lastName",
      //         boothId: "$checkOutBy.boothId.name",
      //       },
      //     },
      //   },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    console.log(histories);
    return histories;
  },
  summary: async (fromDate, toDate, site, booth) => {
    const query = await generateCashSummaryQuery(fromDate, toDate, site, booth);
    console.log("query", query);
    const pipeline = [
      {
        $project: {
          checkInTime: {
            $toDate: "$checkInTime",
          },
          checkOutTime: {
            $toDate: "$checkOutTime",
          },
          QR: 1,
          vehicleRegNumber: 1,
          checkIn: 1,
          checkout: 1,
          checkInBy: 1,
          checkOutBy: 1,
          site: 1,
          createdDate: 1,
          parkingFee: 1,
          checkInMode: 1,
          checkOutMode: 1,
          createdAt: 1,
          updatedAt: 1,
          vehicleType: 1,
          __v: 1,
        },
      },
      {
        $match: query, // Your filter conditions go here
      },
      {
        $lookup: {
          from: "categories", // Replace with the actual name of the 'vehicleType' collection
          localField: "vehicleType",
          foreignField: "_id",
          as: "vehicleType",
        },
      },
      {
        $unwind: {
          path: "$vehicleType",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users", // Replace with the actual name of the 'checkInBy' collection
          localField: "checkInBy",
          foreignField: "_id",
          as: "checkInBy",
        },
      },
      {
        $unwind: {
          path: "$checkInBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "booths", // Replace with the actual name of the 'boothId' collection
          localField: "checkInBy.boothId",
          foreignField: "_id",
          as: "checkInBy.boothId",
        },
      },
      {
        $unwind: {
          path: "$checkInBy.boothId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sites", // Replace with the actual name of the 'site' collection
          localField: "site",
          foreignField: "_id",
          as: "site",
        },
      },
      {
        $unwind: {
          path: "$site",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users", // Replace with the actual name of the 'checkOutBy' collection
          localField: "checkOutBy",
          foreignField: "_id",
          as: "checkOutBy",
        },
      },
      {
        $unwind: {
          path: "$checkOutBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "booths", // Replace with the actual name of the 'boothId' collection
          localField: "checkOutBy.boothId",
          foreignField: "_id",
          as: "checkOutBy.boothId",
        },
      },
      {
        $unwind: {
          path: "$checkOutBy.boothId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ];

    const histories = await ParkingHistoryModel.aggregate(pipeline);
    if (histories.length !== 0) {
      let totalCollection = 0;
      histories.forEach((item) => {
        totalCollection = totalCollection + item.parkingFee;
      });
      histories.push({ totalParkingFee: totalCollection });
    }
    return histories;
  },
  state: async (fromDate, toDate) => {
    const result = await ParkingHistoryModel.aggregate([
      {
        $match: {
          createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalCheckIns: { $sum: { $cond: ["$checkIn", 1, 0] } },
          totalCheckOuts: { $sum: { $cond: ["$checkout", 1, 0] } },
        },
      },
    ]);
    return result;
    //[{ total: total, totalCheckIns: parked, totalCheckOuts: exit }];
  },
  checkInCheckOutState: async (fromDate, toDate) => {
    const result = await ParkingHistoryModel.aggregate([
      {
        $match: {
          createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalCheckIns: { $sum: { $cond: ["$checkIn", 1, 0] } },
          totalCheckOuts: { $sum: { $cond: ["$checkout", 1, 0] } },
        },
      },
    ]);
    return result[0];
  },
  boothState: async (fromDate, toDate) => {
    console.log(new Date(fromDate), new Date(toDate));
    const checkin = await parkingHistoryModel.aggregate([
      {
        $match: {
          createdDate: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          },
          checkIn: true,
          checkout: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "checkInBy",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $unwind: {
          path: "$users",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "booths",
          localField: "users.boothId",
          foreignField: "_id",
          as: "booth",
        },
      },
      {
        $unwind: {
          path: "$booth",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "vehicleType",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: ["$category.name", "$booth.name"],
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          category: {
            $arrayElemAt: ["$_id", 0],
          },
          booth: {
            $arrayElemAt: ["$_id", 1],
          },
          count: 1,
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
    // aggregate([
    //   {
    //     $match: {
    //       createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    //       checkIn: true,
    //       checkout: false,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "checkInBy",
    //       foreignField: "_id",
    //       as: "users",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$users",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "booths",
    //       localField: "users.boothId",
    //       foreignField: "_id",
    //       as: "booth",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$booth",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "categories",
    //       localField: "vehicleType",
    //       foreignField: "_id",
    //       as: "category",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$category",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: ["$category.name", "$booth.name"],
    //       count: {
    //         $sum: 1,
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       category: {
    //         $arrayElemAt: ["$_id", 0],
    //       },
    //       booth: {
    //         $arrayElemAt: ["$_id", 1],
    //       },
    //       count: 1,
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //     },
    //   },
    // ]);

    const checkout = await parkingHistoryModel.aggregate([
      {
        $match: {
          createdDate: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          },
          checkIn: false,
          checkout: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "checkInBy",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $unwind: {
          path: "$users",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "booths",
          localField: "users.boothId",
          foreignField: "_id",
          as: "booth",
        },
      },
      {
        $unwind: {
          path: "$booth",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "vehicleType",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: ["$category.name", "$booth.name"],
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          category: {
            $arrayElemAt: ["$_id", 0],
          },
          booth: {
            $arrayElemAt: ["$_id", 1],
          },
          count: 1,
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
    // aggregate([
    //   {
    //     $match: {
    //       createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    //       checkIn: true,
    //       checkout: false,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "checkInBy",
    //       foreignField: "_id",
    //       as: "users",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$users",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "booths",
    //       localField: "users.boothId",
    //       foreignField: "_id",
    //       as: "booth",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$booth",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "categories",
    //       localField: "vehicleType",
    //       foreignField: "_id",
    //       as: "category",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$category",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: ["$category.name", "$booth.name"],
    //       count: {
    //         $sum: 1,
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       category: {
    //         $arrayElemAt: ["$_id", 0],
    //       },
    //       booth: {
    //         $arrayElemAt: ["$_id", 1],
    //       },
    //       count: 1,
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //     },
    //   },
    // ]);

    return { checkin, checkout };
  },
  stateByCategory: async (fromDate, toDate) => {
    const state = await parkingHistoryModel.aggregate([
      {
        $match: {
          createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "vehicleType",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $unwind: {
          path: "$result",
        },
      },
      {
        $group: {
          _id: "$result.name",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$count",
          },
          state: {
            $push: {
              vehicleType: "$_id",
              count: "$count",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          state: 1,
        },
      },
    ]);
    return state;
  },
  userCheckIns: async (checkInBy) => {
    const list = await ParkingHistoryModel.aggregate([
      {
        $match: {
          checkInBy: mongoose.Types.ObjectId(checkInBy),
        },
      },
      {
        $lookup: {
          from: "qrs",
          localField: "QR",
          foreignField: "_id",
          as: "QR",
        },
      },
      {
        $unwind: {
          path: "$QR",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    return list;
  },
};
function generateQuery(userId, fromDate, toDate, type) {
  console.log(userId, fromDate, toDate, type);
  let query;
  switch (type) {
    case "1":
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      console.log("toDate: ", toDate);
      query = {
        checkInBy: new mongoose.Types.ObjectId(userId),
        // createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        checkInTimeDate: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
      break;
    case "2":
       toDate = new Date(toDate);
       toDate.setUTCHours(23, 55, 0, 0);
      query = {
        checkOutBy: new mongoose.Types.ObjectId(userId),
        checkOutTimeDate: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
      break;
    default:
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      query = {
        $or: [
          {
            $and: [
              { checkInBy: new mongoose.Types.ObjectId(userId) },
              {
                checkInTimeDate: {
                  $gte: new Date(fromDate),
                  $lte: new Date(toDate),
                },
              },
            ],
          },
          {
            $and: [
              { checkOutBy: new mongoose.Types.ObjectId(userId) },
              {
                checkOutTimeDate: {
                  $gte: new Date(fromDate),
                  $lte: new Date(toDate),
                },
              },
            ],
          },
        ],
      };
      //  {
      //   $or: [{ checkInBy: userId }, { checkOutBy: userId }],
      //   checkOutTime: { $gte: checkoutFromDate, $lte: checkoutToDate },
      //   $or: [
      //     { createdDate: { $gte: new Date(fromDate), $lte: new Date(toDate) } },
      //     { checkOutTime: { $gte: checkoutFromDate, $lte: checkoutToDate } },
      //   ],
      // };
      break;
  }

  return query;
}
const generateCashSummaryQuery = async (fromDate, toDate, site, booth) => {
  try{
  console.log(fromDate, toDate, site, "booth", booth);
  let query;
  if (site !== "null" && booth !== "null") {
    const boothUser = await userModel.findOne({ boothId: booth });
    console.log("boothUser: ", boothUser);
    if (!boothUser) {
      throw new Error("User does not exist against this booth!");
    }
    const siteDetails = await siteServices.getById(site);
    let onCheckInFee = {};
    if (siteDetails?.onCheckInFee) {
       toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      onCheckInFee = {
        checkInBy:boothUser._id,
        checkInTime: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      };
    } else {
        toDate = new Date(toDate);
        toDate.setUTCHours(23, 55, 0, 0);
      return {
        checkOutBy: boothUser._id,
        checkOutTime: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      };
    }

    query = {
      site:new mongoose.Types.ObjectId(site),
      ...onCheckInFee,
    };
  } else if (site !== "null" && booth === "null") {
    const siteDetails = await siteServices.getById(site);
    let onCheckInFee = {};
    if (siteDetails?.onCheckInFee) {
      toDate = new Date(toDate);
      toDate.setUTCHours(23, 55, 0, 0);
      onCheckInFee = {
        checkInTime: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      };
    } else {
        toDate = new Date(toDate);
        toDate.setUTCHours(23, 55, 0, 0);
      return { checkOutTime: {$gte: new Date(fromDate), $lte: new Date(toDate) }};
    }
    query = {
      site: new mongoose.Types.ObjectId(site),
      ...onCheckInFee,
    };
  } else if (site === "null" && booth !== "null") {
    const boothUser = await userModel.findOne({ boothId: booth });
        console.log("boothUser: ", boothUser);
    if (!boothUser) {
      throw new Error("User does not exist against this booth!");
    }
    const boothDetails = await boothServices.getById(booth);
    const siteDetails = await siteServices.getById(boothDetails?.site._id);
    let onCheckInFee = {};
    if (siteDetails?.onCheckInFee) {
       toDate = new Date(toDate);
       toDate.setUTCHours(23, 55, 0, 0);
      onCheckInFee = {
        checkInBy: boothUser._id,
        checkInTime: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      };
    } else {
         toDate = new Date(toDate);
         toDate.setUTCHours(23, 55, 0, 0);
      return {
        checkOutBy: boothUser._id,
        checkOutTime: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      };
    }
    query = {
      ...onCheckInFee,
    };
    console.log("query: ", query);
  } else {
   toDate = new Date(toDate);
   toDate.setUTCHours(23, 55, 0, 0);
    query = {
      $or:[
      {checkInTime: { $gte: new Date(fromDate), $lte: new Date(toDate) }},
      {checkOutTime: { $gte: new Date(fromDate), $lte: new Date(toDate) }}
      ]
    };
  }

  return query;
}catch(error){
  console.log("error: ", error);
}
};

module.exports = parkingHistoryServices;
