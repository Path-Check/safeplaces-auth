const jwt = require('jsonwebtoken');

const issueUpdateToken = (privateKey, audience, subject, expiresIn) => {
  return jwt.sign(
    {
      sub: subject,
    },
    privateKey,
    {
      algorithm: 'HS256',
      audience,
      expiresIn,
    },
  );
};

const decodeUpdateToken = (privateKey, audience, token) => {
  return jwt.verify(token, privateKey, { algorithms: ['HS256'], audience });
};

module.exports = {
  issueUpdateToken,
  decodeUpdateToken,
};
