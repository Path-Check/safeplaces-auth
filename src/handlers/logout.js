const generate = require('../generate');

class Logout {
  constructor({ redirect, cookie }) {
    if (!redirect) {
      throw new Error('Logout redirect URL is required');
    }

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
      expires: new Date(1970, 1, 2),
      httpOnly: true,
      sameSite: !!this.cookie.sameSite,
      secure: !!this.cookie.secure,
    });

    res.status(302).header('Set-Cookie', cookieString).redirect(this.redirect);
  }
}

module.exports = Logout;
