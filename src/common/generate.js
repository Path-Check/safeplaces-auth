const crypto = require('crypto');

function cookieString(attributes) {
  if (!attributes) {
    throw new Error('Cookie attributes are required');
  }
  if (!attributes.name || !attributes.value) {
    throw new Error('Cookie name and value are required');
  }
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

function password(length) {
  if (length === null || length === undefined) {
    throw new Error('Password length is required');
  }

  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substr(0, length);
}

module.exports = { cookieString, password };
