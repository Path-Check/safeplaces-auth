const jwks = require('jwks-rsa');

class JwksClient {
  constructor(jwksUri) {
    this.jwksClient = jwks({
      strictSsl: true,
      jwksUri,
    });
  }

  getSigningKey(keyId) {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(keyId, (err, key) => {
        if (err) return reject(err);
        const signingKey = key.getPublicKey();
        return resolve(signingKey);
      });
    });
  }
}

module.exports = JwksClient;
