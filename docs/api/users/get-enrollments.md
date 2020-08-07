# Get a user's multi-factor authentication enrollments

Returns all of a user's multi-factor authentication enrollments, including
both active and inactive ones.

```http request
POST /auth/users/get-enrollments
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

```http request
Status: 200 OK
```

```json
[{}]
```
