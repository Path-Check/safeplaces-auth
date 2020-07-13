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

module.exports = { cookieString };
