const assert = require('assert');
const WError = require('../common/werror');
const requtils = require('./requtils');
const errorTranslator = require('./errortranslator');

class Enforcer {
  constructor(params) {
    assert.ok(params, 'enforcer parameters are required');

    const { strategy, userGetter, authorizer } = params;
    assert.ok(strategy, 'enforcer strategy is required');
    assert.ok(userGetter, 'enforcer user getter is required');

    if (authorizer) {
      assert.strictEqual(
        typeof authorizer,
        'function',
        'enforcer authorizer must be a function',
      );
    }

    this.strategy = strategy;
    this.userGetter = userGetter;
    this.authorizer = authorizer;
    this.verbose = process.env.AUTH_LOGGING === 'verbose';
  }

  secure(app) {
    app.use(this.handleRequest.bind(this));
  }

  async handleRequest(req, res, next) {
    try {
      await this.processRequest(req);
    } catch (e) {
      if (this.verbose) {
        console.log(e);
      }
      const errorCode = errorTranslator.lookup(e);
      return res
        .status(403)
        .header(errorTranslator.getHeaderNS(), errorCode)
        .send('Forbidden');
    }
    if (next) {
      return next();
    }
  }

  async processRequest(req) {
    Enforcer.checkCSRF(req);

    // Try to obtain the token from the header.
    const token = requtils.sourceCookie(req);

    let strategy = this.strategy;
    if (typeof strategy === 'function') {
      strategy = await Promise.resolve(strategy(req));
    }
    // Try to validate and decode the token.
    const decoded = await strategy.validate(token);

    let user;
    try {
      user = await this.userGetter(decoded.sub);
    } catch (e) {
      throw new WError({
        name: 'UserGetterError',
        message: 'user getter threw an error',
        cause: e,
      });
    }

    if (!user) {
      throw new WError({
        name: 'UserGetterError',
        message: 'user getter not found',
      });
    }
    req.user = user;

    if (this.authorizer) {
      try {
        this.authorizer(decoded, req);
      } catch (e) {
        if (this.verbose) {
          console.log(e);
        }
        throw new WError({
          name: 'AuthorizerError',
          message: 'authorizer threw an error',
          cause: e,
        });
      }
    }
  }

  static checkCSRF(req) {
    if (!req.headers) {
      throw new WError({
        name: 'MissingHeadersError',
        message: 'no headers found',
      });
    }
    const csrfHeader = req.headers['x-requested-with'];
    if (!csrfHeader) {
      throw new WError({
        name: 'MissingCSRFHeaderError',
        message: 'x-requested-with header not found',
      });
    }
    if (csrfHeader !== 'XMLHttpRequest') {
      throw new WError({
        name: 'InvalidCSRFHeaderError',
        message: 'invalid value in x-requested-with header: ' + csrfHeader,
      });
    }
  }
}

module.exports = Enforcer;
