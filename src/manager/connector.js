const Cache = require('./cache');
const fetch = require('node-fetch');
const generate = require('../common/generate');
const utils = require('../common/utils');

class Connector {
  constructor(params) {
    if (!params) {
      throw new Error('Connector parameters are required');
    }

    const { baseUrl, clientId, clientSecret, apiAudience, realm } = params;
    if (!baseUrl) {
      throw new Error('Auth0 base URL is required');
    }
    if (!clientId) {
      throw new Error('Auth0 client id is required');
    }
    if (!clientSecret) {
      throw new Error('Auth0 client secret is required');
    }
    if (!apiAudience) {
      throw new Error('Auth0 API audience is required');
    }
    if (!realm) {
      throw new Error('Auth0 realm is required');
    }
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

    const accessToken = json['access_token'];
    const tokenType = json['token_type'];
    if (!accessToken || tokenType !== 'Bearer') {
      if (this._verbose) {
        console.log(json);
      }
      throw new Error('Access token missing or token type not matching');
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
      if (this._verbose) {
        console.error(errData);
      }
      throw {
        error: new Error('API call failed'),
        data: errData,
      };
    }

    return res;
  }

  async getUser(id) {
    if (!id) {
      throw new Error('User id is required');
    }

    let data;
    try {
      const res = await this._fetchApi('GET', `/users/${id}`);
      data = await res.json();
    } catch {
      throw new Error('Unable to get user');
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
    } catch {
      throw new Error('Unable to list users');
    }

    return data;
  }

  async createUser(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const payload = {
      email,
      password: generate.password(16),
      connection: this._realm,
      verify_email: true,
      email_verified: false,
    };

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
        throw new Error('User already exists');
      }
      throw new Error('Unable to create user');
    }

    return userId;
  }

  async deleteUser(id) {
    if (!id) {
      throw new Error('User id is required');
    }

    try {
      await this._fetchApi('DELETE', `/users/${id}`);
    } catch {
      throw new Error('Unable to delete user');
    }
  }

  async updateUser(id, update) {
    if (!id) {
      throw new Error('User id is required');
    }
    if (update.constructor !== Object) {
      throw new Error(`Invalid update: ${update}. Expected an object`);
    }

    const payload = {
      connection: this._realm,
    };
    Object.assign(payload, utils.pick('nickname')(update));

    try {
      await this._fetchApi('PATCH', `/users/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('Unable to update user');
    }
  }

  async listRoles() {
    let data;
    try {
      const res = await this._fetchApi('GET', '/roles');
      data = await res.json();
    } catch {
      throw new Error('Unable to list roles');
    }

    return data;
  }

  async assignRole(userId, roleName) {
    if (!userId) {
      throw new Error('User id is required');
    }
    if (!roleName) {
      throw new Error('Role name is required');
    }

    const roleId = this._cache.getRoleId(roleName);
    if (!roleId) {
      throw new Error(`Unable to get id of role ${roleName}`);
    }

    const payload = {
      roles: [roleId],
    };

    try {
      await this._fetchApi('POST', `/users/${userId}/roles`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('Unable to assign role to user');
    }
  }

  async removeRole(userId, roleName) {
    if (!userId) {
      throw new Error('User id is required');
    }
    if (!roleName) {
      throw new Error('Role name is required');
    }

    const roleId = this._cache.getRoleId(roleName);
    if (!roleId) {
      throw new Error(`Unable to get id of role ${roleName}`);
    }

    const payload = {
      roles: [roleId],
    };

    try {
      await this._fetchApi('DELETE', `/users/${userId}/roles`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('Unable to remove role from user');
    }
  }

  async sendPasswordResetEmail(email) {
    if (!email) {
      throw new Error('Email is required');
    }

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
      if (this._verbose) {
        console.error(await res.json());
      }
      if (res.status === 429) {
        throw new Error(
          'Unable to send password reset email, too many requests',
        );
      }
      throw new Error('Unable to send password reset email');
    }
  }
}

module.exports = Connector;
