const errors = require('./errors');

function sourceCookie(req) {
  if (!req.cookies) {
    throw errors.construct('MissingCookies', 'No cookies found');
  }
  const accessToken = req.cookies['auth_token'] || req.cookies['access_token'];
  if (!accessToken) {
    throw errors.construct(
      'MissingAccessTokenCookie',
      'No access token found in cookie',
    );
  }
  return accessToken;
}

function sourceHeader(req) {
  if (!req.headers) {
    throw errors.construct('MissingHeaders', 'No headers found');
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    throw errors.construct(
      'MissingAuthorizationHeader',
      'No authorization header found',
    );
  }
  if (!/^Bearer /.test(authHeader)) {
    throw errors.construct(
      'MissingAccessTokenHeader',
      'No access token found in header',
    );
  }
  return authHeader.replace('Bearer ', '').trim();
}

module.exports = {
  sourceCookie,
  sourceHeader,
};
