const axios = require("axios");
const e = require("express");
const { sendQuery } = require("./db");
const { extractUserDevice } = require("./util");

const getCheckAutoLogin = (req, res) => {
  let isLogin = false;

  const userDevice = extractUserDevice(req);
  console.log(userDevice);

  if (req.session.user) {
    const query = `select user_id from user where user_id='${req.session.user}' and access_device='${userDevice}'`;
    req.session.reAuth = false;
    try {
      return sendQuery(query, (result) => {
        if (result.length === 0) {
          delete req.session.user;
          req.session.reAuth = true;
          return res.json({ isLogin });
        }

        isLogin = true;
        return res.json({ isLogin });
      });
    } catch (e) {
      console.error(e);
    }
  } else {
    return res.json({ isLogin });
  }
};

const getNaverLogin = (req, res) => {
  let api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${process.env.NAVER_REDIRECT_URL}&state=${process.env.STATE}`;
  api_url += req.session.reAuth ? "&auth_type=reauthenticate" : "";
  res.send(api_url);
};

const naverLoginCallBack = (req, res) => {
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
          const { response } = data;
          const userDevice = extractUserDevice(req);
          // , gender, age,birth
          const findIdQuery = `SELECT user_id, access_device from user where flatform_id='${response.id}'`;
          const inputInfoQuery = `INSERT INTO user(flatform_id, nickname, login_flatform, auto_login,access_device, last_access_date ) VALUES('${response.id}','${response.name}','naver',false,'${userDevice}', NOW() )`;

          sendQuery(findIdQuery, (result) => {
            if (result.length === 0) {
              return sendQuery(
                `${inputInfoQuery};${findIdQuery};`,
                (input) => {
                  req.session.user = input[0]["user_id"];
                  return res.redirect(process.env.HOST_NAME);
                }
              );
            }

            req.session.user = result[0]["user_id"];

            const equalDevice =
              result[0]["access_device"] === userDevice;

            if (!equalDevice) {
              const deleteQuery = `delete from user where user_id='${userId}'`;
              return sendQuery(deleteQuery, (result) => {
                return res.redirect(process.env.HOST_NAME);
              });
            }

            return res.redirect(process.env.HOST_NAME);
          });
        })
        .then((err) => {
          console.log(err);
        });
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = {
  getCheckAutoLogin,
  getNaverLogin,
  naverLoginCallBack,
};
