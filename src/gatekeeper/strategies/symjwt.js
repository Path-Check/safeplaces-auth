const assert = require('assert');
const jwt = require('jsonwebtoken');

class SymJWT {
  constructor(params) {
    assert.ok(params, 'symmetric JWT parameters are required');

    const { algorithm, privateKey } = params;
    assert.ok(algorithm, 'JWT signing algorithm is required');
    assert.ok(privateKey, 'JWT private key is required');

    this.algorithms = Array.isArray(algorithm) ? algorithm : [algorithm];
    this.privateKey = privateKey;
  }

  validate(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.privateKey,
        {
          algorithms: this.algorithms,
        },
        (err, decoded) => {
          if (err) return reject(err);
          return resolve(decoded);
        },
      );
    });
  }
}

module.exports = SymJWT;
