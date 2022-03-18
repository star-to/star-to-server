require("./db");
const app = require("./app");

const PORT = 7070;

app.listen(PORT, () => {
  console.log("listenning port 7070");
});
