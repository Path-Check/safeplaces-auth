const jwt = require('jsonwebtoken');
const strategies = require('../../src/strategies');
const keyPair = require('../mocks/keypair');
const JwksClient = require('../mocks/jwksclient');

describe('auth0 strategy', () => {
  it('validates a JWT', () => {
    const userId = 'user1';
    const userRole = 'role1';

    const passphrase = 'xyz';
    const { keyId, publicKey, privateKey } = keyPair.generate(passphrase);

    const jwksClient = new JwksClient({
      keyId,
      publicKey,
    });
    const apiAudience = 'https://example.com/';

    const strategy = new strategies.Auth0({
      jwksClient,
      apiAudience,
    });

    const jwtClaims = {
      sub: userId,
      role: userRole,
    };

    const token = jwt.sign(
      jwtClaims,
      {
        key: privateKey,
        passphrase,
      },
      {
        audience: apiAudience,
        algorithm: 'RS256',
        keyid: keyId,
        expiresIn: '1h',
      },
    );

    return strategy.validate(token).then(decoded => {
      expect(decoded).toMatchObject(jwtClaims);
    });
  });
});
