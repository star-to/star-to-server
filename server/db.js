const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

connection.connect();

connection.query(
  "SELECT * FROM user",
  function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    console.log("query", results);
  }
);

connection.end();
