const generate = require('../src/generate');

describe('generate', () => {
  it('throws an error when attributes are omitted', () => {
    try {
      const cookie = generate.cookieString();
      expect(cookie).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('Cookie attributes are required');
    }
  });

  it('throws an error when name or value are omitted', () => {
    try {
      const cookie = generate.cookieString({
        expires: new Date(Date.now() + 60 * 1000 * 1000),
      });
      expect(cookie).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('Cookie name and value are required');
    }
  });

  describe('creates a cookie string', () => {
    test('when no additional options are specified', () => {
      const expectedCookie = 'some_cookie=some_value;SameSite=None;';
      const actualCookie = generate.cookieString({
        name: 'some_cookie',
        value: 'some_value',
      });
      expect(actualCookie).toEqual(expectedCookie);
    });

    test('when same site and secure are false', () => {
      const expires = new Date(Date.now() + 60 * 1000 * 1000);
      const expectedCookie = `some_cookie=some_value;Expires=${expires.toUTCString()};Path=/;HttpOnly;SameSite=None;`;
      const actualCookie = generate.cookieString({
        name: 'some_cookie',
        value: 'some_value',
        expires,
        path: '/',
        httpOnly: true,
      });
      expect(actualCookie).toEqual(expectedCookie);
    });

    test('when same site and secure are true', () => {
      const expires = new Date(Date.now() + 60 * 1000 * 1000);
      const expectedCookie = `some_cookie=some_value;Expires=${expires.toUTCString()};Path=/;HttpOnly;Secure;SameSite=Strict;`;
      const actualCookie = generate.cookieString({
        name: 'some_cookie',
        value: 'some_value',
        expires,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: true,
      });
      expect(actualCookie).toEqual(expectedCookie);
    });
  });
});
