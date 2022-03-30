const express = require("express");
const cors = require("cors");
const session = require("express-session");
const app = express();
require("dotenv").config();

const {
  getCheckAutoLogin,
  getNaverLogin,
  naverLoginCallBack,
  getKakaoLogin,
  kakaoLoginCallback,
} = require("./controller");
const { extractUserDevice } = require("./util");

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

app.get("/api/login/check", getCheckAutoLogin);

app.get("/api/login/naver", getNaverLogin);

app.get("/api/login/naver/callback", naverLoginCallBack);

app.get("/api/login/kakao", getKakaoLogin);

app.get("/api/login/kakao/callback", kakaoLoginCallback);

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
