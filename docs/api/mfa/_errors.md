# Multi-factor authentication errors

**Status:** `400 Bad Request`

The MFA token is malformed.

```json
{
  "error": "MFATokenMalformed",
  "message": "MFA token is malformed"
}
```

<br/>

**Status:** `401 Unauthorized`

The MFA token is missing from the `Authorization` header.

```json
{
  "error": "MFATokenMissing",
  "message": "MFA token is missing"
}
```

<br/>

**Status:** `401 Unauthorized`

The MFA token is invalid. A new one should be obtained.

```json
{
  "error": "InvalidMFAToken",
  "message": "MFA token is invalid, try getting a new token"
}
```

<br/>

**Status:** `401 Unauthorized`

The MFA token is expired. A new one should be obtained.

```json
{
  "error": "MFATokenExpired",
  "message": "MFA token is expired, try getting a new token"
}
```
