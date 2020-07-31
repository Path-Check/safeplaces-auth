const generate = require('../../src/common/generate');

describe('cookieString', () => {
  it('throws an error when attributes are omitted', () => {
    try {
      const cookie = generate.cookieString();
      expect(cookie).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('cookie attributes are required');
    }
  });

  it('throws an error when name or value are omitted', () => {
    try {
      const cookie = generate.cookieString({
        expires: new Date(Date.now() + 60 * 1000 * 1000),
      });
      expect(cookie).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('cookie name and value are required');
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
      const expectedCookie = `some_cookie=some_value;Expires=${expires.toUTCString()};Path=/;HttpOnly;Secure;SameSite=Strict;Domain=test.com;`;
      const actualCookie = generate.cookieString({
        name: 'some_cookie',
        value: 'some_value',
        expires,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: true,
        domain: 'test.com',
      });
      expect(actualCookie).toEqual(expectedCookie);
    });
  });
});

describe('password', () => {
  it('throws an error when length is omitted', () => {
    try {
      const pass = generate.password();
      expect(pass).toBeUndefined();
    } catch (e) {
      expect(e.message).toEqual('password length is required');
    }
  });

  it('generates a random password', () => {
    const p1 = generate.password(8);
    const p2 = generate.password(8);
    expect(p1).not.toEqual(p2);
  });
});
