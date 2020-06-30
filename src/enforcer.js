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
  }

  secure(app) {
    app.use((req, res, next) => {
      const allow = this.processRequest(req);
      if (!allow) {
        return res.status(401).send('Unauthorized');
      } else {
        return next();
      }
    });
  }

  async processRequest(req) {
    let token = null;
    try {
      // Try to obtain the token from the header.
      token = reqUtils.sourceCookie(req);
    } catch (e) {
      return false;
    }

    let decoded;
    try {
      // Try to validate and decode the token.
      decoded = await this.strategy.validate(token);
    } catch (e) {
      return false;
    }

    req.user = await this.userGetter(decoded.sub);

    return true;
  }
}

module.exports = Enforcer;
