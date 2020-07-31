const jwt = require('jsonwebtoken');
const Issuer = require('../../src/gatekeeper/issuer');

describe('token issuer', () => {
  it('throws an error when the private key is missing', () => {
    try {
      const issuer = new Issuer({});
      expect(issuer).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('private key is required');
    }
  });

  it('signs a valid JWT', () => {
    const privateKey = 'xyz';
    const issuer = new Issuer({ privateKey });

    const subject = 'user1';
    const token = issuer.signJWT({ subject, expiresIn: '1h' });

    let decoded;
    try {
      decoded = jwt.verify(token, privateKey);
    } catch (e) {
      expect(e).toBeUndefined();
    }

    expect(decoded.sub).toEqual(subject);
  });
});
