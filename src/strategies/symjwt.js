const jwt = require('jsonwebtoken');

class SymJWTStrategy {
  constructor({ algorithm, privateKey }) {
    if (!algorithm) {
      throw new Error('JWT signing algorithm is required');
    }
    if (!privateKey) {
      throw new Error('JWT private key is required');
    }

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

module.exports = SymJWTStrategy;
