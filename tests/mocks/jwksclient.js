const timeout = require('./timeout');

class JWKSClient {
  constructor({ keyId, publicKey }) {
    this.keyId = keyId;
    this.publicKey = publicKey;
  }

  async getSigningKey(keyId) {
    await timeout(0);
    if (this.keyId !== keyId) {
      throw new Error('key id mismatch');
    }
    return this.publicKey;
  }
}

module.exports = JWKSClient;
