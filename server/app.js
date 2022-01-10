const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
require("dotenv").config();

const PORT = 7070;

app.use(
  cors({
    origin: ["http://localhost:9000", "http://star-to"],
    optionsSuccessStatus: 200,
  })
);

app.get("/api/login/check", (req, res) => {
  // res.json({ isLogin: false });
});

app.get("/api/login/naver", (req, res) => {
  const api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${process.env.NAVER_REDIRECT_URL}&state=${state}`;
  res.send(api_url);
});

app.get("/api/login/naver/callback", (req, res) => {
  const { code, state } = req.query;
  const api_url = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRETS}&redirect_uri=${process.env.NAVER_REDIRECT_URL}&code=${code}&state=${state}`;

  axios({
    method: "get",
    url: api_url,
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRETS,
    },
  })
    .then((data) => {
      res.redirect("http://localhost:9000/");
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(PORT, () => {
  console.log("listenning port 7070");
});
