const reqUtils = require('./requtils');

class Enforcer {
  constructor({ strategy, userGetter }) {
    if (!strategy) {
      throw new Error('Enforcer strategy is required');
    }
    if (!userGetter) {
      throw new Error('Enforcer user getter is required');
    }

    this.strategy = strategy;
    this.userGetter = userGetter;
    this.verbose = process.env.AUTH_LOGGING === 'verbose';
  }

  secure(app) {
    app.use(this.handleRequest.bind(this));
  }

  handleRequest(req, res, next) {
    return this.processRequest(req)
      .then(() => {
        if (!next) return;
        next();
      })
      .catch(err => {
        if (this.verbose) {
          console.log(err);
        }
        res.status(403).send('Forbidden');
      });
  }

  async processRequest(req) {
    // Try to obtain the token from the header.
    const token = reqUtils.sourceCookie(req);

    let strategy = this.strategy;
    if (typeof strategy === 'function') {
      strategy = await Promise.resolve(strategy(req));
    }
    // Try to validate and decode the token.
    const decoded = await strategy.validate(token);

    req.user = await this.userGetter(decoded.sub);
  }
}

module.exports = Enforcer;
