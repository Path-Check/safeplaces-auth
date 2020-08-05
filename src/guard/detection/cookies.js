const WError = require('../../utils/werror');

module.exports = req => {
  if (!req.cookies) {
    throw new WError({
      name: 'MissingCookiesError',
      message: 'No cookies found',
    });
  }

  const accessToken = req.cookies['auth_token'] || req.cookies['access_token'];
  if (!accessToken) {
    throw new WError({
      name: 'MissingAccessTokenCookieError',
      message: 'No access token found in cookie',
    });
  }

  return accessToken;
};
