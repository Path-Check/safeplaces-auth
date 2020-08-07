# List all users

Lists all users in the identity provider and the backend database.

```http request
POST /auth/users/list
```

## Default Response

```http request
Status: 200 OK
```

An array of retrieved users, where each element of the array has a format
identical to that described in [get users](get.md).

## Error Response

The server could not find the user in the database.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "DBError",
  "message": "Unable to find user in database: admin@example.com"
}
```

<br/>

The server could not get the role of a user.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "IDPError",
  "message": "Unable to get role of user: admin@example.com"
}
```
