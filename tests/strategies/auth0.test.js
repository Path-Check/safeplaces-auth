const jwt = require('jsonwebtoken');
const strategies = require('../../src/strategies');
const keyPair = require('../mocks/keypair');
const JWKSClient = require('../mocks/jwksclient');

describe('auth0 strategy', () => {
  const userId = 'user1';
  const userRole = 'role1';

  const passphrase = 'xyz';
  const { keyId, privateKey, publicKey } = keyPair.generate(passphrase);

  const apiAudience = 'https://example.com/';
  const jwtClaims = {
    sub: userId,
    role: userRole,
  };

  it('throws an error when the JWKS client is missing', () => {
    try {
      const strategy = new strategies.Auth0({
        apiAudience: 'https://example.com/',
      });
      expect(strategy).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('JWKS client is required');
    }
  });

  it('enables verbose logging when the environment variable is set', () => {
    const jwksClient = new JWKSClient({
      keyId: 'nop',
      publicKey,
    });

    process.env.AUTH_LOGGING = 'verbose';
    const strategy = new strategies.Auth0({
      jwksClient,
      apiAudience,
    });
    delete process.env.AUTH_LOGGING;

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

    // Mock `console.log` implementation.
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    return strategy
      .validate(token)
      .then(decoded => {
        expect(decoded).toBeUndefined();
      })
      .catch(() => {
        expect(console.log.mock.calls[0][0].message).toEqual('Key id mismatch');
        // Restore `console.log` implementation.
        console.log = originalConsoleLog;
      });
  });

  it('rejects the JWT when get signing key throws an error', () => {
    const jwksClient = new JWKSClient({
      keyId: 'nop',
      publicKey,
    });

    const strategy = new strategies.Auth0({
      jwksClient,
      apiAudience,
    });

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
        expect(decoded).toBeUndefined();
      })
      .catch(err => {
        expect(err.message).toEqual(
          'error in secret or public key callback: Key id mismatch',
        );
      });
  });

  it('rejects an invalid JWT', () => {
    const jwksClient = new JWKSClient({
      keyId,
      publicKey,
    });

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
    const jwksClient = new JWKSClient({
      keyId,
      publicKey,
    });

    const strategy = new strategies.Auth0({
      jwksClient,
      apiAudience,
    });

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
