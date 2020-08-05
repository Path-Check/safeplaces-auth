const jwt = require('jsonwebtoken');

const issueRegistrationToken = (privateKey, subject, expiresIn) => {
  return jwt.sign(
    {
      sub: subject,
    },
    privateKey,
    {
      algorithm: 'HS256',
      expiresIn,
    },
  );
};

const decodeRegistrationToken = (privateKey, token) => {
  return jwt.verify(token, privateKey, { algorithms: ['HS256'] });
};

module.exports = {
  issueRegistrationToken,
  decodeRegistrationToken,
};
