const { default: mongoose } = require("mongoose");
const userModel = require("../models/userModel");
const { hash } = require("../utils/PINHash");
const bcrypt = require("bcrypt");
const boothServices = require("./boothServices");
const siteCategoryModel = require("../models/siteCategoryModel");
const siteModel = require("../models/siteModel");
const userServices = {
  addUser: async (
    firstName,
    lastName,
    cnic,
    phone,
    email,
    password,
    gateRole,
    boothId,
    role
  ) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const site = await boothServices.getById(boothId);
    console.log("user", site);
    const result = await userModel.create({
      firstName,
      lastName,
      cnic,
      phone,
      email,
      password,
      gateRole,
      boothId: mongoose.Types.ObjectId(boothId),
      site: mongoose.Types.ObjectId(site.site._id),
      role,
    });
    return result;
  },
  addAdmin: async (firstName, lastName, cnic, phone, email, password, role) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await userModel.create({
      firstName,
      lastName,
      cnic,
      phone,
      email,
      password,
      role,
    });
    return result;
  },
  getByEmail: async (email) => {
    const result = await userModel.findOne({ email: email, deleted: false });
    return result;
  },

  updateOtp: async (email) => {
    var otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 3);
    const user = await userModel.findOneAndUpdate(
      { email: email },
      { otp: 1111, otpExpire: otpExpiry }
    );
    console.log(user);
    return user;
  },
  verifyOTP: async (email, otp) => {
    const verify = await userModel.findOneAndUpdate(
      { email: email, otp: otp },
      { otp: null }
    );
    return verify;
  },
  otpExpiryValidation: async (email) => {
    const validate = await userModel.findOne({
      email: email,
      otpExpire: { $gte: new Date() },
    });
    return validate;
  },
  setNewPassword: async (_id, password) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await userModel.findOneAndUpdate(
      { _id: _id },
      {
        password,
      },
      {
        new: true,
      }
    );
    return result;
  },
  forgotPassword: async (email, password) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await userModel.findOneAndUpdate(
      { email },
      { password },
      { new: true }
    );
    return result;
  },
  getAll: async () => {
    let result = await userModel
      .find({ deleted: false })
      .populate({
        path: "site",
        select: { site: 1, location: 1 },
      })
      .populate({
        path: "boothId",
        select: { name: 1, _id: 1 },
      })
      .sort({ createdAt: -1 });
    return result;
  },

  getSingle: async (id) => {
    const result = await userModel
      .findById({ _id: id })
      .populate({path:"site"})
      .populate({
        path: "boothId",
        select: { name: 1, _id: 1, site: 1,deleted:1 },
      })
      .sort({ createdAt: -1 });
    return result;
  },
  getByBooth: async (id) => {
    // let result = await userModel.aggregate([
    //   {
    //     $match: {
    //       _id: new mongoose.Types.ObjectId(id),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "booths",
    //       localField: "boothId",
    //       foreignField: "_id",
    //       as: "booth",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$booth",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "sites",
    //       localField: "booth.site",
    //       foreignField: "_id",
    //       as: "site",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$site",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       site: 1,
    //     },
    //   },
    // ]);
    let result = await userModel.findById({ _id: id, delete: false });
    // .populate({
    //   path: "boothId",
    //   select: { name: 1, _id: 1, site: 1 },
    //   populate:{
    //     path:"site"
    //   }
    // })
    // .sort({ createdAt: -1 });
    if (result) {
      const categories = await siteModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(result.site),
          },
        },
        {
          $lookup: {
            from: "sitecategories",
            localField: "_id",
            foreignField: "site",
            as: "categories",
          },
        },
        {
          $unwind: {
            path: "$categories",
            preserveNullAndEmptyArrays: true, // Optional, if you want to keep unmatched documents
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categories.category",
            foreignField: "_id",
            as: "categories.category",
          },
        },
        {
          $addFields: {
            "categories.category": {
              $cond: {
                if: { $eq: [{ $size: "$categories.category" }, 0] },
                then: null,
                else: { $arrayElemAt: ["$categories.category", 0] },
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            site: { $first: "$$ROOT" },
            categories: {
              $push: {
                _id: "$categories.category._id",
                name: "$categories.category.name",
                initialFee: "$categories.initialFee",
                initialHours: "$categories.initialHours",
                recursiveFee: "$categories.recursiveFee",
                recursiveHours: "$categories.recursiveHours",
              },
            },
            // Add other fields you want to retain in the result
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$site", { categories: "$categories" }],
            },
          },
        },
        //  {
        //    $project: {
        //      // "site._id": 0, // Exclude _id field if needed
        //      "site.categories": 0, // Exclude the categories field from the site
        //      // Include other fields you want to retain in the result
        //    },
        //  },
        //  {
        //    $project: {
        //      "site.onCheckInFee": 1, // Include onCheckInFee from the site
        //      "site.isDynamicFee": 1, // Include isDynamicFee from the site
        //      categories: "$categories", // Rename categories to the desired field name
        //      // Include other fields you want to retain in the result
        //    },
        //  },
      ]);
      //       const categories = await siteModel.aggregate([
      //         {
      //           $match:{
      //             _id:new mongoose.Types.ObjectId(result.site)
      //           }
      //         },
      //   {
      //     '$lookup': {
      //       'from': 'sitecategories',
      //       'localField': '_id',
      //       'foreignField': 'site',
      //       'as': 'categories',
      //       'pipeline': [
      //         {
      //           '$lookup': {
      //             'from': 'categories',
      //             'localField': 'category',
      //             'foreignField': '_id',
      //             'as': 'category'
      //           }
      //         }, {
      //           '$addFields': {
      //             'category': {
      //               '$cond': {
      //                 'if': {
      //                   '$eq': [
      //                     {
      //                       '$size': '$category'
      //                     }, 0
      //                   ]
      //                 },
      //                 'then': null,
      //                 'else': {
      //                   '$arrayElemAt': [
      //                     '$category', 0
      //                   ]
      //                 }
      //               }
      //             }
      //           }
      //         }, {
      //           '$project': {
      //             '_id': 0,
      //             '__v': 0,
      //             'site': 0,
      //             'createdAt': 0,
      //             'updatedAt': 0
      //           }
      //         }
      //       ]
      //     }
      //   }, {
      //     '$addFields': {
      //       'categories': {
      //         '$map': {
      //           'input': '$categories',
      //           'as': 'cat',
      //           'in': {
      //             '_id': '$$cat.category._id',
      //             'name': '$$cat.category.name',
      //             'initialFee': '$$cat.initialFee',
      //             'initialHours': '$$cat.initialHours',
      //             'recursiveFee': '$$cat.recursiveFee',
      //             'recursiveHours': '$$cat.recursiveHours'
      //           }
      //         }
      //       }
      //     }
      //   }, {
      //     '$project': {
      //       '__v': 0,
      //       'createdAt': 0,
      //       'updatedAt': 0
      //     }
      //   }
      // ]);
      // .aggregate([
      //   {
      //     $match: {
      //       site: new mongoose.Types.ObjectId(result.site),
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "sites",
      //       localField: "site",
      //       foreignField: "_id",
      //       as: "site",
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: "$site",
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "categories",
      //       localField: "category",
      //       foreignField: "_id",
      //       as: "category",
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: "$category",
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },
      //   {
      //     $project: {
      //       siteId: "$site._id",
      //       site: "$site.site",
      //       onCheckInFee: "$site.onCheckInFee",
      //       isDynamicFee: "$site.isDynamicFee",
      //       // category:1,
      //       // "category.initialFee":"$initialFee",
      //       categoryId: "$category._id",
      //       categoryName: "$category.name",
      //       initialFee: 1,
      //       initialHours: 1,
      //       recursiveFee: 1,
      //       recursiveHours: 1,
      //     },
      //   },
      // ])
      //.find({site:result.site})
      // .populate({ path: "site" })
      // .populate({ path: "category" });
      result = categories[0];
    } else {
      result = false;
    }
    return result;
  },

  Update: async (
    userId,
    firstName,
    lastName,
    cnic,
    phone,
    gateRole,
    site,
    role,
    status
  ) => {
    const result = await userModel.findByIdAndUpdate(
      { _id: userId },
      {
        userId,
        firstName,
        lastName,
        cnic,
        phone,
        gateRole,
        site,
        role,
        status,
      },
      {
        new: true,
      }
    );

    return result;
  },
  isExist: async (email) => {
    const result = await userModel.findOne({ email: email, deleted: false });
    return result;
  },
  Delete: async (userId) => {
    const result = await userModel.findOneAndUpdate(
      { _id: userId },
      { deleted: true }
    );
    return result;
  },
};
module.exports = userServices;
