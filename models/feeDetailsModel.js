const mongoose = require("mongoose");
const Schema = mongoose.Schema;
 // Define a sub-schema for fee details
const FeeDetailsSchema = new Schema({
  site:{
    type:Schema.Types.ObjectId,
    ref:"Site",
},
category:{
    type:Schema.Types.ObjectId,
    ref:"Category"
},
  hours: { type: Number, },
  fee: { type: Number,  },
  isContinuousHours:{type:Boolean}
});
const feeDetailsModel = mongoose.model("FeeDetails", FeeDetailsSchema);
module.exports = feeDetailsModel;