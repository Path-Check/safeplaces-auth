function sourceCookie(req) {
  if (!req.cookies) {
    throw new Error('No cookies found');
  }
  const accessToken = req.cookies['auth_token'] || req.cookies['access_token'];
  if (!accessToken) {
    throw new Error('No access token found in cookie');
  }
  return accessToken;
}

function sourceHeader(req) {
  if (!req.headers) {
    throw new Error('No headers found');
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    throw new Error('No authorization header found');
  }
  if (!/^Bearer /.test(authHeader)) {
    throw new Error('No access token found in header');
  }
  return authHeader.replace('Bearer ', '').trim();
}

module.exports = {
  sourceCookie,
  sourceHeader,
};
