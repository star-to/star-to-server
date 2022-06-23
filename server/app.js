const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
require("dotenv").config();

const {
  getCheckAutoLogin,
  getNaverLogin,
  naverLoginCallBack,
  getKakaoLogin,
  kakaoLoginCallback,
  postCreatePlace,
  getUserBookmark,
  postUserBookmark,
  deleteUserBookmark,
  getReviewContent,
  getReviewMainPlaceId,
  getReviewInfo,
  postReviewInfo,
  patchReviewedList,
  postUserReview,
  getMyReview,
  getPlaceInfo,
  getLogout,
  kakaoLogoutCallback,
} = require("./controller");
const { extractUserDevice } = require("./util");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
  })
);

app.use(
  cors({
    origin: [process.env.HOST_NAME],
    optionsSuccessStatus: 200,
  })
);

app.get("/api/login/check", getCheckAutoLogin);

app.get("/api/login/naver", getNaverLogin);

app.get("/api/login/naver/callback", naverLoginCallBack);

app.get("/api/login/kakao", getKakaoLogin);

app.get("/api/login/kakao/callback", kakaoLoginCallback);

app.get("/api/logout", getLogout);

app.get("/api/logout/kakao/callback", kakaoLogoutCallback);

app.get("/api/bookmark", getUserBookmark);

app.post("/api/bookmark", postUserBookmark);

app.delete("/api/bookmark/:id", deleteUserBookmark);

app.get("/api/place/:id", getPlaceInfo);

app.post("/api/place", postCreatePlace);

app.get("/api/my-review", getMyReview);

app.get("/api/review-content", getReviewContent);

app.get("/api/review-info", getReviewInfo);

app.post("/api/review-info", postReviewInfo);

app.patch("/api/review-info", patchReviewedList);

//TODO: 아직 사용안하는데 get 대신 사용해야할지?
app.post("/api/user-review", postUserReview);

module.exports = app;
