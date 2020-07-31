const assert = require('assert');
const generate = require('../common/generate');

class Logout {
  constructor(params) {
    assert.ok(params, 'logout parameters are required');
    const { redirect, cookie } = params;
    assert.ok(redirect, 'logout redirect URL is required');

    this.redirect = redirect;
    this.cookie = cookie || {
      sameSite: false,
      secure: false,
    };
  }

  handle(req, res) {
    const cookieString = generate.cookieString({
      name: 'access_token',
      value: 'deleted',
      path: '/',
      expires: new Date(1970, 1, 1),
      httpOnly: true,
      sameSite: !!this.cookie.sameSite,
      secure: !!this.cookie.secure,
      domain: this.cookie.domain,
    });

    res.status(302).header('Set-Cookie', cookieString).redirect(this.redirect);
  }
}

module.exports = Logout;
