const siteCategoryModel = require("../models/siteCategoryModel");
const siteModel = require("../models/siteModel");

const siteServices = {
  get: async () => {
    const result = await siteModel
      .find({ deleted: false }, { createdAt: 0, updatedAt: 0, __v: 0 })
      .sort({ createdAt: -1 });
    return result;
  },
  vehicleType: async (site) => {
    const result = await siteCategoryModel
      .find({ site: site }, { site: 0, createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "category",
        select: { name: 1, icon: 1 },
      });

    return result;
  },
  isExist: async (site) => {
    const result = await siteModel.findOne({ site: site, deleted: false });
    return result;
  },
  getById: async (_id) => {
    const result = await siteModel.findById(
      {
        _id,
      },
      { createdAt: 0, updatedAt: 0, __v: 0 }
    );
    return result;
  },
  create: async (site, location, onCheckInFee, isDynamicFee, details) => {
    const data = new siteModel({
      site,
      location,
      onCheckInFee,
      isDynamicFee,
      details,
    });
    if (data) {
      for (site of details) {
        let object;
        if (data.isDynamicFee === false) {
          object = {
            site: data._id,
            category: site.category,
            initialFee: site.initialFee,
            initialHours: null,
            recursiveFee: null,
            recursiveHours: null,
          };
        } else {
          object = {
            site: data._id,
            category: site.category,
            initialFee: site.initialFee,
            initialHours: site.initialHours,
            recursiveFee: site.recursiveFee,
            recursiveHours: site.recursiveHours,
          };
        }
        //  const isExist = await siteCategoryModel.findOne({
        //    category: site.category,
        //  });
        //  if (isExist) {
        //    throw new Error({
        //        msg: `${isExist.name} already exist against this site`,
        //      });
        //  }
        console.log(object);
        const siteCategoryData = new siteCategoryModel(object);
        await siteCategoryData.save();
      }
    }
    const result = await data.save();
    return result;
  },
  update: async (_id, site, location) => {
    const result = await siteModel.findOneAndUpdate(
      { _id },
      { site, location },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const booth = await siteModel.findOneAndUpdate({ _id }, { deleted: true });
    return booth;
  },
};
module.exports = siteServices;
