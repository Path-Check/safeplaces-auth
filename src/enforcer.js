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
    app.use(this.handleRequest);
  }

  handleRequest(req, res, next) {
    return this.processRequest(req)
      .then(allow => {
        if (!allow) {
          return res.status(403).send('Forbidden');
        } else {
          return next();
        }
      })
      .catch(err => {
        return next(err);
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
