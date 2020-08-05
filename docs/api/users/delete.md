# Delete a user

Deletes a user from the identity provider and the backend database.

```http request
POST /auth/users/delete
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

### Success Response

```http request
Status: 204 No Content
```

The user was successfully deleted.

## Error Response

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

Since deletion is a two-step process of deleting the user from the
identity provider as well as the database, a failure of one step will result
in an error.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "DBError",
  "message": "Unable to delete user from DB"
}
```

```json
{
  "error": "IDPError",
  "message": "Unable to delete user from IDP"
}
```
