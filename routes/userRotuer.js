const express = require("express");
const userRouter = express.Router();
const expressAsyncHandler = require("express-async-handler");
const userServices = require("../services/userServices");
const OTP = require("../utils/OTP");
const { validatePIN } = require("../utils/PINHash");
const passwordValidator = require("../utils/passwordValidator");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
userRouter.post("/register", async (req, res) => {
 const {
  firstName,
  lastName,
  cnic,
  phone,
  email,
  password,
  gateRole,
  boothId,
  role,
} = req.body;

if (role === "admin" && (!firstName || !lastName || !cnic || !phone || !email || !password)) {
  return res.status(400).send({ msg: "Fields Missing" });
}

if (role === "user" && (!firstName || !lastName || !cnic || !phone || !email || !password || !gateRole || !boothId)) {
  return res.status(400).send({ msg: "Fields Missing" });
}

  if (!passwordValidator.schema.validate(password)) {
    return res.status(400).send({
      msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",

      //validator.schema.validate(password, { list: true }),
    });
  }
   const isExist = await userServices.isExist(email);
   if (isExist) {
     return res.status(400).send({ msg: "User already exist" });
   }
 // try {
  let user;
  if(role==='admin'){
     user = await userServices.addAdmin(
      firstName,
      lastName,
      cnic,
      phone,
      email,
      password,
      role
    );
  }else{
    const isAssignedBooth=await userModel.findOne({boothId:boothId});
    if (isAssignedBooth){
      return res.status(400).send({msg:"Already booth assigned!"})
    }
      user = await userServices.addUser(
        firstName,
        lastName,
        cnic,
        phone,
        email,
        password,
        gateRole,
        boothId,
        role
      );
  }
  if(user){
    res.status(201).send({ msg: "User successfully registered" });
  }else{
    res.status(201).send({ msg: "Failed!" });
  }
  // } catch (error) {
  //   res.status(500).json({ msg: error.message });
  // }
});

userRouter.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await userServices.getByEmail(email);
      console.log(user)
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
      const passwordMatches = await validatePIN(password, user.password); // checkPassword function not shown in code snippet

      if (!passwordMatches) {
        return res.status(401).json({ msg: "Invalid password" });
      }

      res.json({ msg: "Logged in successfully", data: user });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  })
);

// get all users
userRouter.get("/", async (req, res) => {
  try {
    const user = await userServices.getAll();
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(400).json({ msg: `No Users found` });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// get single
userRouter.get("/id", async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await userServices.getSingle(userId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(400).json({ msg: `No User found` });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
// get single
userRouter.get("/getByBooth/:id", async (req, res) => {
  try {
    const user = await userServices.getByBooth(req.params.id);
    if (user) {
      res.status(200).send({msg:"User",data:user});
    } else {
      res.status(400).json({ msg: `No User found` });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
userRouter.post(
  "/sendOtp",
  expressAsyncHandler(async (req, res) => {
    const { email } = req.body;
    // const otp = OTP();
    const result = await userServices.updateOtp(email);
    if (result) {
      // const sendMail = await sendEmail(email, otp);
      // if (!sendMail) {
      //   res.status(400).json({ msg: "OTP not sent" });
      // }
      res.status(200).json({ msg: "OTP sent" });
    } else {
      res.status(400).json({ msg: "OTP not sent" });
    }
  })
);
userRouter.post(
  "/verifyOtp",
  expressAsyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const verifyExpireOtp = await userServices.otpExpiryValidation(email);
    if (!verifyExpireOtp) {
      res.status(400).send({
        msg: "Otp Expire please try again!",
      });
    } else {
      const verifyOtp = await userServices.verifyOTP(email, otp);
      if (verifyOtp) {
        res.status(200).send({ msg: "OTP Verified" });
      } else {
        res.status(400).send({ msg: "Invalid OTP" });
      }
    }
  })
);
userRouter.post(
  "/resetPassword",
  expressAsyncHandler(async (req, res) => {
    const { userId, password, reEnterPassword } = req.body;
    if (password !== reEnterPassword) {
      return res.status(400).send({ msg: "Passwords Don't Match" });
    }
    if (!passwordValidator.schema.validate(password)) {
      return res.status(400).send({
        msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",
      });
    }
    const result = await userServices.setNewPassword(userId, password);
    if (result) {
      res.status(200).json({ msg: "Password reset!", data: result });
    } else {
      res.status(400).json({ msg: "password failed to reset" });
    }
  })
);
userRouter.post(
  "/forgotPassword",
  expressAsyncHandler(async (req, res) => {
    const { email, password, reEnterPassword } = req.body;
    if (!email || !password || !reEnterPassword) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    if (password !== reEnterPassword) {
      res.status(400).send({
        msg: "Password And reEnterPassword don't Match",
      });
    }
    if (!passwordValidator.schema.validate(password)) {
      return res.status(400).send({
        msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",

        //validator.schema.validate(password, { list: true }),
      });
    }
    const result = await userServices.forgotPassword(email, password);
    if (result) {
      return res.status(200).send({ msg: "Password Updated", data: result });
    } else {
      return res.status(400).send({ msg: "Password not Updated" });
    }
  })
);

// update user
userRouter.patch("/", async (req, res) => {
  try {
    let {
      userId,
      firstName,
      lastName,
      cnic,
      phone,
      gateRole,
      boothId,
      site,
      role,
      status,
    } = req.body;
    console.log(
      userId,
      firstName,
      lastName,
      cnic,
      phone,
      gateRole,
      site,
      role,
      status
    );
    if(role==="admin"){
      site=null,
      gateRole=null,
      boothId=null
    };
    // const isAssignedBooth = await userModel.findOne({ boothId: boothId });
    // if (isAssignedBooth && isAssignedBooth._id.toString()!==userId) {
    //   return res.status(400).send({ msg: "Already booth assigned to other user!" });
    // }
    const user = await userServices.Update(
      userId,
      firstName,
      lastName,
      cnic,
      phone,
      gateRole,
      site,
      role,
      status
    );
    if (user) {
     return res.status(200).send({ msg: "User profile updated" });
    } else {
    return  res.status(400).json({ msg: `No User found` });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// delete user
userRouter.delete("/", async (req, res) => {
  const { userId } = req.query;
  const user = await userServices.Delete(userId);
  if (user) {
    res.status(200).send({ msg: "user deleted" });
    return;
  } else {
    res.status(400).json({ msg: `No User found` });
    return;
  }
});

module.exports = userRouter;
