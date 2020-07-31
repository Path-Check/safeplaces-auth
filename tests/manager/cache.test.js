const jwt = require('jsonwebtoken');
const Cache = require('../../src/manager/cache');

describe('refresh roles', () => {
  const tokenGetter = jest.fn();
  const roleGetter = jest.fn(() =>
    Promise.resolve([
      { id: 'role1', name: 'admin', description: 'desc-a' },
      { id: 'role2', name: 'contact_tracer', description: 'desc-b' },
    ]),
  );

  beforeEach(() => {
    tokenGetter.mockClear();
    roleGetter.mockClear();
  });

  it('saves roles', () => {
    const cache = new Cache({ tokenGetter, roleGetter });

    return cache.refreshRoles().then(() => {
      expect(roleGetter).toHaveBeenCalledTimes(1);
      expect(cache._roles).toEqual({
        admin: {
          id: 'role1',
          description: 'desc-a',
        },
        contact_tracer: {
          id: 'role2',
          description: 'desc-b',
        },
      });

      try {
        expect(cache.roleExists('inexistent_role')).toBe(false);
        expect(cache.getRoleId('inexistent_role')).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual('cannot find role: inexistent_role');
      }

      expect(cache.roleExists('admin')).toBe(true);
      expect(cache.roleExists('contact_tracer')).toBe(true);
      expect(cache.getRoleId('admin')).toEqual('role1');
      expect(cache.getRoleId('contact_tracer')).toEqual('role2');
    });
  });
});

describe('access token caching', () => {
  const accessToken = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000 + 3600),
    },
    'jwt_secret',
  );
  const tokenGetter = jest.fn(() => Promise.resolve(accessToken));
  const roleGetter = jest.fn();

  beforeEach(() => {
    tokenGetter.mockClear();
    roleGetter.mockClear();
  });

  it('saves the access token', () => {
    const expDate = Math.floor(Date.now() / 1000 + 3600);

    const cache = new Cache({ tokenGetter, roleGetter });
    cache._tokenExpiration = expDate * 1000;

    return cache
      .refreshAccessToken()
      .then(() => {
        expect(tokenGetter).toHaveBeenCalledTimes(1);
        expect(cache._accessToken).toEqual(accessToken);
        expect(cache._tokenExpiration).toEqual(expDate * 1000);
        tokenGetter.mockClear();

        return cache.getAccessToken();
      })
      .then(token => {
        // Make sure access token was not refreshed again.
        expect(tokenGetter).toHaveBeenCalledTimes(0);
        expect(token).toEqual(accessToken);
      });
  });

  it('refreshes if the token is about to expire', () => {
    const expDate = Math.floor(Date.now() / 1000 + 1.9 * 60);

    const cache = new Cache({ tokenGetter, roleGetter });
    cache._tokenExpiration = expDate * 1000;

    return cache.getAccessToken().then(token => {
      expect(token).toEqual(accessToken);
      expect(tokenGetter).toHaveBeenCalledTimes(1);
    });
  });

  it('refreshes if the token will expire soon', () => {
    const expDate = Math.floor(Date.now() / 1000 + 29 * 60);

    const cache = new Cache({ tokenGetter, roleGetter });
    cache._tokenExpiration = expDate * 1000;
    cache._accessToken = 'initial_token';

    return cache.getAccessToken().then(token => {
      expect(token).toEqual('initial_token');
      expect(tokenGetter).toHaveBeenCalledTimes(1);
    });
  });
});
