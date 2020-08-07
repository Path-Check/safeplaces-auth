# Multi-factor Authentication Errors

The MFA token is malformed.

```http request
Status: 400 Bad Request
```

```json
{
  "error": "MFATokenMalformed",
  "message": "MFA token is malformed"
}
```

<br/>

The MFA token is missing from the `Authorization` header.

```http request
Status: 401 Unauthorized
```

```json
{
  "error": "MFATokenMissing",
  "message": "MFA token is missing"
}
```

<br/>

The MFA token is invalid. A new one should be obtained.

```http request
Status: 401 Unauthorized
```

```json
{
  "error": "MFATokenInvalid",
  "message": "MFA token is invalid, try getting a new token"
}
```

<br/>

The MFA token is expired. A new one should be obtained.

```http request
Status: 401 Unauthorized
```

```json
{
  "error": "MFATokenExpired",
  "message": "MFA token is expired, try getting a new token"
}
```
