# Appendix

## Adding Roles to Access Tokens

To automatically add roles to issued access tokens, create a blank Auth0 rule
and paste in the following, replacing constants as needed:

```javascript
function (user, context, callback) {
  const namespace = 'https://your-api.com';
  const assignedRoles = (context.authorization || {}).roles;

  const idTokenClaims = context.idToken || {};
  const accessTokenClaims = context.accessToken || {};

  idTokenClaims[`${namespace}/roles`] = assignedRoles;
  accessTokenClaims[`${namespace}/roles`] = assignedRoles;

  context.idToken = idTokenClaims;
  context.accessToken = accessTokenClaims;

  return callback(null, user, context);
}

```

The `namespace` variable should be a fully-qualified domain that one owns, with
no trailing slash. Save this namespace constant in the `AUTH0_CLAIM_NAMESPACE`
environment variable. It may look very similar to the `AUTH0_API_AUDIENCE`
environment variable, but note that the API audience likely has a trailing
slash, which is not acceptable in the claim namespace.

---

[Home](../README.md) › [SafePlaces Information Security Concepts](README.md)
› Appendix
