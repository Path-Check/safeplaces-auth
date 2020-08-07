# Log in

Logs in and obtains an access token for a registered user.

```http request
POST /auth/login
```

### Examples

```json
{
  "username": "admin@example.com",
  "password": "xyz2020"
}
```

## Default Response

The access token was sent in the `Set-Cookie` response header. The cookie cannot be accessed by JavaScript.

The user ID was returned in the response body, and it can be used to call other endpoints
to act on the created user.

```http request
Status: 200 OK
```

```json
{
  "id": "a0f853d6-4c28-4384-9853-bec18293bfa9"
}
```

## Error Response

The `username` and `password` combination is wrong.

```http request
Status: 401 Unauthorized
```

```json
{
  "error": "InvalidCredentials",
  "message": "Wrong username or password"
}
```

<br/>

Multi-factor authentication is required.

```http request
Status: 401 Unauthorized
```

```json
{
  "error": "MFARequired",
  "message": "Multifactor authentication required",
  "mfa_token": "Fe26.2*82dcca*be8149..."
}
```

<br/>

The user was found not in the database.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "DBError",
  "message": "Unable to find user in DB"
}
```

<br/>

The access token returned by the identity provider is malformed.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "InternalServerError",
  "message": "Unable to decode access token"
}
```
