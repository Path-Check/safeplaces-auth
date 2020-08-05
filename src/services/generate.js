const crypto = require('crypto');

const password = length => {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substr(0, length);
};

function cookieString(attributes) {
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
}

module.exports = { password, cookieString };
