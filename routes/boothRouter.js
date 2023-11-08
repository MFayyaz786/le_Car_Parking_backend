const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const boothServices = require("../services/boothServices");
const boothRouter = express.Router();

boothRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const booths = await boothServices.get();
    res.status(200).send({ msg: "Booth list ", data: booths });
  })
);

boothRouter.get(
  "/getById",
  expressAsyncHandler(async (req, res) => {
    const { boothId } = req.query;
    const booth = await boothServices.getById(boothId);
    if(booth){
   return res.status(200).send({ msg: "Booth", data: booth });
    }else{
     return     res.status(404).send({ msg: "Not Found!" });
    }
  })
);
boothRouter.get(
  "/getBySite",
  expressAsyncHandler(async (req, res) => {
    const { siteId } = req.query;
    const site = await boothServices.getBySite(siteId);
    if(site.length!==0){
   return res.status(200).send({ msg: "Booth", data: site });
    }else{
   return res.status(404).send({ msg: "Not Found!"});

    }
  })
);
boothRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const {site, name, direction, location } =
      req.body;
      const isExist=await boothServices.isExist(name);
      if(isExist){
        return res.status(400).send({msg:"Booth already exist"})
      }
    if (!site||!name||!direction || !location) {
      return res.status(400).send({ msg: "Fields missing" });
    }
    const result = await boothServices.create(
      site,
      name,
      direction,
      location,
    );
    if (result) {
      return res.status(200).send({ msg: "Booth  added", data: result });
    } else {
      return res.status(400).send({ msg: "Booth not added" });
    }
  })
);
boothRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const {
      boothId,
      name,
      direction,
      location,
    } = req.body;

    const result = await boothServices.update(
      boothId,
      name,
      direction,
      location,
    );
    if (result) {
      return res.status(200).send({ msg: "Booth  updated", data: result });
    } else {
      return res.status(400).send({ msg: "Booth  not updated" });
    }
  })
);
boothRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { boothId } = req.query;
    const booth = await boothServices.delete(boothId);
    if (booth) {
      res.status(200).send({ msg: "Booth deleted" });
    } else {
      res.status(400).send({ msg: "Booth not Found!" });
    }
  })
);
module.exports = boothRouter;
