const parkingHistoryModel = require("../models/parkingHisotryModel");
const parkServices = {
  getAll: async () => {
    const histories = await parkingHistoryModel.find({}).populate({
      path: "QR",
    });
    console.log(histories);
    return histories;
  },
};
module.exports = parkServices;