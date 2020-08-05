const R = require('ramda');
const superagent = require('superagent');
const WError = require('../utils/werror');
const Container = require('./container');
const generate = require('./generate');

const time = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 1000 * 1000,
};

const getManagementToken = config => {
  const { auth0 } = config;

  return superagent
    .post(`${auth0.baseUrl}/oauth/token`)
    .send({
      client_id: auth0.clientId,
      client_secret: auth0.clientSecret,
      audience: auth0.apiAudience,
      grant_type: 'client_credentials',
    })
    .then(res => res.body)
    .then(R.pick(['access_token', 'expires_in']));
};

const getRoles = (config, accessToken) => {
  const { auth0 } = config;

  return superagent
    .get(`${auth0.baseUrl}/api/v2/roles`)
    .set('Authorization', `Bearer ${accessToken}`)
    .then(res => res.body)
    .then(R.indexBy(R.prop('name')))
    .then(R.map(R.prop('id')));
};

const getUser = {
  dependencies: ['config', 'accessToken'],
  handler: (config, accessToken, userId) => {
    const { auth0 } = config;

    return superagent
      .get(`${auth0.baseUrl}/api/v2/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then(res => res.body)
      .then(R.pick(['email', 'email_verified', 'name', 'user_id']))
      .catch(err => {
        if (err.response.statusCode === 404) {
          throw new WError({
            name: 'UserNotFound',
            message: 'User does not exist',
            data: { res: err.response.text },
          });
        }
        throw err;
      });
  },
};

const listUsers = {
  dependencies: ['config', 'accessToken'],
  handler: (config, accessToken) => {
    const { auth0 } = config;

    return superagent
      .get(`${auth0.baseUrl}/api/v2/users`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        search_engine: 'v3',
        q: `identities.connection:"${auth0.realm}"`,
      })
      .then(res => res.body)
      .then(R.map(R.pick(['email', 'email_verified', 'name', 'user_id'])));
  },
};

const createUser = {
  dependencies: ['config', 'accessToken'],
  handler: (config, accessToken, email) => {
    const { auth0 } = config;

    const payload = {
      email,
      password: generate.password(16),
      connection: auth0.realm,
      verify_email: false,
      email_verified: false,
    };

    // someone@example.com
    // ^^^^^^^
    // Capture all characters preceding `@` in the email.
    const nameMatch = /^([^@]+)/g.exec(email);
    if (nameMatch) {
      payload.name = nameMatch[1];
    }

    return superagent
      .post(`${auth0.baseUrl}/api/v2/users`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .then(res => res.body)
      .then(R.pick(['user_id']))
      .catch(err => {
        if (err.response.statusCode === 409) {
          throw new WError({
            name: 'UserConflict',
            message: 'User already exists',
            data: { res: err.response.body },
          });
        }

        throw err;
      });
  },
};

const deleteUser = {
  dependencies: ['config', 'accessToken'],
  handler: (config, accessToken, userId) => {
    const { auth0 } = config;

    return superagent
      .delete(`${auth0.baseUrl}/api/v2/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);
  },
};

const updateUser = {
  dependencies: ['config', 'accessToken'],
  handler: (config, accessToken, userId, update) => {
    const { auth0 } = config;

    const payload = { connection: auth0.realm };
    Object.assign(payload, R.pick(['name', 'password'])(update));

    return superagent
      .patch(`${auth0.baseUrl}/api/v2/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);
  },
};

const assignRoleToUser = {
  dependencies: ['config', 'accessToken', 'roleGetter'],
  handler: async (config, accessToken, getRole, userId, role) => {
    const { auth0 } = config;

    const roleId = await getRole(role);

    return superagent
      .post(`${auth0.baseUrl}/api/v2/users/${userId}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        roles: [roleId],
      });
  },
};

const getRolesOfUser = {
  dependencies: ['config', 'accessToken'],
  handler: async (config, accessToken, userId) => {
    const { auth0 } = config;

    return superagent
      .get(`${auth0.baseUrl}/api/v2/users/${userId}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then(res => res.body)
      .then(R.map(R.pick(['id', 'name'])));
  },
};

const removeRolesFromUser = {
  dependencies: ['config', 'accessToken'],
  handler: async (config, accessToken, userId) => {
    const { auth0 } = config;

    const roles = await getRolesOfUser.handler(config, accessToken, userId);
    const roleIds = R.map(R.prop('id'))(roles);

    return superagent
      .delete(`${auth0.baseUrl}/api/v2/users/${userId}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        roles: roleIds,
      });
  },
};

const createEmailVerificationTicket = {
  dependencies: ['config', 'accessToken'],
  handler: async (config, accessToken, userId, redirectUrl) => {
    const { auth0 } = config;

    return superagent
      .post(`${auth0.baseUrl}/api/v2/tickets/email-verification`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        user_id: userId,
        result_url: redirectUrl,
      })
      .then(res => res.body);
  },
};

function TokenGetter(config) {
  this.config = config;
  this.accessToken = null;
  this.expiration = 0;
}

TokenGetter.prototype.refresh = async function () {
  const tokenData = await getManagementToken(this.config);
  this.accessToken = tokenData.access_token;
  this.expiration = Date.now() + tokenData.expires_in * time.SECOND;
};

TokenGetter.prototype.get = async function () {
  if (this.expiration - Date.now() < 2 * time.MINUTE) {
    await this.refresh();
  } else if (this.expiration - Date.now() < 10 * time.MINUTE) {
    this.refresh().then();
  }
  return this.accessToken;
};

function RoleGetter(config, tokenGetter) {
  this.config = config;
  this.tokenGetter = tokenGetter;
  this.roles = {};
}

RoleGetter.prototype.refresh = async function () {
  const accessToken = await this.tokenGetter.get();
  this.roles = await getRoles(this.config, accessToken);
};

RoleGetter.prototype.get = async function (name) {
  if (!(name in this.roles)) {
    await this.refresh();
  }
  if (!(name in this.roles)) {
    throw new Error(`Unable to find role: ${name}`);
  }
  return this.roles[name];
};

const services = {
  getUser,
  listUsers,
  createUser,
  deleteUser,
  updateUser,
  assignRoleToUser,
  getRolesOfUser,
  removeRolesFromUser,
  createEmailVerificationTicket,
};

const service = config => {
  const tokenGetter = new TokenGetter(config);
  const roleGetter = new RoleGetter(config, tokenGetter);

  const container = new Container();
  container.register('config', config);
  container.register('accessToken', () => tokenGetter.get());
  container.register('roleGetter', roleGetter.get.bind(roleGetter));

  const exports = {};

  for (const [name, svc] of Object.entries(services)) {
    exports[name] = async (...args) => {
      let curried = R.curry(svc.handler);

      for (const dep of svc.dependencies) {
        const resolvedDep = await container.get(dep);
        curried = await curried(resolvedDep);
      }

      if (svc.handler.length === svc.dependencies.length) {
        return curried;
      } else {
        return curried(...args);
      }
    };
  }

  return exports;
};

module.exports = {
  getManagementToken,
  service,
};
