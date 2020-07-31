const Cache = require('./cache');
const WError = require('../common/werror');
const fetch = require('node-fetch');
const assert = require('assert');
const generate = require('../common/generate');
const utils = require('../common/utils');

class Connector {
  constructor(params) {
    assert.ok(params, 'connector parameters are required');

    const { baseUrl, clientId, clientSecret, apiAudience, realm } = params;
    assert.ok(baseUrl, 'Auth0 base URL is required');
    assert.ok(clientId, 'Auth0 client ID is required');
    assert.ok(clientSecret, 'Auth0 client secret is required');
    assert.ok(apiAudience, 'Auth0 API audience is required');
    assert.ok(realm, 'Auth0 realm is required');

    this._baseUrl = baseUrl;
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._apiAudience = apiAudience;
    this._realm = realm;
    this._verbose = process.env.AUTH_LOGGING === 'verbose';
    this._cache = new Cache({
      tokenGetter: this._getToken.bind(this),
      roleGetter: this.listRoles.bind(this),
    });
  }

  async init() {
    await this._cache.refreshAccessToken();
    await this._cache.refreshRoles();
  }

  async _getToken() {
    const payload = {
      client_id: this._clientId,
      client_secret: this._clientSecret,
      audience: this._apiAudience,
      grant_type: 'client_credentials',
    };

    const response = await fetch(`${this._baseUrl}/oauth/token`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json();

    const accessToken = json.access_token;
    const tokenType = json.token_type;
    if (!accessToken || tokenType !== 'Bearer') {
      throw new WError({
        name: 'Auth0Error',
        message: 'access token missing or token type not matching',
        data: json,
      });
    }

    return accessToken;
  }

  async _fetchApi(method, route, options) {
    const accessToken = await this._cache.getAccessToken();
    const opts = {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    if (options) {
      opts.body = options.body;
      Object.assign(opts.headers, options.headers);
    }

    const res = await fetch(`${this._baseUrl}/api/v2${route}`, opts);

    if (!res.ok) {
      const errData = await res.json();
      throw new WError({
        name: 'Auth0Error',
        message: 'API call failed',
        data: errData,
      });
    }

    return res;
  }

  async getUser(id) {
    assert.ok(id, 'user ID is required');

    let data;
    try {
      const res = await this._fetchApi('GET', `/users/${id}`);
      data = await res.json();
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to get user',
        cause: e,
      });
    }

    return data;
  }

  async getRoles(id) {
    assert.ok(id, 'user ID is required');

    let data;
    try {
      const res = await this._fetchApi('GET', `/users/${id}/roles`);
      data = await res.json();
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to get roles of user',
        cause: e,
      });
    }

    return data;
  }

  async listUsers() {
    const params = new URLSearchParams({
      search_engine: 'v3',
      q: `identities.connection:"${this._realm}"`,
    });

    let data;
    try {
      const res = await this._fetchApi('GET', `/users?${params}`);
      data = await res.json();
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to list users',
        cause: e,
      });
    }

    return data;
  }

  async createUser(email) {
    assert.ok(email, 'email is required');

    const payload = {
      email,
      password: generate.password(16),
      connection: this._realm,
      verify_email: true,
      email_verified: false,
    };

    // someone@example.com
    // ^^^^^^^
    // Capture all characters preceding `@` in the email.
    const nameMatch = /^([^@]+)/g.exec(email);
    if (nameMatch) {
      payload.name = nameMatch[1];
    }

    let userId;
    try {
      const res = await this._fetchApi('POST', '/users', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      userId = data['user_id'];
    } catch (e) {
      if (e.data.statusCode === 409) {
        throw new WError({
          name: 'ConflictError',
          message: 'user already exists',
          cause: e,
        });
      }
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to create user',
        cause: e,
      });
    }

    return userId;
  }

  async deleteUser(id) {
    assert.ok(id, 'user ID is required');

    try {
      await this._fetchApi('DELETE', `/users/${id}`);
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to delete user',
        cause: e,
      });
    }
  }

  async updateUser(id, update) {
    assert.ok(id, 'user ID is required');
    assert.strictEqual(
      update.constructor,
      Object,
      `Invalid update: ${update}. Expected an object`,
    );

    const payload = {
      connection: this._realm,
    };
    Object.assign(payload, utils.pick('name')(update));

    try {
      await this._fetchApi('PATCH', `/users/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to update user',
        cause: e,
      });
    }
  }

  async listRoles() {
    let data;
    try {
      const res = await this._fetchApi('GET', '/roles');
      data = await res.json();
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to list roles',
        cause: e,
      });
    }

    return data;
  }

  async assignRole(userId, roleName, newUser) {
    assert.ok(userId, 'user ID is required');
    assert.ok(roleName, 'role name is required');

    // If the user is not new, remove all currently assigned roles.
    if (!newUser) {
      // Get all currently assigned roles.
      const currentRoles = (await this.getRoles(userId)).map(role => {
        return role.id;
      });

      try {
        // Remove all assigned roles.
        await this._fetchApi('DELETE', `/users/${userId}/roles`, {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roles: currentRoles,
          }),
        });
      } catch (e) {
        throw new WError({
          name: 'Auth0Error',
          message: 'unable to remove currently assigned roles',
          cause: e,
        });
      }
    }

    const roleId = this._cache.getRoleId(roleName);
    if (!roleId) {
      throw new WError({
        name: 'NotFoundError',
        message: `unable to get ID of role ${roleName}`,
      });
    }

    const payload = {
      roles: [roleId],
    };

    try {
      await this._fetchApi('POST', `/users/${userId}/roles`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to assign role to user',
        cause: e,
      });
    }
  }

  async removeRole(userId, roleName) {
    assert.ok(userId, 'user ID is required');
    assert.ok(roleName, 'role name is required');

    const roleId = this._cache.getRoleId(roleName);
    if (!roleId) {
      throw new WError({
        name: 'NotFoundError',
        message: `unable to get ID of role ${roleName}`,
      });
    }

    const payload = {
      roles: [roleId],
    };

    try {
      await this._fetchApi('DELETE', `/users/${userId}/roles`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to remove role from user',
        cause: e,
      });
    }
  }

  async createEmailVerificationTicket(id) {
    let data;

    try {
      const res = await this._fetchApi('POST', `/tickets/email-verification`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: id,
          result_url: 'http://localhost:3000',
        }),
      });
      data = await res.json();
    } catch (e) {
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to create email verification ticket',
        cause: e,
      });
    }

    return data;
  }

  async sendPasswordResetEmail(email) {
    assert.ok(email, 'email is required');

    const payload = {
      email,
      client_id: this._clientId,
      connection: this._realm,
    };

    const res = await fetch(`${this._baseUrl}/dbconnections/change_password`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errData = await res.json();
      if (res.status === 429) {
        throw new WError({
          name: 'TooManyRequestsError',
          message: 'unable to send password reset email, too many requests',
        });
      }
      throw new WError({
        name: 'Auth0Error',
        message: 'unable to send password reset email',
        data: errData,
      });
    }
  }
}

module.exports = Connector;
