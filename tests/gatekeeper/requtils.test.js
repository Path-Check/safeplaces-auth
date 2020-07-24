const reqUtils = require('../../src/gatekeeper/requtils');
const mockRequest = require('../mocks/request');

describe('source cookie', () => {
  describe('throws an error', () => {
    test('when the request has no cookies', () => {
      try {
        const req = mockRequest({});
        const testToken = reqUtils.sourceCookie(req);
        expect(testToken).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual('No cookies found');
      }
    });

    test('when there is no token cookie', () => {
      try {
        const req = mockRequest({
          cookies: {},
        });
        const testToken = reqUtils.sourceCookie(req);
        expect(testToken).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual('No access token found in cookie');
      }
    });
  });

  it('returns the access token', () => {
    const actualToken = 'some.access.token';
    const req = mockRequest({
      cookies: {
        access_token: actualToken,
      },
    });
    const testToken = reqUtils.sourceCookie(req);
    expect(testToken).toEqual(actualToken);
  });
});

describe('source header', () => {
  describe('throws an error', () => {
    test('when the request has no headers', () => {
      try {
        const req = mockRequest({});
        const testToken = reqUtils.sourceHeader(req);
        expect(testToken).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual('No headers found');
      }
    });

    test('when there is no authorization header', () => {
      try {
        const req = mockRequest({
          headers: {
            origin: 'https://example.com',
          },
        });
        const testToken = reqUtils.sourceHeader(req);
        expect(testToken).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual('No authorization header found');
      }
    });

    test('when there is no token in the authorization header', () => {
      try {
        const req = mockRequest({
          headers: {
            authorization: 'Basic xyz',
          },
        });
        const testToken = reqUtils.sourceHeader(req);
        expect(testToken).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual('No access token found in header');
      }
    });
  });

  it('returns the access token', () => {
    const actualToken = 'some.access.token';
    const req = mockRequest({
      headers: {
        authorization: `Bearer ${actualToken}`,
      },
    });
    const testToken = reqUtils.sourceHeader(req);
    expect(testToken).toEqual(actualToken);
  });
});
