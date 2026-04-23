# Google OAuth Setup Guide

## Backend Setup Complete ✅

The backend now supports Google OAuth authentication with the following features:
- 7-day access tokens
- 30-day refresh tokens
- Support for web and mobile platforms
- Automatic user creation on first login
- Profile syncing with Google data

---

## Environment Variables Required

Add these to your `.env` file:

```env
# Google OAuth - Backend Client (Web Application)
GOOGLE_CLIENT_ID=your-backend-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-backend-secret

# Google OAuth - Platform Clients (for token validation)
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com

# Update JWT expiry times
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

---

## Database Migration

Run the migration to add Google OAuth support:

```bash
# Option 1: Using psql
psql $DATABASE_URL -f src/db/migrations/add_google_oauth.sql

# Option 2: Using Drizzle
npm run db:generate
npm run db:push
```

---

## API Endpoints

### 1. Web OAuth Flow

**Initiate OAuth:**
```
GET /api/v1/auth/google
```
Redirects to Google login page.

**OAuth Callback:**
```
GET /api/v1/auth/google/callback?code=xxx&state=xxx
```
Handles Google callback and redirects to frontend with tokens.

### 2. Mobile OAuth Flow

**Authenticate with ID Token:**
```
POST /api/v1/auth/google/mobile
Content-Type: application/json

{
  "idToken": "google-id-token",
  "clientId": "your-client-id.apps.googleusercontent.com"
}
```

**Response:**
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "avatarUrl": "https://...",
    "provider": "google"
  }
}
```

---

## Testing

### Test Web OAuth Flow:
1. Start backend: `npm run dev`
2. Visit: `http://localhost:3001/api/v1/auth/google`
3. Complete Google login
4. Should redirect to frontend with tokens

### Test Mobile OAuth Flow:
```bash
curl -X POST http://localhost:3001/api/v1/auth/google/mobile \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "your-google-id-token",
    "clientId": "your-client-id.apps.googleusercontent.com"
  }'
```

---

## Security Features

✅ CSRF protection with state parameter
✅ Email verification required
✅ Token audience validation
✅ Secure token storage
✅ httpOnly cookies for web
✅ 7-day session with auto-refresh
✅ Refresh token rotation

---

## Next Steps

1. ✅ Backend implementation complete
2. ⏳ Web frontend integration (wc-web)
3. ⏳ Mobile app integration (wc-mobile-client)

---

## Troubleshooting

### "Invalid OAuth state"
- Check that cookies are enabled
- Verify ALLOWED_ORIGINS is set correctly

### "Email not verified with Google"
- User must verify their email with Google first

### "Invalid client ID"
- Ensure all client IDs are added to .env
- Check that the client ID matches the platform

### "Authentication failed"
- Check Google Cloud Console credentials
- Verify redirect URIs are configured correctly
- Check backend logs for detailed error messages

---

## Production Checklist

Before deploying to production:

- [ ] Add production redirect URIs to Google Console
- [ ] Update ALLOWED_ORIGINS with production URLs
- [ ] Set NODE_ENV=production
- [ ] Enable secure cookies (automatic in production)
- [ ] Test OAuth flow on production domain
- [ ] Monitor error logs for failed authentications
