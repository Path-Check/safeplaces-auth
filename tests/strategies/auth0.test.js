const jwt = require('jsonwebtoken');
const strategies = require('../../src/strategies');
const keyPair = require('../mocks/keypair');
const JWKSClient = require('../mocks/jwksclient');

describe('auth0 strategy', () => {
  it('throws an error if the JWKS client is missing', () => {
    try {
      const strategy = new strategies.Auth0({
        apiAudience: 'https://example.com/',
      });
      expect(strategy).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('JWKS client is required');
    }
  });

  it('rejects an invalid JWT', () => {
    const passphrase = 'xyz';
    const { keyId, publicKey } = keyPair.generate(passphrase);

    const jwksClient = new JWKSClient({
      keyId,
      publicKey,
    });
    const apiAudience = 'https://example.com/';

    const strategy = new strategies.Auth0({
      jwksClient,
      apiAudience,
    });

    return strategy
      .validate('abc')
      .then(decoded => {
        expect(decoded).toBeUndefined();
      })
      .catch(err => {
        expect(err.message).toBeDefined();
      });
  });

  it('decodes a valid JWT', () => {
    const userId = 'user1';
    const userRole = 'role1';

    const passphrase = 'xyz';
    const { keyId, publicKey, privateKey } = keyPair.generate(passphrase);

    const jwksClient = new JWKSClient({
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

    return strategy
      .validate(token)
      .then(decoded => {
        expect(decoded).toMatchObject(jwtClaims);
      })
      .catch(err => {
        expect(err).toBeUndefined();
      });
  });
});
