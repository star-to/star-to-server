const mysql = require("mysql");
const {
  CLIENT_PS_MULTI_RESULTS,
} = require("mysql/lib/protocol/constants/client");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 30,
  multipleStatements: true,
});

function sendQuery(query, callback = null) {
  pool.getConnection((err, connection) => {
    if (err) {
      connection.rollback();
      throw "db connection에 실패했습니다.";
    }
    connection.query(query, (error, results, fields) => {
      if (error) throw `${query}가 잘못됐습니다`;
      if (!callback) return;
      callback(results);
    });
    connection.release();
  });
}

module.exports = { sendQuery };
