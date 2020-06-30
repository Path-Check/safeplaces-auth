const Enforcer = require('../src/enforcer');
const userGetter = require('./mocks/usergetter');
const Strategy = require('./mocks/strategy');
const Application = require('./mocks/application');

jest.mock('../src/strategies');

describe('enforcer', () => {
  it('throws an error when the strategy is missing', () => {
    try {
      const enforcer = new Enforcer({
        userGetter: () => null,
      });
      expect(enforcer).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('Enforcer strategy is required');
    }
  });

  it('throws an error when the user getter is missing', () => {
    try {
      const enforcer = new Enforcer({
        strategy: new Strategy(),
      });
      expect(enforcer).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('Enforcer user getter is required');
    }
  });
});

describe('setup', () => {
  const enforcer = new Enforcer({
    strategy: new Strategy(),
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
    strategy: new Strategy(),
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

  it('allows authorized requests', () => {
    const userId = 'user1';
    const userRole = 'role1';
    const actualUser = {
      id: userId,
      role: userRole,
    };
    const jwtClaims = {
      sub: userId,
      role: userRole,
    };

    const strategy = new Strategy(jwtClaims);
    const enforcer = new Enforcer({
      strategy,
      userGetter: async () => {
        return userGetter(actualUser);
      },
    });

    const token = 'abc';
    const req = {
      cookies: {
        access_token: token,
      },
    };

    return enforcer.processRequest(req).then(allow => {
      expect(allow).toBe(true);
      expect(strategy.validate).toBeCalledTimes(1);
      expect(strategy.validate).toBeCalledWith(token);

      const { user: testUser } = req;
      expect(testUser).toBeDefined();
      expect(testUser).toMatchObject(actualUser);
    });
  });
});
