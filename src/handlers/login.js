const fetch = require('node-fetch');
const generate = require('../common/generate');

class Login {
  constructor({ auth0, cookie }) {
    if (!auth0) {
      throw new Error('Auth0 attribute is required');
    }
    if (!auth0.baseUrl) {
      throw new Error('Auth0 base url is required');
    }
    if (!auth0.apiAudience) {
      throw new Error('Auth0 API audience is required');
    }
    if (!auth0.clientId) {
      throw new Error('Auth0 client id is required');
    }
    if (!auth0.clientSecret) {
      throw new Error('Auth0 client secret is required');
    }
    if (!auth0.realm) {
      throw new Error('Auth0 realm is required');
    }
    this._auth0 = auth0;
    this._cookie = cookie || {
      sameSite: false,
      secure: false,
    };
    this._verbose = process.env.AUTH_LOGGING === 'verbose';
  }

  handle(req, res) {
    return this.processRequest(req)
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
        if (this._verbose) {
          console.log(err);
        }
        res.status(401).send('Unauthorized');
      });
  }

  async processRequest(req) {
    if (!req.body) {
      throw new Error('No request body found');
    }

    const { username, password } = req.body;
    if (!username || !password) {
      throw new Error('Username or password is missing');
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

    const response = await fetch(`${this._auth0.baseUrl}/oauth/token`, {
      method: 'POST',
      body: params,
    });
    const json = await response.json();

    const accessToken = json['access_token'];
    const expiresIn = json['expires_in'];
    if (!accessToken || !expiresIn) {
      if (this._verbose) {
        console.log(json);
      }
      throw new Error('Access token or expiration is missing');
    }

    return {
      accessToken,
      expiresIn,
    };
  }
}

module.exports = Login;
