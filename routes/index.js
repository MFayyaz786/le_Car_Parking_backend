const express = require("express");
const app = express();
const dotenv = require("dotenv");
const userRouter = require("./routes/userRotuer");
const QRRouter = require("./routes/QRRouter");
const categoryRouter = require("./routes/categoryRouter");
const parkingHistoryRouter = require("./routes/parkingHistoryRouter");
const moment = require("moment");

//const userHistory = require("./routes/socket");
const path = require("path");
const cors = require("cors");
const boothRouter = require("./routes/boothRouter");
// const http = require("http");
// const socketIo = require("socket.io");
const morgan = require("morgan");
//const { addAnId, deleteAnId } = require("./utils/userSocketId");
const uc = require("upper-case-first");
const siteRouter = require("./routes/siteRouter");
const apiLogs = require("./middleware/apiLogs");
const testService = require("./utils/testService");
//cors
const corOption = {
  origin: "*",
};
// const server = http.createServer(app);
// const io = socketIo(server);
// app.set("socket", io);
app.use(cors(corOption));
dotenv.config();
require("./db/index");
// Middleware to parse JSON data in request body
app.use(express.json({ limit: "100mb" }));
app.use(morgan("dev"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  console.log(`Route called: ${req.originalUrl}`);
  next();
});
app.use(apiLogs);
// Define a route that receives JSON data
app.get("/", (req, res) => {
  res.send({ message: "Car Parking" });
});
// io.on("connection", (socket) => {
//   console.log("connnection on");
//   addAnId(
//     socket.handshake.query.userId,
//     socket.id,
//     socket.handshake.query.name
//   );
//   require("./routes/socket")(socket, io);
//   socket.on("history", (message) => {
//     userHistory(socket, io);
//     console.log("Received message from client: ", message);
//   });
//   socket.on("disconnect", () => {
//     console.log("disconnected");
//     deleteAnId(socket.id);
//   });
// });

// const createdDate = moment(
//   "2023-08-02T13:00:52",
//  ).format("YYYY-MM-DD");
// console.log("createdDate",createdDate);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/QR", QRRouter);
app.use("/api/v1/parkingHistory", parkingHistoryRouter);
app.use("/api/v1/booth", boothRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/site", siteRouter);

//404 handler
app.use((req, res, next) => {
  res.status(404).send({ msg: "Route Not found" });
  return;
});
//
app.use((err, req, res, next) => {
  console.log(err);
  if (err && err.code === 11000) {
    let errorKey = Object.keys(err["keyPattern"]).toString();
    errorKey = uc.upperCaseFirst(errorKey);
    return res.status(400).send({ msg: errorKey + " already exists" });
  }
  if (err.name === "ValidationError") {
    const firstErrorKey = Object.keys(err.errors)[0];
    return res.status(400).send({ msg: err.errors[firstErrorKey].message });
    // res.status(400).send({
    //   msg: Object.values(err.errors).map((val) => val.message),
    // });
  } else {
    return res.status(400).send({ msg: err.message });
  }
});
const port = process.env.PORT;
// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
