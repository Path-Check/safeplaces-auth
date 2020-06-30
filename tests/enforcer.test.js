const jwt = require('jsonwebtoken');
const keyPair = require('./mocks/keypair');
const userGetter = require('./mocks/usergetter');
const strategies = require('../src/strategies');
const JwksClient = require('./mocks/jwksclient');
const Enforcer = require('../src/enforcer');
const Application = require('./mocks/application');

describe('setup', () => {
  const enforcer = new Enforcer({
    strategy: new strategies.SymJWT({
      algorithm: 'HS256',
      privateKey: 'xyz',
    }),
    userGetter: () => null,
  });

  it('adds a middleware to the Express app', () => {
    const app = new Application();
    enforcer.secure(app);
    expect(app.use).toBeCalledTimes(1);
  });
});

describe('process request', () => {
  const enforcer = new Enforcer({
    strategy: new strategies.SymJWT({
      algorithm: 'HS256',
      privateKey: 'xyz',
    }),
    userGetter: () => null,
  });

  describe('rejects unauthorized requests', () => {
    const requests = [
      {},
      {
        headers: {},
      },
      {
        headers: { authorization: 'Basic xyz' },
      },
      {
        headers: { authorization: 'Bearer xyz' },
      },
    ];
    test.each(requests)('when the request is %j', req => {
      return enforcer
        .processRequest(req)
        .then(allow => expect(allow).toBe(false));
    });
  });

  describe('allows authorized requests', () => {
    test('when the strategy is symmetric JWT', () => {
      const privateKey = 'xyz';

      const userId = 'user1';
      const userRole = 'role1';
      const actualUser = {
        id: userId,
        role: userRole,
      };

      const enforcer = new Enforcer({
        strategy: new strategies.SymJWT({
          algorithm: 'HS256',
          privateKey,
        }),
        userGetter: async () => {
          return userGetter(actualUser);
        },
      });

      const token = jwt.sign(
        {
          sub: userId,
          role: userRole,
        },
        privateKey,
        {
          expiresIn: '1h',
        },
      );

      const req = {
        cookies: {
          access_token: token,
        },
      };

      return enforcer.processRequest(req).then(allow => {
        expect(allow).toBe(true);

        const { user: testUser } = req;
        expect(testUser).toBeDefined();
        expect(testUser).toMatchObject(actualUser);
      });
    });

    test('when the strategy is Auth0', () => {
      const userId = 'user1';
      const userRole = 'role1';

      const actualUser = {
        id: userId,
        role: userRole,
      };

      const passphrase = 'xyz';
      const { keyId, publicKey, privateKey } = keyPair.generate(passphrase);

      const jwksClient = new JwksClient({
        keyId,
        publicKey,
      });
      const apiAudience = 'https://example.com/';

      const enforcer = new Enforcer({
        strategy: new strategies.Auth0({
          jwksClient,
          apiAudience,
        }),
        userGetter: () => {
          return userGetter(actualUser);
        },
      });

      const token = jwt.sign(
        {
          sub: userId,
          role: userRole,
        },
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

      const req = {
        cookies: {
          access_token: token,
        },
      };

      return enforcer.processRequest(req).then(allow => {
        expect(allow).toBe(true);

        const { user: testUser } = req;
        expect(testUser).toBeDefined();
        expect(testUser).toMatchObject(actualUser);
      });
    });
  });
});
