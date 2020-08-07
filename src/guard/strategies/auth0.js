const jwt = require('jsonwebtoken');
const jwks = require('jwks-rsa');
const ow = require('ow');

module.exports = config => {
  try {
    ow(
      config,
      'auth0 strategy config',
      ow.object.exactShape({
        apiAudience: ow.string,
        jwksUri: ow.string,
      }),
    );
  } catch (e) {
    throw new Error(e.message);
  }

  const jwksClient = jwks({
    strictSsl: true,
    jwksUri: config.jwksUri,
  });

  const publicKeyGetter = (header, callback) => {
    jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
      }
      callback(null, key.getPublicKey());
    });
  };

  return accessToken =>
    new Promise((resolve, reject) => {
      jwt.verify(
        accessToken,
        publicKeyGetter,
        {
          audience: config.apiAudience,
          algorithms: ['RS256', 'HS256'],
        },
        (err, decoded) => {
          if (err) {
            return reject(err);
          }
          resolve(decoded);
        },
      );
    });
};
