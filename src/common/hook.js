class Hook {
  constructor(callbacks) {
    if (!callbacks) {
      throw new Error('Callbacks are required');
    }
    if (!callbacks.id) {
      throw new Error('Id translation callbacks are required');
    }
    if (!callbacks.id.dbToIdm) {
      throw new Error('DB to IDM id translation callback is required');
    }
    if (typeof callbacks.id.dbToIdm !== 'function') {
      throw new Error('DB to IDM id translation should be a function');
    }
    if (!callbacks.id.idmToDb) {
      throw new Error('IDM to DB id translation callback is required');
    }
    if (typeof callbacks.id.idmToDb !== 'function') {
      throw new Error('IDM to DB id translation should be a function');
    }
    if (!callbacks.users) {
      throw new Error('User modification callbacks are required');
    }
    if (!callbacks.users.create) {
      throw new Error('User creation callback is required');
    }
    if (typeof callbacks.users.create !== 'function') {
      throw new Error('User creation callback should be a function');
    }
    if (!callbacks.users.delete) {
      throw new Error('User deletion callback is required');
    }
    if (typeof callbacks.users.delete !== 'function') {
      throw new Error('User deletion callback should be a function');
    }
    if (!callbacks.users.getAll) {
      throw new Error('User get all callback is required');
    }
    if (typeof callbacks.users.getAll !== 'function') {
      throw new Error('User get all callback should be a function');
    }

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
