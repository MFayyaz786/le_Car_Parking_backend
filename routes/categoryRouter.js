const express = require("express");
const CategoryServices = require("../services/CategoryServices");
const expressAsyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const CategoryModel = require("../models/categoryModel");
const siteModel = require("../models/siteModel");
const categoryServices = require("../services/CategoryServices");


const CategoryRouter = express.Router();

// Create a new Category code
CategoryRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let {name,icon} = req.body;
     if (!name||!icon) {
       return res.status(400).send({ msg: "Fields Missing" });
     }
     const isExist = await CategoryServices.isExist(name);
     if (isExist) {
       return res.status(400).send({ msg: "Vehicle type already exist" });
     }
    const result = await CategoryServices.create(
      name,
      icon
    );
    if (result) {
      res.status(201).json({ msg: "Category Added", data: result });
    } else {
      res.status(500).json({ msg: "Category Not Added" });
    }
  })
);

// Get a Category code by ID
CategoryRouter.get(
  "/getById",
  expressAsyncHandler(async (req, res) => {
    const { categoryId } = req.query;
    try {
      const result = await CategoryServices.getById(categoryId);
      if (result) {
       return res.status(200).json(result);
      } else {
       return res.status(404).json({ msg: `No Category code found with ID ${categoryId}` });
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);

// Get all Category
CategoryRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    try {
      const result = await CategoryServices.getAll(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);
// Get all Category
CategoryRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    try {
      const result = await CategoryServices.getallVehicleType();
      res.json(result);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  })
);

// Delete a Category code by ID
CategoryRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { categoryId, name, icon } = req.body;
   // try {
      const result = await CategoryServices.updateById(
        categoryId,
        name,
        icon,
      );
      if (result) {
        res.json({ msg: "Category Updated", data: result });
      } else {
        res.status(404).json({ msg: `No Category code found with ID ${id}` });
      }
    // } catch (err) {
    //   res.status(500).json({ msg: err.message });
    // }
  })
);

// Delete all Category codes
CategoryRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { categoryId } = req.query;
   const isConfigured = await categoryServices.isConfigured(categoryId);
   console.log("isConfigured: ", isConfigured);
   if (isConfigured.length!==0) {
     return res
       .status(400)
       .send({
         msg: "Sorry, you can't delete this vehicle category because it's currently in use on the site. Please remove it from configuration before deleting.",
       });
   }
      const result = await CategoryServices.deleteById(categoryId);
      if(result){
     return  res.status(200).json({msg:"Vehicle type deleted successfully"});
      }else {
     return  res.status(400).json({ msg: "Not Found!" });
    }
  })
);

module.exports = CategoryRouter;
