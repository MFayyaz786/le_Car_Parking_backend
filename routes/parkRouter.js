const express = require("express");
const parkServices = require("../services/parkServices");
const expressAsyncHandler = require("express-async-handler");
const parkRouter = express.Router();
parkRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    try {
      const histories = await parkServices.getAll().sort("-createdAt");
      res.json(histories);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get parking histories" });
    }
  })
);
module.exports = parkRouter;
