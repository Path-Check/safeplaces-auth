const assert = require('assert');

class Hook {
  constructor(callbacks) {
    assert.ok(callbacks, 'callbacks are required');

    assert.ok(callbacks.id, 'ID translation callbacks are required');

    assert.ok(
      callbacks.id.dbToIdm,
      'DB to IDM id translation callback is required',
    );
    assert.ok(
      typeof callbacks.id.dbToIdm === 'function',
      'DB to IDM id translation should be a function',
    );

    assert.ok(
      callbacks.id.idmToDb,
      'IDM to DB id translation callback is required',
    );
    assert.ok(
      typeof callbacks.id.idmToDb === 'function',
      'IDM to DB id translation should be a function',
    );

    assert.ok(callbacks.users, 'user modification callbacks are required');

    assert.ok(callbacks.users.create, 'user creation callback is required');
    assert.ok(
      typeof callbacks.users.create === 'function',
      'user creation callback should be a function',
    );

    assert.ok(callbacks.users.delete, 'user deletion callback is required');
    assert.ok(
      typeof callbacks.users.delete === 'function',
      'user deletion callback should be a function',
    );

    assert.ok(callbacks.users.getAll, 'user get all callback is required');
    assert.ok(
      typeof callbacks.users.getAll === 'function',
      'user get all callback should be a function',
    );

    this._callbacks = callbacks;
  }

  get id() {
    return {
      dbToIdm: dbId => Promise.resolve(this._callbacks.id.dbToIdm(dbId)),
      idmToDb: idmId => Promise.resolve(this._callbacks.id.idmToDb(idmId)),
    };
  }

  get users() {
    return {
      create: (email, idmId, orgId) =>
        Promise.resolve(this._callbacks.users.create(email, idmId, orgId)),
      delete: dbId => Promise.resolve(this._callbacks.users.delete(dbId)),
      getAll: () => Promise.resolve(this._callbacks.users.getAll()),
    };
  }
}

module.exports = Hook;
