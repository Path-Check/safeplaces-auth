const ow = require('ow');
const WError = require('../utils/werror');
const detection = require('./detection');

function Guard(config) {
  try {
    ow(
      config,
      'guard config',
      ow.object.exactShape({
        strategy: ow.function,
        jwksUri: ow.string,
        getUser: ow.function,
        authorize: ow.function,
        verbose: ow.optional.boolean,
      }),
    );
  } catch (e) {
    throw new Error(e.message);
  }

  this.config = config;
}

Guard.prototype.handleReq = async function (req, res, callback) {
  try {
    await this.verifyReq(req);
  } catch (e) {
    if (this.config.verbose) {
      console.log(e);
    }
    res.status(403).send('Forbidden');
    return;
  }

  callback(req, res);
};

/**
 * Verifies that a request is authorized.
 *
 * @param req The request to verify.
 * @returns {Promise<void>} A promise resolving nothing.
 * @throws {WError} An error describing why the request was rejected.
 */
Guard.prototype.verifyReq = async function (req) {
  const { getUser, authorize } = this.config;

  /**
   * Check that CSRF header exists and is valid.
   */
  detection.csrf(req);

  /**
   * Check and obtain access token from cookies.
   */
  const accessToken = detection.cookies(req);

  /**
   * Verify access token.
   */
  const strategy =
    this.config.strategy.length === 1
      ? this.config.strategy
      : await this.config.strategy();

  const decoded = await strategy(accessToken);

  let user;
  try {
    /**
     * Get the user from the database.
     */
    user = await getUser(decoded.sub);
  } catch (e) {
    throw new WError({
      name: 'DBError',
      message: 'Unable to retrieve user from DB',
      cause: e,
    });
  }
  req.user = user;

  if (authorize) {
    try {
      /**
       * Invoke authorize callback.
       */
      authorize(decoded, req);
    } catch (e) {
      throw new WError({
        name: 'AuthorizeError',
        message: 'Authorize threw an error',
        cause: e,
      });
    }
  }
};

module.exports = Guard;
