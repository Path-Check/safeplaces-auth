const WError = require('../../common/werror');
const assert = require('assert');
const jwt = require('jsonwebtoken');

class Auth0 {
  constructor(params) {
    assert.ok(params, 'Auth0 parameters are required');

    const { jwksClient, apiAudience } = params;
    assert.ok(jwksClient, 'JWKS client is required');
    assert.ok(apiAudience, 'API audience is required');

    this.jwksClient = jwksClient;
    this.apiAudience = apiAudience;
    this.verbose = process.env.AUTH_LOGGING === 'verbose';

    this.publicKeyGetter = (header, callback) => {
      this.jwksClient
        .getSigningKey(header.kid)
        .then(key => callback(null, key))
        .catch(err => {
          return callback(
            new WError({
              cause: err,
              name: 'JWKSClientError',
              message: 'error in secret or public key callback',
            }),
          );
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
            return reject(
              new WError({
                cause: err,
                name: 'JWTValidationError',
                message: 'JWT validation failed',
              }),
            );
          }

          return resolve(decoded);
        },
      );
    });
  }
}

module.exports = Auth0;
