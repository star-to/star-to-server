function extractUserDevice(req) {
  return req
    .get("user-agent")
    .replace(/[\(\)]/g, "!")
    .split("!")[1];
}

module.exports = { extractUserDevice };
