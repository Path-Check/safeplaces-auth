const jwt = require('jsonwebtoken');
const Issuer = require('../src/issuer');

describe('token issuer', () => {
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
