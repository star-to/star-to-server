const { axios } = require("axios");

function extractUserDevice(req) {
  console.log(req.get("user-agent"));
  return req
    .get("user-agent")
    .replace(/[\(\)]/g, "!")
    .split("!")[1];
}

module.exports = { extractUserDevice };
