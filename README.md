# SafePlaces Authentication Service

[![Build Status](https://github.com/Path-Check/safeplaces-auth/workflows/Node.js%20CI/badge.svg)](https://github.com/Path-Check/safeplaces-auth/actions?query=workflow%3A%22Node.js+CI%22)
[![Coverage Status](https://coveralls.io/repos/github/Path-Check/safeplaces-auth/badge.svg?branch=master)](https://coveralls.io/github/Path-Check/safeplaces-auth?branch=master)

The modular authentication service for the SafePlaces backend.

```shell script
# Install using NPM
npm install @pathcheck/safeplaces-auth@^1.0.0-alpha.5

# Install using Yarn
yarn add @pathcheck/safeplaces-auth@^1.0.0-alpha.5
```

# Table of Contents
* [Examples](#examples)
  * [Securing API endpoints](#securing-api-endpoints)
  * [Handling login requests](#handling-login-requests)
  * [Handling logout requests](#handling-logout-requests)
* [Strategies](#strategies)
  * [Auth0](#auth0)
  * [Symmetric JWT](#symmetric-jwt)
  * [Dynamic strategy selection](#dynamic-strategy-selection)
* [Debugging](#debugging)

# Examples

## Securing API endpoints

The authentication service can be instantiated and attached to an
existing Express application. The point or order at which you attach
the service relative to other middleware affects the point at which
it is invoked.

```javascript
const auth = require('@pathcheck/safeplaces-auth');

// Instantiate a public key retrieval client.
const pkClient = new auth.JWKSClient(
  // Pass the URL for the JWKS.
  `${process.env.AUTH0_BASE_URL}/.well-known/jwks.json`,
);

// Instantiate a request verification strategy.
const auth0Strategy = new auth.strategies.Auth0({
  jwksClient: pkClient,
  // The API audience is checked against the user's access token.
  apiAudience: process.env.AUTH0_API_AUDIENCE,
});

// Instantiate a strategy enforcer.
const enforcer = new auth.Enforcer({
  strategy: auth0Strategy,
  // Pass in an asynchronous database lookup function
  // that takes the user ID as the only argument.
  userGetter: id => User.findOne(id),
});

// `app` is your Express application.
// A middleware is attached to the app, and it intercepts every
// request for verification. The argument to `enforcer.secure`
// affects which routes are secured.
enforcer.secure(app);
```

For greater flexibility, you access the built-in `enforcer.handleRequest(req, res)`
function to selectively handle requests under your own logic. Note that `enforcer`
will continue to end the request with `403 Forbidden` if the request is unauthorized.

```javascript
app.use((req, res, next) => {
  if (req.headers['X-Bypass-Login']) {
    return next();
  } else {
    return enforcer
      // Enforcer ends the request with a `403 Forbidden` if it is unauthorized,
      // meaning `next` will not be called unless the request is authorized.
      .handleRequest(req, res, next)
      .catch(err => next(err));
  }
});
```

For the most flexibility, you can use `enforcer.processRequest(req)` to only validate a request,
allowing you to decide how to handle the validation result yourself, whether that be ending
the request or ignoring the error.

```javascript
app.use((req, res, next) => {
  enforcer
    .processRequest(req)
    // `.then` is called only if `processRequest` has
    // determined the request to be authorized.
    .then(note => {
      // `note` is an error encountered by `processRequest` that may be indicated in server logs
      // or in a request header. It was not enough to halt the request, but the server
      // may encounter an unexpected error if logic continues.
      console.log(note);
      next();
    })
    // Otherwise, an error describing the validation error
    // will be thrown, and you can decide what to do with it.
    .catch(err => res.status(403).send('Forbidden'));
});
```

## Handling login requests

```javascript
// Instantiate a login handler.
const loginHandler = new auth.handlers.Login({
  auth0: {
    baseUrl: process.env.AUTH0_BASE_URL,
    apiAudience: process.env.AUTH0_API_AUDIENCE,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    realm: process.env.AUTH0_REALM,
  },
  cookie: {
    // Enable/disable cookie attributes depending on environment.
    secure: process.env.NODE_ENV !== 'development',
    sameSite: process.env.BYPASS_SAME_SITE !== 'true',
  },
});

// Handle all requests to the login endpoint.
// Since we are passing around the `handle` function, make sure
// to bind the handle function to its object.
app.post('/auth/login', loginHandler.handle.bind(loginHandler));
```

## Handling logout requests

```javascript
// Instantiate a logout handler.
const logoutHandler = new auth.handlers.Logout({
  redirect: 'https://example.com/logout-success/',
  cookie: {
    // Enable/disable cookie attributes depending on environment.
    secure: process.env.NODE_ENV !== 'development',
    sameSite: process.env.BYPASS_SAME_SITE !== 'true',
  },
});

// Handle all requests to the logout endpoint.
// Since we are passing around the `handle` function, make sure
// to bind the handle function to its object.
app.get('/auth/logout', logoutHandler.handle.bind(logoutHandler));
```

# Strategies

**Supported strategies:**
- Auth0 asymmetric JWT
- Symmetric JWT

## Auth0

Validate the JSON Web Token by checking the signature with
the retrieved public key, and validate the API audience.

```javascript
const auth = require('@pathcheck/safeplaces-auth');

const pkClient = new auth.JWKSClient(
  `${process.env.AUTH0_BASE_URL}/.well-known/jwks.json`,
);
const auth0Strategy = new auth.strategies.Auth0({
  jwksClient: pkClient,
  apiAudience: process.env.AUTH0_API_AUDIENCE,
});
```

## Symmetric JWT

Validate the JSON Web Token by checking the signature with
a fixed private key.

```javascript
const auth = require('@pathcheck/safeplaces-auth');

const symJWTStrategy = new auth.strategies.SymJWT({
  algorithm: 'HS256',
  privateKey: process.env.JWT_SECRET,
});
```

## Dynamic strategy selection

You can also pass a function into the strategy parameter
to dynamically select the strategy based on the request
or some other variables.

The function should accept the request as the only argument
and return the desired strategy or a promise resolving the
desired strategy.

```javascript
const enforcer = new auth.Enforcer({
  strategy: req => {
    console.log(req);
    // Check something in the request.
    // ...
    // Example conditional:
    if (process.env.NODE_ENV === 'development') {
      return symJWTStrategy;
    } else {
      return auth0Strategy;
    }
  },
});
```

# Debugging

To debug why the `enforcer` is rejecting a request, set the
`AUTH_LOGGING` environment variable to `verbose`, and the request
validation error will be logged every time.
