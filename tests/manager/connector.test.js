const Connector = require('../../src/manager/connector');

describe('constructor', () => {
  describe('throws an error', () => {
    const testTable = [
      [undefined, 'Connector parameters are required'],
      [{}, 'Auth0 base URL is required'],
      [{ baseUrl: 'a' }, 'Auth0 client id is required'],
      [
        {
          baseUrl: 'a',
          clientId: 'a',
        },
        'Auth0 client secret is required',
      ],
      [
        {
          baseUrl: 'a',
          clientId: 'a',
          clientSecret: 'a',
        },
        'Auth0 API audience is required',
      ],
      [
        {
          baseUrl: 'a',
          clientId: 'a',
          clientSecret: 'a',
          apiAudience: 'a',
        },
        'Auth0 realm is required',
      ],
    ];

    test.each(testTable)('when the parameters are %j', (params, msg) => {
      try {
        const conn = new Connector(params);
        expect(conn).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual(msg);
      }
    });
  });
});
