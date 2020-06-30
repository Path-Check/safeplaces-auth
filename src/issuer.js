const jwt = require('jsonwebtoken');

class Issuer {
  constructor({ privateKey, algorithm }) {
    if (!privateKey) {
      throw new Error('Private key is required.');
    }
    this.privateKey = privateKey;
    this.algorithm = algorithm || 'HS256';
  }

  signJWT({ subject, role, expiresIn }) {
    return jwt.sign(
      {
        sub: subject,
        role: role,
      },
      this.privateKey,
      {
        expiresIn,
        algorithm: this.algorithm,
      },
    );
  }
}

module.exports = Issuer;
