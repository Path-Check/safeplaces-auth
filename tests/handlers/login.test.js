const fetch = require('node-fetch');
const timeout = require('../mocks/timeout');
const Response = require('../mocks/response');
const handlers = require('../../src/handlers');

jest.mock('node-fetch', () => jest.fn());

describe('login handler', () => {
  describe('throws an error', () => {
    const options = [
      [{}, 'Auth0 attribute is required'],
      [
        {
          auth0: {},
        },
        'Auth0 base url is required',
      ],
      [
        {
          auth0: {
            baseUrl: 'https://example.com',
          },
        },
        'Auth0 API audience is required',
      ],
      [
        {
          auth0: {
            baseUrl: 'https://example.com',
            apiAudience: 'https://example.com/',
          },
        },
        'Auth0 client id is required',
      ],
      [
        {
          auth0: {
            baseUrl: 'https://example.com',
            apiAudience: 'https://example.com/',
            clientId: 'abc',
          },
        },
        'Auth0 client secret is required',
      ],
      [
        {
          auth0: {
            baseUrl: 'https://example.com',
            apiAudience: 'https://example.com/',
            clientId: 'abc',
            clientSecret: 'xyz',
          },
        },
        'Auth0 realm is required',
      ],
    ];
    test.each(options)('when the attributes are %j', (opts, msg) => {
      try {
        const loginHandler = new handlers.Login(opts);
        expect(loginHandler).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual(msg);
      }
    });
  });

  it('issues a cookie when the request is verified', () => {
    const loginHandler = new handlers.Login({
      auth0: {
        baseUrl: 'https://example.com',
        apiAudience: 'https://example.com/',
        clientId: 'abc',
        clientSecret: 'xyz',
        realm: 'test',
      },
    });
    const accessToken = 'xyz';
    const expiresIn = 3600;
    const expires = new Date(Date.now() + expiresIn * 1000).toUTCString();
    const cookie = `access_token=${accessToken};Expires=${expires};Path=/;HttpOnly;SameSite=None;`;
    loginHandler.processRequest = async () => {
      await timeout(0);
      return { accessToken, expiresIn };
    };

    const res = new Response();
    return loginHandler
      .handle({}, res)
      .then(() => {
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.header).toHaveBeenCalledTimes(1);
        expect(res.header).toHaveBeenCalledWith('Set-Cookie', cookie);
        expect(res.end).toHaveBeenCalledTimes(1);
      })
      .catch(err => {
        expect(err).toBeUndefined();
      });
  });

  it('responds with unauthorized when a processing error occurs', () => {
    const loginHandler = new handlers.Login({
      auth0: {
        baseUrl: 'https://example.com',
        apiAudience: 'https://example.com/',
        clientId: 'abc',
        clientSecret: 'xyz',
        realm: 'test',
      },
    });
    const mockErr = new Error('Processing error');
    loginHandler.processRequest = async () => {
      await timeout(0);
      throw mockErr;
    };

    const res = new Response();
    return loginHandler
      .handle({}, res)
      .then(() => {
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledTimes(1);
        expect(res.send).toHaveBeenCalledWith('Unauthorized');
      })
      .catch(err => {
        expect(err).toBeUndefined();
      });
  });

  it('enables verbose logging when the environment variable is set', () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    process.env.AUTH_LOGGING = 'verbose';
    const loginHandler = new handlers.Login({
      auth0: {
        baseUrl: 'https://example.com',
        apiAudience: 'https://example.com/',
        clientId: 'abc',
        clientSecret: 'xyz',
        realm: 'test',
      },
    });
    expect(loginHandler.verbose).toBe(true);

    const mockErr = new Error('Processing error');
    loginHandler.processRequest = async () => {
      await timeout(0);
      throw mockErr;
    };

    const res = new Response();
    return loginHandler
      .handle({}, res)
      .then(() => {
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith(mockErr);
      })
      .catch(err => {
        expect(err).toBeUndefined();
      })
      .finally(() => {
        console.log = originalConsoleLog;
        delete process.env.AUTH_LOGGING;
      });
  });
});

describe('process request', () => {
  describe('throws an error', () => {
    const loginHandler = new handlers.Login({
      auth0: {
        baseUrl: 'https://example.com',
        apiAudience: 'https://example.com/',
        clientId: 'abc',
        clientSecret: 'xyz',
        realm: 'test',
      },
    });
    loginHandler.fetchAccessToken = jest.fn();

    const requests = [
      [{}, 'No request body found'],
      [
        {
          body: {},
        },
        'Username or password is missing',
      ],
    ];

    test.each(requests)('when the request is %j', (req, msg) => {
      return loginHandler
        .processRequest(req)
        .then(data => {
          expect(data).toBeUndefined();
        })
        .catch(err => {
          expect(err.message).toEqual(msg);
        });
    });
  });

  it('tries to fetch an access token when the request is valid', () => {
    const loginHandler = new handlers.Login({
      auth0: {
        baseUrl: 'https://example.com',
        apiAudience: 'https://example.com/',
        clientId: 'abc',
        clientSecret: 'xyz',
        realm: 'test',
      },
    });
    loginHandler.fetchAccessToken = jest.fn();

    const body = { username: 'user1', password: 'xyz' };

    return loginHandler
      .processRequest({ body })
      .then(() => {
        expect(loginHandler.fetchAccessToken).toHaveBeenCalledTimes(1);
        expect(loginHandler.fetchAccessToken).toHaveBeenCalledWith(body);
      })
      .catch(err => {
        expect(err).toBeUndefined();
      });
  });
});

describe('fetch access token', () => {
  it('retrieves the access token and expires in', () => {
    const username = 'user1';
    const password = 'nop';
    const accessToken = 'xyz';
    const expiresIn = 3600;

    const loginHandler = new handlers.Login({
      auth0: {
        baseUrl: 'https://example.com',
        apiAudience: 'https://example.com/',
        clientId: 'abc',
        clientSecret: 'xyz',
        realm: 'test',
      },
    });

    fetch.mockImplementation(async () => {
      return {
        json: () => ({
          access_token: accessToken,
          expires_in: expiresIn,
        }),
      };
    });

    return loginHandler
      .fetchAccessToken({
        username,
        password,
      })
      .then(data => {
        expect(data.accessToken).toEqual(accessToken);
        expect(data.expiresIn).toEqual(expiresIn);
      })
      .catch(err => {
        console.log(err);
      });
  });

  describe('throws an error when no access token was retrieved', () => {
    const mockRes = { test: 1 };
    const username = 'user1';
    const password = 'nop';

    beforeAll(() => {
      fetch.mockImplementation(async () => {
        return {
          json: () => mockRes,
        };
      });
    });

    afterAll(() => {
      fetch.mockRestore();
    });

    test('when logging is verbose', () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      const loginHandler = new handlers.Login({
        auth0: {
          baseUrl: 'https://example.com',
          apiAudience: 'https://example.com/',
          clientId: 'abc',
          clientSecret: 'xyz',
          realm: 'test',
        },
      });
      // Also test verbose logging.
      loginHandler.verbose = true;

      return loginHandler
        .fetchAccessToken({
          username,
          password,
        })
        .then(data => {
          expect(data).toBeUndefined();
        })
        .catch(err => {
          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log).toHaveBeenCalledWith(mockRes);
          console.log = originalConsoleLog;
          expect(err.message).toEqual('Access token or expiration is missing');
        });
    });

    test('when logging is normal', () => {
      const loginHandler = new handlers.Login({
        auth0: {
          baseUrl: 'https://example.com',
          apiAudience: 'https://example.com/',
          clientId: 'abc',
          clientSecret: 'xyz',
          realm: 'test',
        },
      });

      return loginHandler
        .fetchAccessToken({
          username,
          password,
        })
        .then(data => {
          expect(data).toBeUndefined();
        })
        .catch(err => {
          expect(err.message).toEqual('Access token or expiration is missing');
        });
    });
  });
});
