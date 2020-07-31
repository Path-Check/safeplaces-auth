const timeout = require('../mocks/timeout');
const Response = require('../mocks/response');
const Enforcer = require('../../src/gatekeeper/enforcer');
const userGetter = require('../mocks/usergetter');
const Strategy = require('../mocks/strategy');
const Application = require('../mocks/application');

jest.mock('../../src/gatekeeper/strategies');

describe('enforcer', () => {
  it('throws an error when the strategy is missing', () => {
    try {
      const enforcer = new Enforcer({
        userGetter: () => null,
      });
      expect(enforcer).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('enforcer strategy is required');
    }
  });

  it('throws an error when the user getter is missing', () => {
    try {
      const enforcer = new Enforcer({
        strategy: new Strategy(),
      });
      expect(enforcer).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('enforcer user getter is required');
    }
  });

  it('enables verbose logging when the environment variable is set', () => {
    process.env.AUTH_LOGGING = 'verbose';
    const enforcer = new Enforcer({
      strategy: new Strategy(),
      userGetter: () => null,
    });
    delete process.env.AUTH_LOGGING;

    const mockError = new Error('Unauthorized');
    enforcer.processRequest = jest.fn(async () => {
      await timeout(0);
      throw mockError;
    });

    // Mock `console.log` implementation.
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    const res = new Response();
    return enforcer
      .handleRequest({}, res, jest.fn())
      .then(() => {
        expect(console.log).toHaveBeenCalledWith(mockError);
        // Restore `console.log` implementation.
        console.log = originalConsoleLog;

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith('Forbidden');
      })
      .catch(err => {
        expect(err).toBeUndefined();
      });
  });

  it('throws an error when the authorizer is not a function', () => {
    try {
      const enforcer = new Enforcer({
        strategy: new Strategy(),
        userGetter: () => null,
        authorizer: 1,
      });
      expect(enforcer).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('enforcer authorizer must be a function');
    }
  });
});

describe('setup', () => {
  it('adds a middleware to the Express app', () => {
    const enforcer = new Enforcer({
      strategy: new Strategy(),
      userGetter: () => null,
    });
    const app = new Application();
    enforcer.secure(app);
    expect(app.use).toBeCalledTimes(1);
  });

  it('triggers the middleware on an incoming request', () => {
    const app = new Application();
    const enforcer = new Enforcer({
      strategy: new Strategy(),
      userGetter: () => null,
    });
    enforcer.handleRequest = jest.fn(async req => {
      await timeout(0);
      return req.allow;
    });
    enforcer.secure(app);

    const res = new Response();
    // Spoof an incoming request.
    app._handle(
      {
        allow: true,
      },
      res,
      jest.fn(),
    );

    expect(enforcer.handleRequest).toHaveBeenCalledTimes(1);
  });
});

describe('handle request', () => {
  it('allows the request when it is authorized', () => {
    const enforcer = new Enforcer({
      strategy: new Strategy(),
      userGetter: () => null,
    });
    enforcer.processRequest = async req => {
      await timeout(0);
      return req.allow;
    };

    const res = new Response();
    const next = jest.fn();
    return enforcer
      .handleRequest(
        {
          allow: true,
        },
        res,
        next,
      )
      .then(() => {
        expect(res.status).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
      })
      .catch(err => {
        expect(err).toBeUndefined();
      });
  });

  it('allows the request when it is authorized and no next function is given', () => {
    const enforcer = new Enforcer({
      strategy: new Strategy(),
      userGetter: () => null,
    });
    enforcer.processRequest = async req => {
      await timeout(0);
      return req.allow;
    };

    const res = new Response();
    return enforcer
      .handleRequest(
        {
          allow: true,
        },
        res,
      )
      .then(() => {
        expect(res.status).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
      })
      .catch(err => {
        expect(err).toBeUndefined();
      });
  });

  it('rejects the request when it is unauthorized', () => {
    const enforcer = new Enforcer({
      strategy: new Strategy(),
      userGetter: () => null,
    });
    enforcer.processRequest = jest.fn(async () => {
      await timeout(0);
      throw new Error('unauthorized');
    });

    const res = new Response();
    return enforcer
      .handleRequest({}, res, jest.fn())
      .then(() => {
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith('Forbidden');
      })
      .catch(err => {
        expect(err).toBeUndefined();
      });
  });
});

describe('process request', () => {
  describe('rejects unauthorized requests', () => {
    const enforcer = new Enforcer({
      strategy: new Strategy(),
      userGetter: () => null,
    });
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
      {
        cookies: {},
      },
      {
        cookies: { access_token: '' },
      },
    ];
    test.each(requests)('when the request is %j', req => {
      return expect(enforcer.processRequest(req)).rejects.toBeDefined();
    });

    test('when a token validation error is thrown', () => {
      const validate = async () => {
        await timeout(0);
        throw new Error('validation error');
      };
      const enforcer = new Enforcer({
        strategy: { validate },
        userGetter: () => null,
      });

      return expect(
        enforcer.processRequest({
          cookies: {
            access_token: 'xyz',
          },
        }),
      ).rejects.toBeDefined();
    });
  });

  describe('allows authorized requests', () => {
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

    const token = 'abc';
    const req = {
      cookies: {
        access_token: token,
      },
    };

    function expectedResult(enforcer, strategy) {
      const checkCSRF = Enforcer.checkCSRF;
      Enforcer.checkCSRF = jest.fn();

      return enforcer
        .processRequest(req)
        .then(() => {
          expect(strategy.validate).toBeCalledTimes(1);
          expect(strategy.validate).toBeCalledWith(token);

          const { user: testUser } = req;
          expect(testUser).toBeDefined();
          expect(testUser).toMatchObject(actualUser);
        })
        .finally(() => {
          Enforcer.checkCSRF = checkCSRF;
        });
    }

    test('when the strategy is static', () => {
      const strategy = new Strategy(jwtClaims);
      const enforcer = new Enforcer({
        strategy,
        userGetter: async () => {
          return userGetter(actualUser);
        },
      });

      return expectedResult(enforcer, strategy);
    });

    test('when the strategy is dynamic and synchronous', () => {
      const strategy = new Strategy(jwtClaims);
      const enforcer = new Enforcer({
        strategy: () => strategy,
        userGetter: async () => {
          return userGetter(actualUser);
        },
      });

      return expectedResult(enforcer, strategy);
    });

    test('when the strategy is dynamic and asynchronous', () => {
      const strategy = new Strategy(jwtClaims);
      const enforcer = new Enforcer({
        strategy: async () => {
          await timeout(0);
          return strategy;
        },
        userGetter: async () => {
          return userGetter(actualUser);
        },
      });

      return expectedResult(enforcer, strategy);
    });
  });

  it('executes the authorizer function', () => {
    const decoded = { id: 1 };
    const user = { id: 2 };
    const authorizer = jest.fn();

    const enforcer = new Enforcer({
      strategy: new Strategy(decoded),
      userGetter: () => user,
      authorizer,
    });

    const req = { cookies: { access_token: 'xyz' } };

    const checkCSRF = Enforcer.checkCSRF;
    Enforcer.checkCSRF = jest.fn();

    return enforcer
      .processRequest(req)
      .then(() => {
        expect(authorizer).toHaveBeenCalledTimes(1);
        expect(authorizer).toHaveBeenCalledWith(decoded, req);
      })
      .finally(() => {
        Enforcer.checkCSRF = checkCSRF;
      });
  });
});

describe('CSRF check', () => {
  describe('throws an error', () => {
    const testTable = [
      [{}, 'no headers found'],
      [{ headers: {} }, 'x-requested-with header not found'],
      [
        {
          headers: { 'x-requested-with': 1 },
        },
        'invalid value in x-requested-with header: 1',
      ],
    ];

    test.each(testTable)('when the request is %j', (req, msg) => {
      try {
        Enforcer.checkCSRF(req);
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toEqual(msg);
      }
    });
  });

  describe('does not throw an error when the request is valid', () => {
    Enforcer.checkCSRF({
      headers: {
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    expect(true).toBe(true);
  });
});
