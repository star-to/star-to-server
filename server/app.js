const express = require("express");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");
const app = express();
require("dotenv").config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
  })
);

app.use(
  cors({
    origin: ["http://localhost:9000", process.env.HOST_NAME],
    optionsSuccessStatus: 200,
  })
);

app.get("/api/login/check", (req, res) => {
  let isLogin = false;

  console.log(req.session.user);
  if (req.session.user) {
    isLogin = true;
    //TODO: USER ANGENT 정보 확인하는 코드 추가
  }

  res.json({ isLogin });
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
      axios({
        method: "get",
        url: "https://openapi.naver.com/v1/nid/me",
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
        .then(({ data }) => {
          //TODO: db 저장 코드 추가2
          console.log(data);
          req.session.user = data.response.id;
          res.redirect(process.env.HOST_NAME);
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
  console.log(api_url);
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
      //TODO: db저장코드 있어야함
      axios({
        method: "get",
        url: "https://kapi.kakao.com/v2/user/me",
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "Content-type": "application/x-www-form-urlencoded",
        },
      })
        .then(({ data }) => {
          //TODO: db저장코드 있어야함
          console.log(data);
          req.session.user = data.id;
          res.redirect(process.env.HOST_NAME);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/api/my-review", (req, res) => {
  //TODO: 날짜순으로 정렬해서 응답 줘야 함!

  //TODO: test code
  const test = [
    {
      date: "2021 - 10 - 25",
      list: [
        {
          placeId: 1234,
          placeName: "카페마스",
          location: 123,
          star: 5,
        },
        {
          placeId: 1224,
          placeName: "컴포즈 커피",
          location: 234,
          star: 3,
        },
      ],
    },
    {
      date: "2021 - 12 - 23",
      list: [
        {
          placeId: 234,
          placeName: "투썸플레이스",
          location: 123,
          star: 3,
        },
      ],
    },
  ];

  res.send(test);
});

module.exports = app;
