const CategoryModel = require("../models/categoryModel");
const parkingHistoryModel = require("../models/parkingHisotryModel");
const siteCategoryModel = require("../models/siteCategoryModel");
const categoryServices = require("../services/CategoryServices");
module.exports = async function calculateParkingFee(
  type,
  qrId,
  site,
  vehicleType,
  checkOutTime
) {
  let parkingFee;
  if (type === "checkIn") {
    const vehicleTypeDoc = await siteCategoryModel.findOne({
      site: site._id,
      category: vehicleType,
    });
    parkingFee = vehicleTypeDoc.initialFee;
  } else {
    console.log("here");
    if (site.isDynamicFee && !site.onCheckInFee) {
      const history = await parkingHistoryModel.findOne({
        QR: qrId,
        checkIn: true,
        checkout: false,
      });
      console.log("history: ", history);
      const hours = await calculateHours(history.checkInTime, checkOutTime);
      console.log("site", site._id);
      const vehicleTypeDoc = await siteCategoryModel.findOne({
        site: site._id.toString(),
        category: vehicleType,
      });
      console.log("vehicleTypeDoc: ", vehicleTypeDoc);
      parkingFee = calculateFee(
        hours,
        vehicleTypeDoc.initialFee,
        vehicleTypeDoc.initialHours,
        vehicleTypeDoc.recursiveFee,
        vehicleTypeDoc.recursiveHours,
        false
      );
    } else if (site.isDynamicFee && site.onCheckInFee) {
      const history = await parkingHistoryModel.findOne({
        QR: qrId,
        checkIn: true,
        checkout: false,
      });
      const hours = await calculateHours(history.checkInTime, checkOutTime);
      const vehicleTypeDoc = await siteCategoryModel.findOne({
        site: site._id,
        category: vehicleType,
      });
      parkingFee = calculateFee(
        hours,
        vehicleTypeDoc.initialFee,
        vehicleTypeDoc.initialHours,
        vehicleTypeDoc.recursiveFee,
        vehicleTypeDoc.recursiveHours,
        true
      );
    } else if (!site.isDynamicFee && site.onCheckInFee) {
      parkingFee = 0;
    } else if (!site.isDynamicFee && !site.onCheckInFee) {
      const vehicleTypeDoc = await siteCategoryModel.findOne({
        site: site._id,
        category: vehicleType,
      });
      parkingFee = vehicleTypeDoc.initialFee;
    }
  }
  return parkingFee;
};
async function calculateHours(checkInTime,checkOutTime){
// Parse the timestamps into Date objects
const checkInDate = new Date(checkInTime);
const checkOutDate = new Date(checkOutTime);
// Calculate the time difference in milliseconds
const timeDifferenceMs = checkOutDate - checkInDate;

// Convert the time difference to hours
const totalHours = Math.ceil(timeDifferenceMs / (1000 * 60 * 60)); // 1000 ms in a second, 60 seconds in a minute, 60 minutes in an hour

console.log("Total hours:", totalHours);
return totalHours;

}
async function calculateFee(totalDuration,initialFee,initialHours,recursiveFee,recursiveHours,category){
  console.log("initialHours", initialHours, "totalDuration", totalDuration);
  let recursiveFeeTotal = 0;
  let recursiveDuration;
  let totalFee;
   if(category===true){
    // const vehicleTypeDoc = await CategoryModel.findById({ _id: category });
    // initialFee = vehicleTypeDoc.fee;
     if (totalDuration > initialHours) {
       recursiveDuration = totalDuration - initialHours;
       recursiveFeeTotal = Math.ceil(recursiveDuration/recursiveHours)*recursiveFee;
       totalFee =  recursiveFeeTotal;
     } else {
       totalFee = 0;
     }
  }else{
  if (totalDuration > initialHours) {
    recursiveDuration = totalDuration - initialHours;
    recursiveFeeTotal = Math.ceil(recursiveDuration/recursiveHours)*recursiveFee;
    totalFee = initialFee + recursiveFeeTotal;
  } else {
    totalFee=initialFee
  }
}
  console.log("totalFee",totalFee)
  return totalFee;
}