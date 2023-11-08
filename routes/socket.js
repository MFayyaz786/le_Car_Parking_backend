const parkingHistoryServices = require("../services/parkingHistoryService");
module.exports = async (socket, io) => {
  try {
    const { userId } = socket.handshake.query;
    const parkingHistory = await parkingHistoryServices.history(userId);
    io.to(socket.id).emit("history", parkingHistory);
    console.log("Message emitted successfully", parkingHistory);
  } catch (error) {
    console.error("Error emitting message: ", error);
  }
};
