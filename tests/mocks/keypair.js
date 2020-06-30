const crypto = require('crypto');

function generate(passphrase) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase,
    },
  });

  const keyId = crypto.createHash('sha256').update(publicKey).digest('hex');
  return {
    keyId,
    publicKey,
    privateKey,
  };
}

module.exports = { generate };
