const handlers = require('../../src/handlers');
const Response = require('../mocks/response');

describe('logout handler', () => {
  it('throws an error when the redirect URL is missing', () => {
    try {
      const logoutHandler = new handlers.Logout({});
      expect(logoutHandler).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('logout redirect URL is required');
    }
  });

  it('handles a logout request', () => {
    const redirect = 'https://example.com';
    const expires = new Date(1970, 1, 1).toUTCString();
    const cookie = `access_token=deleted;Expires=${expires};Path=/;HttpOnly;SameSite=None;`;
    const logoutHandler = new handlers.Logout({ redirect });

    const req = {};
    const res = new Response();
    logoutHandler.handle(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(302);
    expect(res.header).toHaveBeenCalledTimes(1);
    expect(res.header).toHaveBeenCalledWith('Set-Cookie', cookie);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(redirect);
  });
});
