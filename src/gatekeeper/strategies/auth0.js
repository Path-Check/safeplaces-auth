const jwt = require('jsonwebtoken');
const errors = require('../errors');

class Auth0 {
  constructor({ jwksClient, apiAudience }) {
    if (!jwksClient) {
      throw new Error('JWKS client is required');
    }

    this.jwksClient = jwksClient;
    this.apiAudience = apiAudience;
    this.verbose = process.env.AUTH_LOGGING === 'verbose';

    this.publicKeyGetter = (header, callback) => {
      this.jwksClient
        .getSigningKey(header.kid)
        .then(key => callback(null, key))
        .catch(err => {
          if (this.verbose) {
            console.log(err);
          }
          return callback(errors.construct('JSONWebKeySet', err.message));
        });
    };
  }

  validate(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.publicKeyGetter,
        {
          audience: this.apiAudience,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            if (
              err.message.startsWith('error in secret or public key callback')
            ) {
              return reject(errors.construct('JSONWebKeySet', err.message));
            } else {
              return reject(errors.construct('JSONWebToken', err.message));
            }
          }

          return resolve(decoded);
        },
      );
    });
  }
}

module.exports = Auth0;
