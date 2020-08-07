# Reflect the permissions held by an access token

Primarily used for debugging, the endpoint's response determines whether the
provided access token possesses sufficient permissions to access the resources
under the `/auth/users` path.

```http request
GET /auth/users/reflect
```

## Default Response

The user possesses sufficient permissions to access the user management resources.

```http request
Status: 204 No Content
```

## Error Response

The user does not possess the requisite permissions for accessing the user
management endpoints.

```http request
Status: 403 Forbidden
```
