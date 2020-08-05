# Get a user

Gets a user from the identity provider and the backend database.

```http request
POST /auth/users/get
```

| Name | Type   | In   | Description |
| ---- | ------ | ---- | ----------- |
| `id` | string | body |             |

```json
{
  "id": "a0f853d6-4c28-4384-9853-bec18293bfa9"
}
```

### Default Response

The user was successfully retrieved.

```http request
Status 200 OK
```

```json
{
  "email": "admin@example.com",
  "email_verified": true,
  "id": "a0f853d6-4c28-4384-9853-bec18293bfa9",
  "name": "SafePlaces Administrator",
  "role": "admin"
}
```

### Error Response

The user does not exist.

```http request
Status: 404 Not Found
```

```json
{
  "error": "UserNotFound",
  "message": "User not found"
}
```

<br/>

The server could not get the role of the user.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "IDPError",
  "message": "Unable to get role of user: admin@example.com"
}
```
