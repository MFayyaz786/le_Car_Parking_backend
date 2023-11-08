const { default: mongoose } = require("mongoose");
const boothModel = require("../models/boothModel");

const boothServices = {
  get: async () => {
    const result = await boothModel
      .find({deleted:false}, { createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "site",
        select: { createdAt: 0, updatedAt: 0, __v: 0 },
      });
    return result;
  },
  isExist:async(name)=>{
    const result=await boothModel.findOne({name:name,deleted:false});
    return result;
  },
  getById: async (_id) => {
    const result = await boothModel
      .findById(
        {
          _id,
        },
        { createdAt: 0, updatedAt: 0, __v: 0 }
      )
      .populate({
        path: "site",
        select: { createdAt: 0, updatedAt: 0, __v: 0 },
      });
    return result;
  },
  getBySite: async (site) => {
    const result = await boothModel
      .find(
        {
          site:site,
          deleted:false
        },
        { createdAt: 0, updatedAt: 0, __v: 0 }
      )
      .populate({
        path: "site",
        select: { createdAt: 0, updatedAt: 0, __v: 0 },
      });
    return result;
  },
  create: async (
    site,
    name,
    direction,
    location,
  ) => {
    const data = new boothModel({
      site:new mongoose.Types.ObjectId(site),
      name,
      direction,
      location,
    });
    const result = await data.save();
    return result;
  },
  update: async (
    boothId,
    name,
    direction,
    location,
  ) => {
    console.log(
      boothId,
      name,
      direction,
      location,
    );
    const result = await boothModel.findOneAndUpdate(
      { _id: boothId },
      { name, direction, location },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const booth = await boothModel.findOneAndUpdate({ _id },{deleted:true});
    return booth;
  },
};
module.exports = boothServices;
