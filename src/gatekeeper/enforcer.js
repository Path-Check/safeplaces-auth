const requtils = require('./requtils');
const errors = require('./errors');

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
      const note = await this.processRequest(req);
      // Some problem was encountered, indicate this to the client via a header.
      if (note) {
        const errorCode = errors.lookup(note);
        res.header(errors.getHeaderNS(), errorCode);
      }
    } catch (e) {
      if (this.verbose) {
        console.log(e);
      }
      const errorCode = errors.lookup(e.name);
      return res
        .status(403)
        .header(errors.getHeaderNS(), errorCode)
        .send('Forbidden');
    }
    if (next) {
      return next();
    }
  }

  async processRequest(req) {
    let note = null;

    Enforcer.checkCSRF(req);

    // Try to obtain the token from the header.
    const token = requtils.sourceCookie(req);

    let strategy = this.strategy;
    if (typeof strategy === 'function') {
      strategy = await Promise.resolve(strategy(req));
    }
    // Try to validate and decode the token.
    const decoded = await strategy.validate(token);

    try {
      const user = await this.userGetter(decoded.sub);
      if (!user) {
        if (this.verbose) {
          console.error(
            `Could not obtain user ${decoded.sub} from user getter`,
          );
        }
        note = 'UserGetterNotFound';
      }
      req.user = user;
    } catch (e) {
      throw errors.construct('UserGetterFailure', e.message);
    }

    if (this.authorizer) {
      try {
        this.authorizer(decoded, req);
      } catch (e) {
        throw errors.construct('AuthorizerFailure', e.message);
      }
    }

    return note;
  }

  static checkCSRF(req) {
    if (!req.headers) {
      throw errors.construct('MissingHeaders', 'No headers found');
    }
    const csrfHeader = req.headers['x-requested-with'];
    if (!csrfHeader) {
      throw errors.construct(
        'MissingCSRFHeader',
        'x-requested-with header not found',
      );
    }
    if (csrfHeader !== 'XMLHttpRequest') {
      throw errors.construct(
        'InvalidCSRFHeader',
        `Invalid value in x-requested-with header: ${csrfHeader}`,
      );
    }
  }
}

module.exports = Enforcer;
