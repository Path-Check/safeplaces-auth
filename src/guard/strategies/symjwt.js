const ow = require('ow');
const jwt = require('jsonwebtoken');

module.exports = config => {
  try {
    ow(
      config,
      'symJWT strategy config',
      ow.object.exactShape({
        algorithm: ow.string.oneOf(['HS256', 'RS256']),
        privateKey: ow.string,
      }),
    );
  } catch (e) {
    throw new Error(e.message);
  }

  return accessToken =>
    jwt.verify(accessToken, config.privateKey, {
      algorithm: config.algorithm,
    });
};
