# Complete user registration

Completes user registration by setting the user's preferred password and
their full name.

```http request
POST /auth/register
```

| Name            | Type   | In     | Description                                                     |
| --------------- | ------ | ------ | --------------------------------------------------------------- |
| `authorization` | string | header | Uses the bearer authentication scheme with a registration token |
| `name`          | string | body   |                                                                 |
| `password`      | string | body   | New password in plaintext                                       |

Note: the registration token is obtained during user creation. See more details
in [creating a user](usersreate.md#success-response).

### Examples

```json
{
  "name": "Administrator",
  "password": "xyz2020"
}
```

## Default Response

```http request
Status: 204 No Content
```

The user was successfully registered.

## Error Response

The registration token is missing or invalid.

```http request
Status: 401 Unauthorized
```

```json
{
  "error": "Unauthorized",
  "message": "Missing registration token"
}
```

```json
{
  "error": "Unauthorized",
  "message": "Invalid registration token"
}
```

<br/>

The server was unable to update user registration due to
an unknown failure in the identity provider.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "IDPError",
  "message": "Unable to update user registration"
}
```
