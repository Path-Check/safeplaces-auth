const WError = require('../common/werror');

class ErrorTranslator {
  constructor(params) {
    this.errors = params.errors;
    this.headerNamespace = params.header;
  }

  getHeaderNS() {
    return this.headerNamespace;
  }

  lookup(err) {
    if (err.name in this.errors) {
      return this.errors[err.name];
    }
    const cause = WError.getCause(err);
    if (cause) {
      return this.lookup(cause);
    }
    return 'unknown';
  }
}

const errorTranslator = new ErrorTranslator({
  errors: {
    JWTValidationError: 'jwt/validation',
    JWKSClientError: 'jwt/jwks-client',

    UserGetterError: 'external/user-getter',
    AuthorizerError: 'external/authorizer',

    MissingHeadersError: 'headers/missing',
    MissingCSRFHeaderError: 'headers/csrf-missing',
    InvalidCSRFHeaderError: 'headers/csrf-invalid',
    MissingAuthorizationHeaderError: 'headers/auth-missing',
    MissingAccessTokenHeaderError: 'headers/token-missing',

    MissingBodyError: 'body/missing',
    MissingCredentialsError: 'body/credentials-missing',

    Auth0Error: 'external/idp',

    MissingCookiesError: 'cookies/missing',
    MissingAccessTokenCookieError: 'cookies/token-missing',
  },
  header: 'PCF-Request-Tag',
});

module.exports = errorTranslator;
