const axios = require("axios");
const moment = require("moment");
const { sendQuery } = require("./db");
const { extractUserDevice } = require("./util");
const Auth = require("./auth");
const auth = Auth();

const getCheckAutoLogin = (req, res) => {
  let isLogin = false;
  const userDevice = extractUserDevice(req);
  req.session.reAuth = false;
  if (req.session.user) {
    const query = `select user_id from user where user_id='${req.session.user}' and access_device='${userDevice}'`;
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
      auth.updateAccessToken(data.access_token);
      auth.updateFlatform("naver");
      axios({
        method: "get",
        url: "https://openapi.naver.com/v1/nid/me",
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
        .then(({ data }) => {
          const { response } = data;
          const userDevice = extractUserDevice(req);
          // , gender, age,birth
          const findIdQuery = `SELECT user_id, access_device from user where flatform_id='${response.id}';`;
          const inputInfoQuery = `INSERT INTO user(flatform_id, nickname, login_flatform, auto_login,access_device, last_access_date) 
          VALUES('${response.id}','${response.name}','naver',false,'${userDevice}', NOW() );`;

          sendQuery(findIdQuery, (result) => {
            if (result.length === 0) {
              return sendQuery(
                `${inputInfoQuery};${findIdQuery};`,
                (input) => {
                  req.session.user = input[0]["user_id"];
                  return res.redirect(process.env.HOST_NAME);
                }
              );
            } else {
              req.session.user = result[0]["user_id"];

              const equalDevice =
                result[0]["access_device"] === userDevice;

              if (!equalDevice) {
                const deleteQuery = `delete from user where user_id=${result[0]["user_id"]}`;
                return sendQuery(deleteQuery, (result) => {
                  return res.redirect(process.env.HOST_NAME);
                });
              } else {
                return res.redirect(process.env.HOST_NAME);
              }
            }
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

const getKakaoLogin = (req, res) => {
  const api_url = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URL}&response_type=code&state=${process.env.STATE}`;
  res.send(api_url);
};

const kakaoLoginCallback = async (req, res) => {
  const { code, state } = req.query;
  const api_url = "https://kauth.kakao.com/oauth/token";

  try {
    const authInfo = await axios({
      method: "post",
      url: api_url,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: `grant_type=authorization_code&client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URL}&code=${code}&client_secret=${process.env.KAKAO_CLIENT_SECRET}`,
    });

    const { access_token } = authInfo.data;
    auth.updateAccessToken(access_token);
    auth.updateFlatform("kakao");

    const userInfo = await axios({
      method: "get",
      url: "https://kapi.kakao.com/v2/user/me",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-type": "application/x-www-form-urlencoded",
      },
    });

    const { id, properties } = userInfo.data;
    const userDevice = extractUserDevice(req);

    const findIdQuery = `SELECT user_id, access_device from user where flatform_id='${id}'`;
    const inputInfoQuery = `INSERT INTO user(flatform_id, nickname, login_flatform, auto_login,access_device, last_access_date) VALUES('${id}','${properties.nickname}','kakao',false,'${userDevice}', NOW() )`;

    return sendQuery(findIdQuery, (result) => {
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
      const equalDevice = result[0]["access_device"] === userDevice;

      if (equalDevice) return res.redirect(process.env.HOST_NAME);

      const deleteQuery = `delete from user where user_id='${result[0]["user_id"]}'`;

      return sendQuery(deleteQuery, async () => {
        const logoutInfo = await axios({
          method: "post",
          url: "https://kapi.kakao.com/v1/user/unlink",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-type": "application/x-www-form-urlencoded",
          },
        });
        //TODO: 예외처리 하기
        return res.redirect(process.env.HOST_NAME);
      });
    });
  } catch (e) {
    console.error(`사용자 인증에 실패했습니다.[${e}]`);
  }
};

const getLogout = async (req, res) => {
  const flatform = auth.getFlatform();

  if (flatform === "kakao") {
    const url = `https://kauth.kakao.com/oauth/logout?client_id=${process.env.KAKAO_CLIENT_ID}&logout_redirect_uri=${process.env.KAKAO_LOGOUT_REDIRECT_URL}`;
    return res.send(url);
  }

  if (flatform === "naver") {
    const response = await naverLogout();
    if (response.data.result === "success") {
      req.session.user = null;
    }

    //TODO: 성공이 아니면 에러페이지로 넘어가게 했으면 좋겠음
    return res.send("/");
  }
};

const kakaoLogoutCallback = (req, res) => {
  req.session.user = null;
  return res.redirect(process.env.HOST_NAME);
};

const naverLogout = () => {
  const url = `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${
    process.env.NAVER_CLIENT_ID
  }&client_secret=${
    process.env.NAVER_CLIENT_SECRETS
  }&access_token=${auth.getAccessToken()}&service_provider=NAVER`;

  return axios({
    method: "GET",
    url,
    headers: { "Content-type": "application/x-www-form-urlencoded" },
  });
};

const postCreatePlace = (req, res) => {
  const placeList = req.body;
  if (placeList.length === 0) return res.json({ result: [] });

  const query = placeList.reduce(
    (acc, cur) => {
      acc.insert += `INSERT IGNORE INTO place(place_id, position_x, position_y, place_name, place_url, address, category_name) VALUES('${cur.id}', ${cur.x}, ${cur.y}, '${cur["place_name"]}','${cur["place_url"]}', '${cur["road_address_name"]}' ,'${cur["category_group_name"]}');`;
      acc.select += `SELECT place_id, COUNT(*) as review_count, AVG(star) as star from info where place_id='${cur.id}';`;
      return acc;
    },
    { insert: "", select: "" }
  );

  const updateViewQuery = `alter view info as select B.review_id, B.place_id, B.user_id, B.star  from place A RIGHT JOIN review B on A.place_id = B.place_id;`;

  return sendQuery(query.insert, () => {
    return sendQuery(updateViewQuery, () => {
      return sendQuery(query.select, (result) => {
        const resultArr = Array.from(result).map((e) => e[0]);
        return res.json({ result: resultArr });
      });
    });
  });
};

const getUserBookmark = (req, res) => {
  const userId = req.session.user;
  const query = `select place_id, place_name, position_x, position_y, star_average from bookmark_place_info where user_id =${userId}`;

  return sendQuery(query, (result) => {
    return res.json({ result });
  });
};

const postUserBookmark = (req, res) => {
  const { placeId } = req.body;
  const query = `INSERT INTO bookmark(user_id, place_id) VALUES(${req.session.user},${placeId}) `;

  return sendQuery(query, (result) => {
    return res.status(201);
  });
};

const deleteUserBookmark = (req, res) => {
  const query = `DELETE FROM bookmark WHERE place_id="${req.params.id}" AND user_id="${req.session.user}"`;

  return sendQuery(query, () => {
    return res.status(200);
  });
};

const getReviewContent = (req, res) => {
  const query = `select * from detail_content`;

  return sendQuery(query, (result) => {
    const resultArr = Array.from(result);
    return res.json({ result: resultArr });
  });
};

const getReviewInfo = (req, res) => {
  if (!req.session.reviewInfo) {
    req.session.reviewInfo = {
      reviewedList: [],
      today: Date.now(),
    };
  }

  res.json({ result: req.session.reviewInfo });
};

const postReviewInfo = (req, res) => {
  const { reviewedList, today } = req.body;
  req.session.reviewInfo = {
    reviewedList,
    today,
  };

  res.status(201);
};

const patchReviewedList = (req, res) => {
  if (!req.session.reviewInfo.reviewedList) return;

  const { x, y } = req.body;
  req.session.reviewInfo.reviewedList.push({ x, y });
  res.json({ reviewedList: req.session.reviewInfo.reviewedList });
};

const postUserReview = (req, res) => {
  const { place_id, star, detailReviewIdList } = req.body;
  const insertReviewQuery = `INSERT INTO review(user_id, place_id, star, date) VALUES('${req.session.user}','${place_id}','${star}', NOW() )`;

  return sendQuery(insertReviewQuery, (result) => {
    const review_id = result.insertId;

    const insertReviewDetailQuery = detailReviewIdList.reduce(
      (acc, cur) => {
        acc += `INSERT INTO review_detail(review_id, detail_content_id) VALUES('${review_id}','${cur}' );`;

        return acc;
      },
      ""
    );

    return sendQuery(insertReviewDetailQuery, () => {
      res.status(201);
    });
  });
};

const getMyReview = (req, res) => {
  const query = `select distinct review_id, place_id, star, date, place_name from total_review_info where user_id =${req.session.user} order by date desc;`;

  return sendQuery(query, (result) => {
    const uniqueDateList = [
      ...new Set(
        result.map((review) =>
          moment(review.date).format("YYYY-MM-DD")
        )
      ),
    ];

    const userReviewInfo = uniqueDateList.reduce((acc, cur) => {
      const list = result.filter(
        (review) => moment(review.date).format("YYYY-MM-DD") === cur
      );
      acc.push({ date: cur, list });
      return acc;
    }, []);

    res.send(userReviewInfo);
  });
};

const getPlaceInfo = (req, res) => {
  const selectDetailContentList = `select detail_content_id from detail_content;`;

  return sendQuery(selectDetailContentList, (contentList) => {
    const contentIdList = contentList.map(
      (content) => content.detail_content_id
    );

    let bagicQuery = `select star_average from place where place_id="${req.params.id}";
    select place_id, COUNT(*) as count from total_review_info where place_id="${req.params.id}";`;

    const query = contentIdList.reduce((acc, cur) => {
      acc += `select detail_content_id, COUNT(*) as count from (SELECT detail_content_id from total_review_info where place_id="${req.params.id}") select_review where detail_content_id ="${cur}";`;
      return acc;
    }, bagicQuery);

    return sendQuery(query, (result) => {
      const response = result.reduce(
        (acc, [cur]) => {
          if (cur.hasOwnProperty("detail_content_id")) {
            acc.contentReviewCountList[cur.detail_content_id] =
              cur.count;
            return acc;
          } else if (cur.hasOwnProperty("star_average")) {
            acc.star_avg = cur.star_average;
            return acc;
          } else {
            acc.review_count = cur.count;
            return acc;
          }
        },
        {
          star_avg: 0,
          review_count: 0,
          contentReviewCountList: {},
        }
      );
      res.send(response);
    });
  });
};

module.exports = {
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
  getReviewInfo,
  postReviewInfo,
  patchReviewedList,
  postUserReview,
  getMyReview,
  getPlaceInfo,
  getLogout,
  kakaoLogoutCallback,
};
