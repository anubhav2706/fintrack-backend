# CORS Configuration

This document explains how to configure Cross-Origin Resource Sharing (CORS) in the FinTrack Pro API.

## Environment Variables

### `CORS_ENABLED`
- **Type**: Boolean (`true`/`false`)
- **Default**: `true`
- **Description**: Enables or disables CORS middleware for the entire API

### `ALLOWED_ORIGINS`
- **Type**: Comma-separated string
- **Required**: Yes
- **Description**: List of allowed origins for CORS requests
- **Example**: `http://localhost:3000,https://yourdomain.com`

## Configuration Examples

### Enable CORS (Default)
```env
CORS_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Disable CORS
```env
CORS_ENABLED=false
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Allow All Origins (Development Only)
```env
CORS_ENABLED=true
ALLOWED_ORIGINS=*
```

### Multiple Specific Origins
```env
CORS_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://app.yourdomain.com,https://admin.yourdomain.com
```

## CORS Headers

When CORS is enabled, the following headers are set:

- `Access-Control-Allow-Origin`: Set to the requesting origin or `*`
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers`: `Origin, X-Requested-With, Content-Type, Accept, Authorization`
- `Access-Control-Allow-Credentials`: `true`
- `Access-Control-Max-Age`: `86400` (24 hours)

## Security Considerations

1. **Production**: Never use `*` in production environments
2. **Specific Origins**: Always specify exact origins in production
3. **Disable When Not Needed**: If your API is only used by server-side applications, consider disabling CORS
4. **Environment-Specific**: Use different configurations for development, staging, and production

## Testing

The API includes tests to verify CORS functionality:

```bash
# Run tests to verify CORS headers
npm test
```

## Troubleshooting

### CORS Errors in Browser
If you see CORS errors in the browser console:

1. Check that `CORS_ENABLED=true`
2. Verify the frontend URL is in `ALLOWED_ORIGINS`
3. Ensure the frontend is sending the correct `Origin` header

### No CORS Headers
If CORS headers are not present:

1. Check that `CORS_ENABLED=true`
2. Verify the middleware is being applied correctly
3. Check the server logs for any errors

### Origin Not Allowed
If specific origins are being rejected:

1. Check the exact origin being sent by the browser
2. Ensure it matches exactly with what's in `ALLOWED_ORIGINS`
3. Remember that `http://` and `https://` are considered different origins

## Examples by Use Case

### SPA (Single Page Application)
```env
CORS_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,https://app.yourdomain.com
```

### Mobile App
```env
CORS_ENABLED=true
ALLOWED_ORIGINS=*
```

### Server-to-Server Only
```env
CORS_ENABLED=false
ALLOWED_ORIGINS=http://localhost:3000
```

### Development Environment
```env
CORS_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

### Production Environment
```env
CORS_ENABLED=true
ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
```
