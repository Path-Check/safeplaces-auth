const fetch = require('node-fetch');
const generate = require('../generate');

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
      throw new Error('Auth0 DB connection is required');
    }
    this.auth0 = auth0;
    this.cookie = cookie || {
      sameSite: false,
      secure: false,
    };
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
          sameSite: !!this.cookie.sameSite,
          secure: !!this.cookie.secure,
        });
        res.status(204).header('Set-Cookie', cookieString).end();
      })
      .catch(() => {
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
    const params = new URLSearchParams();
    params.append(
      'grant_type',
      'http://auth0.com/oauth/grant-type/password-realm',
    );
    params.append('username', username);
    params.append('password', password);
    params.append('audience', this.auth0.apiAudience);
    params.append('client_id', this.auth0.clientId);
    params.append('client_secret', this.auth0.clientSecret);
    params.append('realm', this.auth0.realm);
    params.append('scope', 'openid');

    const response = await fetch(`${this.auth0.baseUrl}/oauth/token`, {
      method: 'POST',
      body: params,
    });
    const json = await response.json();

    const accessToken = json['access_token'];
    const expiresIn = json['expires_in'];
    if (!accessToken || !expiresIn) {
      throw new Error('Access token or expiration is missing');
    }

    return {
      accessToken,
      expiresIn,
    };
  }
}

module.exports = Login;
