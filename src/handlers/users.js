const Ajv = require('ajv');
const assert = require('assert');
const WError = require('../common/werror');
const Connector = require('../manager/connector');
const Hook = require('../common/hook');
const wrap = require('./base');
const utils = require('../common/utils');

const ajv = new Ajv({ allErrors: true });

const SCHEMAS = {
  id: ajv.compile({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  email: ajv.compile({
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
    },
    required: ['email'],
    additionalProperties: false,
  }),
  update: ajv.compile({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      name: {
        type: 'string',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  role: ajv.compile({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      role: {
        type: 'string',
        enum: ['contact_tracer', 'admin', 'super_admin'],
      },
    },
    required: ['id', 'role'],
    additionalProperties: false,
  }),
  create: ajv.compile({
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
      role: {
        type: 'string',
        enum: ['contact_tracer', 'admin', 'super_admin'],
      },
      organization_id: {
        type: 'string',
      },
    },
    required: ['email', 'role', 'organization_id'],
    additionalProperties: false,
  }),
};

const ROLE_RANKS = ['super_admin', 'admin', 'contact_tracer'];

function resInternalError(code, message, res) {
  res.status(500).json({
    statusCode: 500,
    error: 'Internal Server Error',
    message,
    errorCode: code,
  });
}

function resNotFound(res) {
  res.status(404).json({
    statusCode: 404,
    error: 'Not Found',
    message: 'user does not exist',
    errorCode: 'inexistent_user',
  });
}

class Users {
  constructor(params) {
    assert.ok('Auth0 parameters are required');

    const { auth0, hook, forceProblemResolution } = params;
    assert.ok(auth0, 'Auth0 attribute is required');
    assert.ok(hook, 'hook is required');
    assert.ok(
      hook instanceof Hook,
      `invalid hook: ${hook} - expected instance of Hook`,
    );

    this._hook = hook;
    this._connector = new Connector(auth0);
    this._forceProblemResolution = forceProblemResolution;
  }

  async init() {
    await this._connector.init();

    console.log('Scanning for synchronization problems between IDM and DB...');
    const problems = await this.findProblems();
    console.log('Scan complete');

    Users.reportProblems(problems);
    if (this._forceProblemResolution && problems.length > 0) {
      await this.destructivelyResolveProblems(problems);
    }
  }

  static _idmInDbUsers(idmId, allDbUsers) {
    for (const dbUser of allDbUsers) {
      if (dbUser['idm_id'] === idmId) {
        return true;
      }
    }
    return false;
  }

  static _dbInIdmUsers(idmId, allIdmUsers) {
    for (const idmUser of allIdmUsers) {
      if (idmUser['user_id'] === idmId) {
        return true;
      }
    }
    return false;
  }

  async findProblems() {
    const problems = [];
    const allDbUsers = await this._hook.users.getAll();
    const allIdmUsers = await this._connector.listUsers();

    if (allDbUsers.length !== allIdmUsers.length) {
      problems.push({
        errorCode: 'count_mismatch',
      });
    }

    for (const idmUser of allIdmUsers) {
      const idmId = idmUser['user_id'];
      const email = idmUser['email'];

      if (!Users._idmInDbUsers(idmId, allDbUsers)) {
        problems.push({
          errorCode: 'missing_db',
          data: {
            idmId,
            email,
          },
        });
      }
    }

    for (const dbUser of allDbUsers) {
      const idmId = dbUser['idm_id'];
      const dbId = dbUser['id'];
      const email = dbUser['username'];

      if (!Users._dbInIdmUsers(idmId, allIdmUsers)) {
        problems.push({
          errorCode: 'missing_idm',
          data: {
            dbId,
            idmId,
            email,
          },
        });
      }
    }

    return problems;
  }

  static reportProblems(problems) {
    for (const prob of problems) {
      switch (prob.errorCode) {
        case 'count_mismatch': {
          console.warn('WARNING: Number of IDM and DB users are not equal');
          break;
        }
        case 'missing_db': {
          console.warn(`WARNING: Auth0 user "${prob.data.email}" not in DB`);
          break;
        }
        case 'missing_idm': {
          console.warn(`WARNING: DB user "${prob.data.email}" not in IDM`);
          break;
        }
        default: {
          console.warn(prob);
        }
      }
    }
  }

  async destructivelyResolveProblems(problems) {
    console.log(
      'Attempting to destructively resolve IDM and DB synchronization problems...',
    );

    for (const prob of problems) {
      switch (prob.errorCode) {
        case 'missing_db': {
          const { data } = prob;
          if (!data.idmId) {
            console.warn(
              `Unable to resolve problem missing_db with user "${data.email}"`,
            );
            break;
          }
          await this._connector.deleteUser(data.idmId);
          break;
        }
        case 'missing_idm': {
          const { data } = prob;
          if (!data.dbId) {
            console.warn(
              `Unable to resolve problem missing_idm with user "${data.email}"`,
            );
            break;
          }
          await this._hook.users.delete(data.dbId);
          break;
        }
      }
    }

    console.log('Synchronization problem resolution finished');
  }

  static findHighestUserRole(roles) {
    if (roles.length === 0) {
      return null;
    }
    roles.sort((r1, r2) => {
      return ROLE_RANKS.indexOf(r1.name) - ROLE_RANKS.indexOf(r2.name);
    });
    return roles[0].name;
  }

  /**
   * Converts the DB ID to an IDM ID.
   */
  async tryConvertDbToIdm(dbId, res) {
    let idmId = null;
    try {
      idmId = await this._hook.id.dbToIdm(dbId);
    } catch (e) {
      resInternalError(
        'database_error',
        `user not found in database: ${dbId}`,
        res,
      );
      throw new WError({
        name: 'HookError',
        message: 'unable to convert DB ID to IDM ID',
        cause: e,
      });
    }
    if (!idmId) {
      resNotFound(res);
    }
    return idmId;
  }

  /**
   * Gets the highest ranking role and set the role property.
   */
  async tryGetUserRole(idmId, email, res) {
    let roles;
    try {
      roles = await this._connector.getRoles(idmId);
    } catch (e) {
      resInternalError(
        'idp_error',
        `unable to get roles of user: ${email}`,
        res,
      );
      throw new WError({
        name: 'Auth0Error',
        message: `unable to get roles of user: ${email}`,
      });
    }
    return Users.findHighestUserRole(roles);
  }

  get handleGet() {
    return wrap({
      handler: async (req, res) => {
        const { id: dbId } = req.body;

        // Convert the DB id to an IDM id.
        const idmId = await this.tryConvertDbToIdm(dbId, res);
        if (!idmId) return;

        // Retrieve the raw user from Auth0.
        let rawUser;
        try {
          rawUser = await this._connector.getUser(idmId);
        } catch {
          return resNotFound(res);
        }

        // Filter out other fields.
        const user = utils.pick('email', 'email_verified', 'name')(rawUser);

        user.id = dbId;
        user.role = await this.tryGetUserRole(idmId, user.email, res);

        res.status(200).json(user);
      },
      validator: SCHEMAS.id,
    });
  }

  get handleList() {
    return wrap({
      handler: async (req, res) => {
        const rawUsers = await this._connector.listUsers();

        const users = [];

        for (const rawUser of rawUsers) {
          // Filter out other fields.
          const user = utils.pick('name', 'email', 'email_verified')(rawUser);

          // Obtain the IDM id from the raw user.
          const idmId = rawUser.user_id;

          // Convert the IDM id to a DB id.
          let dbId;
          try {
            dbId = await this._hook.id.idmToDb(idmId);
          } catch (e) {
            resInternalError(
              'database_error',
              `user not found in database: ${user.email}`,
              res,
            );
            throw new WError({
              name: 'HookError',
              message: 'unable to convert IDM ID to DB ID',
              cause: e,
            });
          }

          if (!dbId) {
            // There is inconsistency between the database and Auth0.
            resInternalError(
              'database_error',
              `user does not exist in database: ${user.email}`,
              res,
            );
            throw new WError({
              name: 'SyncError',
              message: `user does not exist in database: ${user.email}`,
            });
          }

          user.id = dbId;
          user.role = await this.tryGetUserRole(idmId, user.email, res);

          users.push(user);
        }

        res.status(200).json(users);
      },
    });
  }

  get handleCreate() {
    return wrap({
      handler: async (req, res) => {
        const { email, role, organization_id: orgId } = req.body;

        // Create a user on Auth0.
        let idmId;
        try {
          idmId = await this._connector.createUser(email);
        } catch (e) {
          if (e.name === 'ConflictError') {
            return res.status(409).json({
              statusCode: 409,
              error: 'Conflict',
              message: 'user already exists',
              errorCode: 'user_exists',
            });
          }
        }

        try {
          // Assign the correct role to the user.
          await this._connector.assignRole(idmId, role, true);
        } catch (e) {
          // Something messed up, revert Auth0 user creation.
          await this._connector.deleteUser(idmId);

          resInternalError('idp_error', 'unable to assign role to user', res);
          throw new WError({
            cause: e,
            name: 'Auth0Error',
            message: 'unable to assign role to user',
          });
        }

        try {
          // Add the user to an internal database.
          await this._hook.users.create(email, idmId, orgId);
        } catch (e) {
          // Something messed up, revert Auth0 user creation.
          await this._connector.deleteUser(idmId);

          resInternalError(
            'database_error',
            'unable to add user to database',
            res,
          );
          throw new WError({
            cause: e,
            name: 'HookError',
            message: 'unable to add user to database',
          });
        }

        res.status(201).end();
      },
      validator: SCHEMAS.create,
    });
  }

  get handleUpdate() {
    return wrap({
      handler: async (req, res) => {
        const { id: dbId, name } = req.body;

        if (!name) {
          return res.status(422).json({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'specify one of: "name"',
            errorCode: 'missing_attributes',
          });
        }

        // Convert the DB id to an IDM id.
        const idmId = await this.tryConvertDbToIdm(dbId, res);
        if (!idmId) return;

        try {
          // Update the Auth0 user.
          await this._connector.updateUser(idmId, { name });
        } catch (e) {
          resInternalError('idp_error', 'unable to update user', res);
          throw new WError({
            cause: e,
            name: 'Auth0Error',
            message: 'unable to update user',
          });
        }

        res.status(204).end();
      },
      validator: SCHEMAS.update,
    });
  }

  get handleAssignRole() {
    return wrap({
      handler: async (req, res) => {
        const { id: dbId, role } = req.body;

        // Convert the DB id to an IDM id.
        const idmId = await this.tryConvertDbToIdm(dbId, res);
        if (!idmId) return;

        try {
          // Assign a role to the Auth0 user.
          await this._connector.assignRole(idmId, role);
        } catch (e) {
          resInternalError('idp_error', 'unable to assign role to user', res);
          throw new WError({
            cause: e,
            name: 'Auth0Error',
            message: 'unable to assign role to user',
          });
        }

        res.status(204).end();
      },
      validator: SCHEMAS.role,
    });
  }

  get handleDelete() {
    return wrap({
      handler: async (req, res) => {
        const { id: dbId } = req.body;

        // Convert the DB id to an IDM id.
        const idmId = await this.tryConvertDbToIdm(dbId, res);
        if (!idmId) return;

        // Delete the Auth0 user.
        await this._connector.deleteUser(idmId);

        try {
          // Delete the database user.
          await this._hook.users.delete(dbId);
        } catch (e) {
          resInternalError(
            'database_error',
            'unable to delete user from database',
            res,
          );
          throw new WError({
            cause: e,
            name: 'HookError',
            message: 'unable to delete user from database',
          });
        }

        res.status(204).end();
      },
      validator: SCHEMAS.id,
    });
  }

  get handleSendPasswordResetEmail() {
    return wrap({
      handler: async (req, res) => {
        const { email } = req.body;

        try {
          await this._connector.sendPasswordResetEmail(email);
        } catch (e) {
          if (
            e.message ===
            'Unable to send password reset email, too many requests'
          ) {
            return res.status(429).json({
              statusCode: 429,
              error: 'Too Many Requests',
              message: 'too many requests, try again later',
              errorCode: 'too_many_requests',
            });
          }
          throw new WError({
            cause: e,
            name: 'Auth0Error',
            message: 'unable to send password reset email',
          });
        }

        res.status(202).end();
      },
      validator: SCHEMAS.email,
    });
  }
}

module.exports = Users;
