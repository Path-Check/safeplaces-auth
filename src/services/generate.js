const crypto = require('crypto');

const password = length => {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substr(0, length);
};

const cookieString = attributes => {
  const {
    name,
    value,
    expires,
    httpOnly,
    sameSite,
    path,
    secure,
    domain,
  } = attributes;

  let cookieString = `${name}=${value};`;
  if (expires) {
    cookieString += `Expires=${expires.toUTCString()};`;
  }
  if (path) {
    cookieString += `Path=${path};`;
  }
  if (httpOnly) {
    cookieString += 'HttpOnly;';
  }
  if (secure) {
    cookieString += 'Secure;';
  }
  if (sameSite) {
    cookieString += 'SameSite=Strict;';
  } else {
    cookieString += 'SameSite=None;';
  }
  if (domain) {
    cookieString += `Domain=${domain};`;
  }

  return cookieString;
};

/**
 * Generates a cookie string based on cookie settings and token data.
 *
 * @param config A configuration object with cookie settings.
 * @param tokenData{{access_token: string, expires_in: number}} Token data returned by Auth0.
 * @returns {string} A cookie string.
 */
const tokenCookieString = (config, tokenData) => {
  return cookieString({
    name: 'access_token',
    value: tokenData.access_token,
    path: '/',
    expires: new Date(Date.now() + tokenData.expires_in * 1000),
    httpOnly: true,
    sameSite: !!config.cookie.sameSite,
    secure: !!config.cookie.secure,
    domain: config.cookie.domain,
  });
};

module.exports = { password, cookieString, tokenCookieString };
