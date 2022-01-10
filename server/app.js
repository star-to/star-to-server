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
  res.json({ isLogin: false });
});

app.get("/api/login/naver", (req, res) => {
  const api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${process.env.NAVER_REDIRECT_URL}&state=${process.env.STATE}`;
  res.send(api_url);
});

app.get("/api/login/naver/callback", (req, res) => {
  const { code, state } = req.query;
  const api_url = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRETS}&redirect_uri=${process.env.NAVER_REDIRECT_URL}&code=${code}&state=${process.env.STATE}`;

  axios({
    method: "get",
    url: api_url,
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRETS,
    },
  })
    .then(({ data }) => {
      console.log(data);
      axios({
        method: "get",
        url: "https://openapi.naver.com/v1/nid/me",
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
        .then((user) => {
          //TODO: db 저장 코드 추가2
          res.redirect("http://localhost:9000/");
        })
        .then((err) => {
          console.log(err);
        });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/api/login/kakao", (req, res) => {
  const api_url = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URL}&response_type=code&state=${process.env.STATE}`;
  res.send(api_url);
});

app.get("/api/login/kakao/callback", (req, res) => {
  const { code, state } = req.query;
  const api_url = "https://kauth.kakao.com/oauth/token";
  axios({
    method: "post",
    url: api_url,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: `grant_type=authorization_code&client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URL}&code=${code}&client_secret=${process.env.KAKAO_CLIENT_SECRET}`,
  })
    .then(({ data }) => {
      axios({
        method: "get",
        url: "https://kapi.kakao.com/v2/user/me",
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "Content-type": "application/x-www-form-urlencoded",
        },
      })
        .then((user) => {
          //TODO: db저장코드 있어야함
          res.redirect("http://localhost:9000/");
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(PORT, () => {
  console.log("listenning port 7070");
});
