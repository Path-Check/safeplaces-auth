# Reset multi-factor authentication

Resets all of the user's multi-factor authentication enrollments.

```http request
POST /auth/users/reset-mfa
```

| Name | Type   | In   | Description |
| ---- | ------ | ---- | ----------- |
| `id` | string | body |             |

### Examples

```json
{
  "id": "a0f853d6-4c28-4384-9853-bec18293bfa9"
}
```

## Default Response

The user's multi-factor authentication enrollments were deleted. The number of
enrollments that were deleted was returned in the response.

```http request
Status: 200 OK
```

```json
{
  "deleted": 1
}
```

## Error Response

The server was unable to get the multi-factor authentication enrollments of the user
from the identity provider.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "IDPError",
  "message": "Unable to get MFA enrollments of user"
}
```

<br/>

The server was unable to remove the multi-factor authentication enrollments of the user
in the identity provider.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "IDPError",
  "message": "Unable to remove MFA enrollments"
}
```
