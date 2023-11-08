const { default: mongoose } = require("mongoose");
const categoryModel = require("../models/categoryModel");
const uploadFile = require("../utils/uploadFile");
const feeDetailsModel = require("../models/feeDetailsModel");
const siteServices = require("./siteServices");
const siteCategoryModel = require("../models/siteCategoryModel");

const categoryServices = {
  create: async (name, icon) => {
    if (icon) {
      icon = await uploadFile(icon);
    } else {
      icon = null;
    }
    const result = await categoryModel.create({
      name,
      icon,
    });
    await result.save();
    return result;
  },
  getallVehicleType: async () => {
    const result = await categoryModel.find({deleted:false});
    return result;
  },
  isExist: async (name) => {
    const result = await categoryModel.findOne({name:name, deleted: false });
    return result;
  },
  isConfigured: async (category) => {
    const result = await siteCategoryModel.find({ category: category });
    return result;
  },
  getAll: async (site) => {
    let result = await siteCategoryModel.aggregate([
      {
        $match: {
          site: new mongoose.Types.ObjectId(site),
        },
      },
      {
        $lookup: {
          from: "sites",
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
          from: "categories",
          localField: "category",
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
        $project: {
          site: "$site.site",
          onCheckInFee: "$site.onCheckInFee",
          isDynamicFee: "$site.isDynamicFee",
          category: "$category.name",
          icon: "$category.icon",
          initialFee: 1,
          initialHours: 1,
          recursiveFee: 1,
          recursiveHours: 1,
        },
      },
    ]);
    // .find({ site: { $eq: site } }, { createdAt: 0, updatedAt: 0, __v: 0 })
    // .populate({ path: "site" })
    // .populate({ path: "category" });
    return result;
  },

  getById: async (id) => {
    const result = await categoryModel.findById(
      { _id: id },
      { createdAt: 0, updatedAt: 0, __v: 0 }
    );
    return result;
  },

  updateById: async (categoryId, name, icon) => {
    let result;
    if (icon) {
      icon = await uploadFile(icon);
      result = await categoryModel.findByIdAndUpdate(
        { _id: categoryId },
        {
          name,
          icon,
        },
        {
          new: true,
        }
      );
    } else {
      result = await categoryModel.findByIdAndUpdate(
        { _id: categoryId },
        {
          name,
          fee,
        },
        {
          new: true,
        }
      );
    }

    return result;
  },
  deleteById: async (categoryId) => {
    const result = await categoryModel.findOneAndUpdate(
      { _id: categoryId },
      { deleted: true }
    );
    return result;
  },
};
module.exports = categoryServices;
