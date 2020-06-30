const jwt = require('jsonwebtoken');
const strategies = require('../../src/strategies');

describe('symmetric JWT strategy', () => {
  it('throws an error when the algorithm is missing', () => {
    try {
      const strategy = new strategies.SymJWT({
        privateKey: 'xyz',
      });
      expect(strategy).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('JWT signing algorithm is required');
    }
  });

  it('throws an error when the private key is missing', () => {
    try {
      const strategy = new strategies.SymJWT({
        algorithm: 'HS256',
      });
      expect(strategy).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('JWT private key is required');
    }
  });

  it('accepts an array of algorithms', () => {
    const privateKey = 'xyz';

    try {
      const strategy = new strategies.SymJWT({
        algorithm: ['HS256', 'ES256'],
        privateKey,
      });
      expect(strategy).toBeDefined();
    } catch (e) {
      expect(e).toBeUndefined();
    }
  });

  it('rejects an invalid JWT', () => {
    const privateKey = 'xyz';

    const strategy = new strategies.SymJWT({
      algorithm: 'HS256',
      privateKey,
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

    const privateKey = 'xyz';

    const strategy = new strategies.SymJWT({
      algorithm: 'HS256',
      privateKey,
    });

    const jwtClaims = {
      sub: userId,
      role: userRole,
    };

    const token = jwt.sign(jwtClaims, privateKey, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

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
