const timeout = require('./timeout');

class JwksClient {
  constructor({ keyId, publicKey }) {
    this.keyId = keyId;
    this.publicKey = publicKey;
  }

  async getSigningKey(keyId) {
    await timeout(0);
    if (this.keyId !== keyId) {
      throw new Error('Key id mismatch');
    }
    return this.publicKey;
  }
}

module.exports = JwksClient;
