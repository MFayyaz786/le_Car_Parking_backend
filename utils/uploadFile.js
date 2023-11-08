const mime = require("mime-types");
const fs = require("fs");
//const image=require('../public/images')
const uploadFile = async (file) => {
  //console.log(file)
  // to declare some path to store your converted image
  try {
    // console.log('file', file)

    let matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    // console.log('matches', matches)
    // console.log(req.body.base64image);

    let response = {};

    if (matches.length !== 3) {
      return new Error("Invalid input string");
    }

    response.type = matches[1];

    response.data = new Buffer.from(matches[2], "base64");

    let decodedImg = response;

    let imageBuffer = decodedImg.data;

    let type = decodedImg.type;

    let extension = mime.extension(type);

    var timestamp = new Date().toISOString().replace(/[-:.]/g, "");

    var random = ("" + Math.random()).substring(2, 4);
    if (extension.toString == "false") {
      extension = "png";
    }
    var random_number = timestamp + random;

    let fileName = random_number + ".png";

    fs.writeFileSync("./public/images/" + fileName, imageBuffer, "utf8");

    var imgpath = "images/" + fileName;
    return imgpath;
  } catch (e) {
    console.log(e);
    return null;
    //res.status(500).send({ msg: e });
  }
};

module.exports = uploadFile;
