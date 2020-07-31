const fetch = require('node-fetch');
const assert = require('assert');
const WError = require('../common/werror');
const Multifactor = require('../gatekeeper/multifactor');
const generate = require('../common/generate');
const errorTranslator = require('../gatekeeper/errortranslator');

class Login {
  constructor(params) {
    assert.ok(params, 'Auth0 parameters are required');

    const { auth0, cookie } = params;
    assert.ok(auth0, 'Auth0 attribute is required');
    assert.ok(auth0.baseUrl, 'Auth0 base URL is required');
    assert.ok(auth0.apiAudience, 'Auth0 API audience is required');
    assert.ok(auth0.clientId, 'Auth0 client ID is required');
    assert.ok(auth0.clientSecret, 'Auth0 client secret is required');
    assert.ok(auth0.realm, 'Auth0 realm is required');

    this.multifactor = new Multifactor({
      baseUrl: auth0.baseUrl,
      clientId: auth0.clientId,
      clientSecret: auth0.clientSecret,
    });
    this._auth0 = auth0;
    this._cookie = cookie || {
      sameSite: false,
      secure: false,
    };
    this._verbose = process.env.AUTH_LOGGING === 'verbose';
  }

  handle(req, res) {
    return (
      this.processRequest(req)
        // .catch(err => {
        //   if (!VError.hasCauseWithName('MFARequiredError')) {
        //     throw err;
        //   }
        //
        //   const { mfaToken } = VError.info(err);
        //   // List MFA authenticators.
        //   return this.multifactor.listAuthenticators(mfaToken)
        //     .then(authenticators => {
        //       if (authenticators.length === 0) {
        //         res.status(401).json({
        //           statusCode: 401,
        //           error: 'Unauthorized',
        //           message: 'no multifactor authenticator added',
        //           errorCode: 'missing_mfa',
        //         });
        //         throw new VError({ name: 'MissingMfaError' }, 'no multifactor authenticator added');
        //       }
        //       const validAuthenticators = authenticators.filter(auth => {
        //         return auth.authenticator_type === 'oob'
        //           && auth.oob_channel === 'sms' && !!auth.active;
        //       });
        //       if (validAuthenticators.length === 0) {
        //         res.status(401).json({
        //           statusCode: 401,
        //           error: 'Unauthorized',
        //           message: 'no valid multifactor authenticator found',
        //           errorCode: 'missing_mfa',
        //         });
        //         throw new VError({ name: 'MissingMfaError' }, 'no valid multifactor authenticator found');
        //       }
        //       const authId = validAuthenticators[0].id;
        //
        //       return this.multifactor.requestChallenge(mfaToken, authId);
        //     })
        //     .then(data => {
        //
        //     });
        // })
        .then(({ accessToken, expiresIn }) => {
          const cookieString = generate.cookieString({
            name: 'access_token',
            value: accessToken,
            path: '/',
            expires: new Date(Date.now() + expiresIn * 1000),
            httpOnly: true,
            sameSite: !!this._cookie.sameSite,
            secure: !!this._cookie.secure,
            domain: this._cookie.domain,
          });
          res.status(204).header('Set-Cookie', cookieString).end();
        })
        .catch(err => {
          // Ignore missing MFA errors.
          if (WError.hasCauseWithName(err, 'MissingMfaError')) return;

          if (this._verbose) {
            console.log(err);
          }
          const errorCode = errorTranslator.lookup(err);
          res
            .status(401)
            .header(errorTranslator.getHeaderNS(), errorCode)
            .send('Unauthorized');
        })
    );
  }

  async processRequest(req) {
    if (!req.body) {
      throw new WError({
        name: 'MissingBodyError',
        message: 'no request body found',
      });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      throw new WError({
        name: 'MissingCredentialsError',
        message: 'username or password is missing',
      });
    }

    return this.fetchAccessToken({ username, password });
  }

  async fetchAccessToken({ username, password }) {
    const params = new URLSearchParams({
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      username,
      password,
      audience: this._auth0.apiAudience,
      client_id: this._auth0.clientId,
      client_secret: this._auth0.clientSecret,
      realm: this._auth0.realm,
      scope: 'openid',
    });

    const res = await fetch(`${this._auth0.baseUrl}/oauth/token`, {
      method: 'POST',
      body: params,
    });
    const json = await res.json();

    if (json.error === 'mfa_required') {
      const mfaToken = json.mfa_token;
      throw new WError({
        name: 'MFARequiredError',
        message: 'multifactor authentication is required',
        data: { mfaToken },
      });
    }

    const accessToken = json.access_token;
    const expiresIn = json.expires_in;
    if (!accessToken || !expiresIn) {
      throw new WError({
        name: 'Auth0Error',
        message: 'access token or expiration is missing',
        data: { res: json },
      });
    }

    return {
      accessToken,
      expiresIn,
    };
  }
}

module.exports = Login;
