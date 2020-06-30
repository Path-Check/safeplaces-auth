const crypto = require('crypto');

function generateCSRFToken() {
  return crypto
    .randomBytes(32)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substr(0, 16);
}

function generateQueryString(obj) {
  let queryString = '';
  for (const [k, v] of Object.entries(obj)) {
    const encodedV = encodeURIComponent(String(v));
    queryString += `&${k}=${encodedV}`;
  }
  queryString = queryString.substr(1);
  return queryString;
}

function generateCookieString(attributes) {
  const { name, value, expires, httpOnly, sameSite, path, secure } = attributes;

  let cookieString = `${name}=${value};`;
  if (expires) {
    cookieString += expires.toUTCString + ';';
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

  return cookieString;
}
