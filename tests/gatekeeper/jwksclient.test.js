const jwks = require('jwks-rsa');
const JWKSClient = require('../../src/gatekeeper/jwksclient');

jest.mock('jwks-rsa', () => jest.fn());

describe('JWKS client', () => {
  it('throws an error when the JWKS URI is missing', () => {
    try {
      const jwksClient = new JWKSClient();
      expect(jwksClient).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('JWKS URI is required');
    }
  });

  it('gets the signing key on fetch success', () => {
    const keyId = 'abc';
    const signingKey = 'xyz';
    const jwksClient = new JWKSClient('https://example.com/', {
      getSigningKey: jest.fn((testKeyId, callback) => {
        expect(testKeyId).toEqual(keyId);
        callback(null, {
          getPublicKey: () => signingKey,
        });
      }),
    });

    return jwksClient
      .getSigningKey(keyId)
      .then(testKey => {
        expect(testKey).toEqual(signingKey);
      })
      .catch(err => expect(err).toBeUndefined());
  });

  it('throws an error on fetch failure', () => {
    const keyId = 'abc';
    const fetchError = new Error('Signing key fetch failure');
    const jwksClient = new JWKSClient('https://example.com/', {
      getSigningKey: jest.fn((testKeyId, callback) => {
        expect(testKeyId).toEqual(keyId);
        callback(fetchError);
      }),
    });

    return jwksClient
      .getSigningKey(keyId)
      .then(testKey => {
        expect(testKey).toBeUndefined();
      })
      .catch(err => expect(err).toBe(fetchError));
  });

  it('it creates a jwks RSA client when one is not given', () => {
    const jwksClient = new JWKSClient('https://example.com/');
    expect(jwksClient).toBeDefined();
    expect(jwks).toHaveBeenCalledTimes(1);
  });
});
