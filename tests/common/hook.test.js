const Hook = require('../../src/common/hook');

describe('constructor', () => {
  const fn = () => null;

  describe('throws an error', () => {
    const testTable = [
      [null, 'Callbacks are required'],
      [{}, 'Id translation callbacks are required'],
      [{ id: {} }, 'DB to IDM id translation callback is required'],
      [
        {
          id: {
            dbToIdm: 1,
          },
        },
        'DB to IDM id translation should be a function',
      ],
      [
        {
          id: { dbToIdm: fn },
        },
        'IDM to DB id translation callback is required',
      ],
      [
        {
          id: {
            dbToIdm: fn,
            idmToDb: 1,
          },
        },
        'IDM to DB id translation should be a function',
      ],
      [
        {
          id: {
            dbToIdm: fn,
            idmToDb: fn,
          },
        },
        'User modification callbacks are required',
      ],
      [
        {
          id: {
            dbToIdm: fn,
            idmToDb: fn,
          },
          users: {},
        },
        'User creation callback is required',
      ],
      [
        {
          id: {
            dbToIdm: fn,
            idmToDb: fn,
          },
          users: {
            create: 1,
          },
        },
        'User creation callback should be a function',
      ],
      [
        {
          id: {
            dbToIdm: fn,
            idmToDb: fn,
          },
          users: {
            create: fn,
          },
        },
        'User deletion callback is required',
      ],
      [
        {
          id: {
            dbToIdm: fn,
            idmToDb: fn,
          },
          users: {
            create: fn,
            delete: 1,
          },
        },
        'User deletion callback should be a function',
      ],
      [
        {
          id: {
            dbToIdm: fn,
            idmToDb: fn,
          },
          users: {
            create: fn,
            delete: fn,
          },
        },
        'User get all callback is required',
      ],
      [
        {
          id: {
            dbToIdm: fn,
            idmToDb: fn,
          },
          users: {
            create: fn,
            delete: fn,
            getAll: 1,
          },
        },
        'User get all callback should be a function',
      ],
    ];

    test.each(testTable)('when the callbacks are %j', (callbacks, msg) => {
      try {
        const hook = new Hook(callbacks);
        expect(hook).toBeUndefined();
      } catch (e) {
        expect(e.message).toEqual(msg);
      }
    });
  });

  it('does not throw an error when all properties are supplied', () => {
    const hook = new Hook({
      id: {
        dbToIdm: fn,
        idmToDb: fn,
      },
      users: {
        create: fn,
        delete: fn,
        getAll: fn,
      },
    });
    expect(hook).toBeDefined();
  });
});

describe('getter', () => {
  const input = { i: 0 };
  const out = { a: 1 };
  const fn = jest.fn(() => out);

  const hook = new Hook({
    id: {
      dbToIdm: fn,
      idmToDb: fn,
    },
    users: {
      create: fn,
      delete: fn,
      getAll: fn,
    },
  });

  afterEach(() => {
    fn.mockClear();
  });

  it('id returns an object of functions', () => {
    const idFns = hook.id;
    expect(idFns).toHaveProperty('dbToIdm');
    expect(idFns).toHaveProperty('idmToDb');

    return Promise.all([idFns.dbToIdm(input), idFns.idmToDb(input)]).then(
      res => {
        expect(res.every(r => r === out)).toBe(true);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenCalledWith(input);
      },
    );
  });

  it('users returns an object of functions', () => {
    const usersFns = hook.users;
    expect(usersFns).toHaveProperty('create');
    expect(usersFns).toHaveProperty('delete');
    expect(usersFns).toHaveProperty('getAll');

    return Promise.all([
      usersFns.create(input),
      usersFns.delete(input),
      usersFns.getAll(input),
    ]).then(res => {
      expect(res.every(r => r === out)).toBe(true);
      expect(fn).toHaveBeenCalledTimes(3);
      expect(fn).toHaveBeenCalledWith(input);
    });
  });
});
