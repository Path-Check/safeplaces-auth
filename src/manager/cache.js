const WError = require('../common/werror');
const jwt = require('jsonwebtoken');

const Time = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
};

class Cache {
  constructor({ tokenGetter, roleGetter }) {
    this._roles = {};
    this._accessToken = null;
    this._tokenExpiration = 0;
    this._tokenGetter = tokenGetter;
    this._roleGetter = roleGetter;
  }

  roleExists(name) {
    return !!this._roles[name];
  }

  getRoleId(name) {
    if (!this.roleExists(name)) {
      throw new WError({
        name: 'RoleNotFoundError',
        message: `cannot find role: ${name}`,
      });
    }
    return this._roles[name].id;
  }

  async refreshRoles() {
    const roles = await this._roleGetter();

    this._roles = {};
    for (const roleData of roles) {
      const { id, name, description } = roleData;
      this._roles[name] = { id, description };
    }
  }

  async refreshAccessToken() {
    // Fetch a new access token.
    const newToken = await this._tokenGetter();
    this._accessToken = newToken;

    // Update the new token expiration.
    const decoded = jwt.decode(newToken);
    this._tokenExpiration = decoded.exp * 1000;
  }

  async getAccessToken() {
    const now = Date.now();
    if (this._tokenExpiration - now < 2 * Time.MINUTE) {
      // Refresh the token synchronously.
      await this.refreshAccessToken();
    } else if (this._tokenExpiration - now < 30 * Time.MINUTE) {
      // Preemptively refresh the token asynchronously.
      this.refreshAccessToken().then();
    }

    return this._accessToken;
  }
}

module.exports = Cache;
