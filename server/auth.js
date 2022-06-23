const Auth = () => {
  this.accessToken = null;
  this.flatform = null;

  const getAccessToken = () => {
    return this.accessToken;
  };

  const updateAccessToken = (newAccessToken) => {
    this.setAccessToken(newAccessToken);
  };

  const getFlatform = () => {
    return this.flatform;
  };

  const updateFlatform = (newFlatform) => {
    this.setFlatform(newFlatform);
  };

  this.setAccessToken = function (newAccessToken) {
    this.accessToken = newAccessToken;
  };

  this.setFlatform = function (newFlatform) {
    this.flatform = newFlatform;
  };

  return {
    getAccessToken,
    updateAccessToken,
    getFlatform,
    updateFlatform,
  };
};

module.exports = Auth;
