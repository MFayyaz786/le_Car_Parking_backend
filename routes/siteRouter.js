const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const siteServices = require("../services/siteServices");
const boothServices = require("../services/boothServices");
const siteCategoryModel = require("../models/siteCategoryModel");
const siteRouter = express.Router();
siteRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const sites = await siteServices.get();
   return res.status(200).send({ msg: "Site list ", data: sites });
  })
);
siteRouter.get(
  "/vehicleType/:id",
  expressAsyncHandler(async (req, res) => {
    const sites = await siteServices.vehicleType(req.params.id);
    return res.status(200).send({ msg: "Site vehicle type list ", data: sites });
  })
);
siteRouter.get(
  "/getById",
  expressAsyncHandler(async (req, res) => {
    const { boothId } = req.query;
    const site = await siteServices.getById(boothId);
    if(site){
    return res.status(200).send({ msg: "Site", data: site });
    }else{
    return res.status(404).send({msg:"Not Found!"})
    }
  })
);
siteRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let {
      site,
      location,
      onCheckInFee,
      isDynamicFee,
      details
    } = req.body;
    // Check for the required isDynamicFee field
    
    if (
      typeof isDynamicFee !== "boolean" ||
      typeof onCheckInFee !== "boolean"
    ) {
      return res.status(400).send({
        msg: "isDynamicFee and onCheckInFee field is required and must be a boolean.",
      });
    }
    // if (!site ||!location) {
    //   return res.status(400).send({ msg: "Fields missing" });
    // }
    if (!site || !location || details.length === 0) {
      return res.status(400).send({ msg: "Fields missing" });
    }
    if(isDynamicFee===false){
      initialFee=null
      initialHours=null
      recursiveFee=null
      recursiveHours=null
    }
     const isExist = await siteServices.isExist(site);
     if (isExist) {
       return res.status(400).send({ msg: "Site already exist" });
     }
    const result = await siteServices.create(
      site,
      location,
      onCheckInFee,
      isDynamicFee,
      details
    );
    if (result) {
      return res.status(200).send({ msg: "Site  added", data: result });
    } else {
      return res.status(400).send({ msg: "Site not added" });
    }
  })
);
siteRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { siteId, site, location } = req.body;
    const result = await siteServices.update(siteId, site, location);
    if (result) {
      return res.status(200).send({ msg: "Site  updated", data: result });
    } else {
      return res.status(400).send({ msg: "Site  not updated" });
    }
  })
);
siteRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { siteId } = req.query;
    const isBooth=await boothServices.getBySite(siteId);
    if(isBooth.length!==0){
        return res.status(400).send({ msg: "This site linked with booth!" });
    }
    const site = await siteServices.delete(siteId);
    if (!site) {
     return res.status(400).send({ msg: "ID Not Found" });
    }
     return res.status(200).send({ msg: "site deleted" });
  })
);
module.exports = siteRouter;
