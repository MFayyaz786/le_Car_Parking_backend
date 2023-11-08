// const schedule = require("node-schedule");
// module.exports=async function(){
//     const date="2023-07-26T00:00:00.000+00:00";
//     const time=9
//     let timestamp = createTimestamp(date, time);
//     console.log("timestamps",timestamp)
// schedule.scheduleJob(timestamp, async () => {
//   console.log("Cron job running after one minute");
// });
// }
// function createTimestamp(date, militaryTime) {
//   // Convert the military time to hours and minutes
//   const hours = Math.floor(militaryTime / 100);
//   const minutes = militaryTime % 100;

//   // Parse the date and create a new Date object
//   const parsedDate = new Date(date);

//   // Set the hours and minutes for the new Date object
//   parsedDate.setUTCHours(hours, minutes);
//  parsedDate.setUTCMinutes(parsedDate.getUTCMinutes() - 5);
//   // Get the timestamp in milliseconds
//   const timestamp = parsedDate.toISOString().replace(".000Z", "");

//   return timestamp;
// }

