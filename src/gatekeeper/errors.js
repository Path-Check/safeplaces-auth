class Errors {
  constructor() {
    this.errors = {};
    this.headerNamespace = 'PCF-Request-Tag';
  }

  use(headerNamespace) {
    this.headerNamespace = headerNamespace;
  }

  getHeaderNS() {
    return this.headerNamespace;
  }

  register(name, code) {
    this.errors[name] = { code };
  }

  lookup(errName) {
    if (errName in this.errors) {
      return this.errors[errName].code;
    }
    return 'u/f';
  }

  construct(name, message) {
    const e = new Error(message);
    e.name = name;
    Error.captureStackTrace(e, this.construct);
    return e;
  }
}

const errors = new Errors();
errors.use('PCF-Request-Tag');

errors.register('MissingHeaders', 'h/m');
errors.register('MissingCSRFHeader', 'h/m.c');
errors.register('InvalidCSRFHeader', 'h/x.c');
errors.register('MissingAuthorizationHeader', 'h/m.au');
errors.register('MissingAccessTokenHeader', 'h/m.at');

errors.register('MissingRequestBody', 'b/m');
errors.register('MissingCredentials', 'cr/m');

errors.register('MissingCookies', 'c/m');
errors.register('MissingAccessTokenCookie', 'c/m.at');

errors.register('UserGetterFailure', 'e/f.ug');
errors.register('UserGetterNotFound', 'e/m.ug');
errors.register('AuthorizerFailure', 'e/f.au');
errors.register('Auth0Failure', 'e/f.idm');

errors.register('JSONWebKeySet', 'j/wk');
errors.register('JSONWebToken', 'j/wt');

module.exports = errors;
