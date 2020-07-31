const WError = require('../common/werror');

function sourceCookie(req) {
  if (!req.cookies) {
    throw new WError({
      name: 'MissingCookiesError',
      message: 'no cookies found',
    });
  }
  const accessToken = req.cookies['auth_token'] || req.cookies['access_token'];
  if (!accessToken) {
    throw new WError({
      name: 'MissingAccessTokenCookieError',
      message: 'no access token found in cookie',
    });
  }
  return accessToken;
}

function sourceHeader(req) {
  if (!req.headers) {
    throw new WError({
      name: 'MissingHeadersError',
      message: 'no headers found',
    });
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    throw new WError({
      name: 'MissingAuthorizationHeaderError',
      message: 'no authorization header found',
    });
  }
  if (!/^Bearer /.test(authHeader)) {
    throw new WError({
      name: 'MissingAccessTokenHeaderError',
      message: 'no access token found in header',
    });
  }
  return authHeader.replace('Bearer ', '').trim();
}

module.exports = {
  sourceCookie,
  sourceHeader,
};
