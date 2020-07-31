const assert = require('assert');
const jwt = require('jsonwebtoken');

class Issuer {
  constructor(params) {
    assert.ok(params, 'JWT issuer parameters are required');

    const { privateKey, algorithm } = params;
    assert.ok(privateKey, 'private key is required');

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
