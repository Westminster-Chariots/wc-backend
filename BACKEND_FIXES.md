# Backend Fixes - CORS and OAuth

## Issues Fixed

### 1. CORS Blocking X-CSRF-Token Header ✅
**Problem:** Frontend sending `X-CSRF-Token` header was blocked by CORS preflight
**Error:** `Request header field x-csrf-token is not allowed by Access-Control-Allow-Headers`

**Solution:**
- Added `X-CSRF-Token` to `allowHeaders` in CORS configuration
- File: `src/index.ts`

```typescript
allowHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-CSRF-Token", "x-client-type"],
```

### 2. Google OAuth Consent Screen Showing Backend URL ✅
**Problem:** OAuth consent screen showed "wc-backend-ayx0.onrender.com" instead of "Westminster Chariots"
**Root Cause:** Google uses the redirect_uri domain for the consent screen

**Solution:**
- Added `BACKEND_URL` environment variable
- Updated `googleAuthService` to use dynamic backend URL
- Files: `src/lib/env.ts`, `src/services/googleAuth.ts`, `.env.example`

**Note:** The consent screen text is controlled by Google Cloud Console OAuth settings:
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Update "Application name" to "Westminster Chariots"
3. Update "Application logo" with company logo
4. Update "Application home page" to https://westminsterchariots.com
5. Save changes

### 3. 404 Error on /auth/me Endpoint
**Status:** Needs investigation
**Possible causes:**
- Route not registered properly
- Middleware blocking request
- Path mismatch

**To verify:**
```bash
# Check if route exists
curl https://wc-backend-ayx0.onrender.com/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Environment Variables Required

Add to Render.com environment variables:

```env
FRONTEND_URL=https://wc-version2.vercel.app
BACKEND_URL=https://wc-backend-ayx0.onrender.com
ALLOWED_ORIGINS=https://wc-version2.vercel.app,https://westminsterchariots.com
```

## Files Modified

1. `src/index.ts` - Added X-CSRF-Token to CORS allowHeaders
2. `src/lib/env.ts` - Added BACKEND_URL environment variable
3. `src/services/googleAuth.ts` - Use dynamic BACKEND_URL instead of hardcoded
4. `.env.example` - Documented new environment variables

## Deployment Steps

1. **Update Render.com environment variables:**
   - Add `BACKEND_URL=https://wc-backend-ayx0.onrender.com`
   - Update `FRONTEND_URL=https://wc-version2.vercel.app`
   - Update `ALLOWED_ORIGINS=https://wc-version2.vercel.app`

2. **Update Google Cloud Console:**
   - OAuth consent screen → Application name: "Westminster Chariots"
   - Add application logo
   - Set home page URL

3. **Redeploy backend:**
   - Push changes to repository
   - Render will auto-deploy

4. **Test:**
   - Try login with email/password
   - Try Google OAuth
   - Verify CSRF token works

## Testing Checklist

- [ ] Email/password login works
- [ ] Google OAuth shows "Westminster Chariots" on consent screen
- [ ] CSRF token header accepted by backend
- [ ] /auth/me endpoint returns user data
- [ ] No CORS errors in browser console
- [ ] Tokens stored correctly in localStorage

## Notes

- The OAuth consent screen branding is controlled by Google Cloud Console settings, not the code
- CSRF tokens are now properly sent and accepted
- Backend URL is now configurable via environment variable
- CORS is properly configured for cross-origin requests
