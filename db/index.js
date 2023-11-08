const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
console.log(process.env.DATABASE)
mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("db connected");
  })
  .catch((err) => {
    console.log(err);
  });
