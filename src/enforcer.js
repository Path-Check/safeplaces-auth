const reqUtils = require('./requtils');

class Enforcer {
  constructor({ strategy, userGetter, authorizer }) {
    if (!strategy) {
      throw new Error('Enforcer strategy is required');
    }
    if (!userGetter) {
      throw new Error('Enforcer user getter is required');
    }
    if (authorizer && typeof authorizer !== 'function') {
      throw new Error('Enforcer authorizer must be a function');
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
      res.status(403).send('Forbidden');
      return;
    }
    if (!next) return;
    return next(req, res);
  }

  async processRequest(req) {
    Enforcer.checkCSRF(req);

    // Try to obtain the token from the header.
    const token = reqUtils.sourceCookie(req);

    let strategy = this.strategy;
    if (typeof strategy === 'function') {
      strategy = await Promise.resolve(strategy(req));
    }
    // Try to validate and decode the token.
    const decoded = await strategy.validate(token);

    req.user = await this.userGetter(decoded.sub);

    if (this.authorizer) {
      this.authorizer(decoded, req);
    }
  }

  static checkCSRF(req) {
    if (!req.headers) {
      throw new Error('No headers found');
    }
    const csrfHeader = req.headers['x-requested-with'];
    if (!csrfHeader) {
      throw new Error('x-requested-with header not found');
    }
    if (csrfHeader !== 'XMLHttpRequest') {
      throw new Error(
        `Invalid value in x-requested-with header: ${csrfHeader}`,
      );
    }
  }
}

module.exports = Enforcer;
