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

```http request
Status: 204 No Content
```

The access token was sent in the `Set-Cookie` response header. The cookie cannot be accessed by JavaScript.

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
Status 401 Unauthorized
```

```json
{
  "error": "MFARequired",
  "message": "Multifactor authentication required",
  "mfa_token": "Fe26.2*82dcca*be8149..."
}
```
