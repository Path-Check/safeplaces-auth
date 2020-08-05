const R = require('ramda');
const WError = require('../../utils/werror');
const users = require('../../services/users');
const registration = require('../../services/registration');
const schema = require('./schema');

/**
 * Middleware
 */
const sequential = require('../middleware/sequential');
const validator = require('../middleware/validator');
const idTranslator = require('../middleware/idTranslator');
const errorHandler = require('../middleware/errorHandler');

const ROLE_RANKS = ['super_admin', 'admin', 'contact_tracer'];

/**
 * Determines the highest-ranking role of an array of roles.
 *
 * @param roles{Array} An array of roles.
 * @returns {null|*} The highest ranking role, or null if no roles were given.
 */
const findHighestUserRole = roles => {
  if (roles.length === 0) {
    return null;
  }
  roles.sort((r1, r2) => {
    return ROLE_RANKS.indexOf(r1.name) - ROLE_RANKS.indexOf(r2.name);
  });
  return roles[0].name;
};

const getUser = R.curry(async (config, service, req, res) => {
  const { idmId } = req.body;

  let user;
  try {
    user = await service.getUser(idmId);
  } catch (e) {
    if (WError.hasCauseWithName(e, 'UserNotFound')) {
      res.status(404).json({
        error: 'UserNotFound',
        message: 'User not found',
      });
      return;
    }

    throw e;
  }

  try {
    const roles = await service.getRolesOfUser(user.user_id);
    user.role = findHighestUserRole(roles);
  } catch (e) {
    res.status(500).json({
      error: 'IDPError',
      message: `Unable to get role of user: ${user.email}`,
    });

    throw e;
  }

  // Set the database ID of the user.
  user.id = req.body.id;
  // Remove the IDM ID of the user.
  delete user.user_id;

  res.status(200).json(user);
});

const listUsers = R.curry(async (config, service, req, res) => {
  const { db } = config;

  const users = await service.listUsers();

  for (const user of users) {
    /**
     * Convert the IDM IDs to DB IDs.
     */
    try {
      user.id = await db.idmToDb(user.user_id);
    } catch (e) {
      res.status(500).json({
        error: 'DBError',
        message: `Unable to find user in database: ${user.email}`,
      });

      throw e;
    }

    /**
     * Get the role of each user.
     */
    try {
      const roles = await service.getRolesOfUser(user.user_id);
      user.role = findHighestUserRole(roles);
    } catch (e) {
      res.status(500).json({
        error: 'IDPError',
        message: `Unable to get role of user: ${user.email}`,
      });

      throw e;
    }

    delete user.user_id;
  }

  res.status(200).json(users);
});

const createUser = R.curry(async (config, service, req, res) => {
  const { db, privateKey } = config;
  const {
    email,
    role,
    organization_id: orgId,
    redirect_url: redirectUrl,
  } = req.body;

  /**
   * Create the user in Auth0.
   */
  let idmId;
  try {
    const user = await service.createUser(email);
    idmId = user.user_id;
  } catch (e) {
    if (WError.hasCauseWithName(e, 'UserConflict')) {
      res.status(409).json({
        error: 'UserConflict',
        message: 'User already exists',
      });
      return;
    }

    throw e;
  }

  /**
   * Assign the role to the user.
   */
  try {
    await service.assignRoleToUser(idmId, role);
  } catch (e) {
    // Revert user creation.
    await service.deleteUser(idmId);

    res.status(500).json({
      error: 'IDPError',
      message: 'Unable to assign role to user',
    });

    throw e;
  }

  /**
   * Create the user in the database.
   */
  let dbId;
  try {
    dbId = await db.createUser(email, idmId, orgId);
  } catch (e) {
    // Revert user creation.
    await service.deleteUser(idmId);

    res.status(500).json({
      error: 'DBError',
      message: 'Unable to create user in DB',
    });

    throw e;
  }

  /**
   * Issue a registration token.
   */
  let redirect;
  try {
    const regToken = registration.issueRegistrationToken(
      privateKey,
      idmId,
      '5d',
    );
    redirect = `${redirectUrl}?t=${encodeURIComponent(regToken)}`;
  } catch (e) {
    // Revert user creation.
    await service.deleteUser(idmId);
    await db.deleteUser(idmId);

    res.status(500).json({
      error: 'SigningError',
      message: 'Unable to issue registration token',
    });

    throw e;
  }

  /**
   * Create an email verification ticket.
   */
  let ticket;
  try {
    ({ ticket } = await service.createEmailVerificationTicket(idmId, redirect));
  } catch (e) {
    // Revert user creation.
    await service.deleteUser(idmId);
    await db.deleteUser(idmId);

    res.status(500).json({
      error: 'IDPError',
      message: 'Unable to create email verification ticket',
    });

    throw e;
  }

  res.status(201).json({ registration_url: ticket, id: dbId });
});

const deleteUser = R.curry(async (config, service, req, res) => {
  const { db } = config;
  const { idmId } = req.body;

  /**
   * Delete the user from the database.
   */
  try {
    await db.deleteUser(idmId);
  } catch (e) {
    res.status(500).json({
      error: 'DBError',
      message: 'Unable to delete user from DB',
    });

    throw e;
  }

  /**
   * Delete the user from Auth0.
   */
  try {
    await service.deleteUser(idmId);
  } catch (e) {
    res.status(500).json({
      error: 'IDPError',
      message: 'Unable to delete user from IDP',
    });

    throw e;
  }

  res.status(204).end();
});

const assignRole = R.curry(async (config, service, req, res) => {
  const { idmId, role } = req.body;

  try {
    await service.removeRolesFromUser(idmId);
  } catch (e) {
    res.status(500).json({
      error: 'IDPError',
      message: 'Unable to remove existing roles from user',
    });

    throw e;
  }

  try {
    await service.assignRoleToUser(idmId, role);
  } catch (e) {
    res.status(500).json({
      error: 'IDPError',
      message: 'Unable to assign role to user',
    });

    throw e;
  }

  res.status(204).end();
});

const register = R.curry(async (config, service, req, res) => {
  const { name, password } = req.body;
  const { headers } = req;

  if (!headers.authorization) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing registration token',
    });
    return;
  }

  const regToken = headers.authorization.replace(/^bearer /gi, '');

  let idmId;
  try {
    ({ sub: idmId } = registration.decodeRegistrationToken(
      config.privateKey,
      regToken,
    ));
  } catch (e) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid registration token',
    });
    return;
  }

  try {
    await service.updateUser(idmId, { name, password });
  } catch (e) {
    res.status(500).json({
      error: 'IDPError',
      message: 'Unable to update user registration',
    });
    throw e;
  }

  res.status(204).end();
});

module.exports = config => {
  const service = users.service(config);
  return {
    get: sequential(
      validator(schema.id),
      idTranslator(config),
      getUser(config, service),
      errorHandler(),
    ),
    list: sequential(listUsers(config, service)),
    create: sequential(
      validator(schema.create),
      createUser(config, service),
      errorHandler(),
    ),
    delete: sequential(
      validator(schema.id),
      idTranslator(config),
      deleteUser(config, service),
      errorHandler(),
    ),
    assignRole: sequential(
      validator(schema.assignRole),
      idTranslator(config),
      assignRole(config, service),
      errorHandler(),
    ),
    register: sequential(
      validator(schema.register),
      register(config, service),
      errorHandler(),
    ),
  };
};
