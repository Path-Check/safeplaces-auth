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
in [creating a user](users/create.md#default-response).

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

The provided password is too weak.

```http request
Status: 400 Bad Request
```

```json
{
  "error": "PasswordStrengthError",
  "message": "Password is too weak"
}
```

<br/>

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
