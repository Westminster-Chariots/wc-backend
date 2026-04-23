# Production Environment Setup for wc-backend on Render

## Required Environment Variables

Set these in your Render dashboard (wc-backend service → Environment):

```env
# Database
DATABASE_URL=postgresql://neondb_owner:npg_3gXOv1MDdeSh@ep-fragrant-glade-a48ua8d5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Auth
JWT_SECRET=954b8fe729df1c383e66c77aa848f01d7431f0837809a468f6e5099ba414e74b
JWT_REFRESH_SECRET=e68ccaeec5889e22512e3415d8bc1bc17a5fda98709549b96db6c667baa3c0d1
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
RESEND_API_KEY=re_bMvdeV5m_5yA4AVKB8Q7c3LSvAiXLY7Uh

# Stripe
STRIPE_SECRET_KEY=sk_test_51T24p8FqKtm3XtLOr16oHyBTD9wyRC4Vegyq5fo824YngPdxRBr5rK7wrcrXTQhapCbEJiMuUqfffQc0BNqtgT4P00ZDljk71b
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Pusher
PUSHER_APP_ID=2139987
PUSHER_KEY=fa1c59baf7529c654592
PUSHER_SECRET=0127935d666c44ffc7ee
PUSHER_CLUSTER=mt1

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyA22awt3-aPimxwxknDi53fXs6lqmJsc7E

# Server
PORT=3001
NODE_ENV=production

# CORS - IMPORTANT: Add your Vercel domain
ALLOWED_ORIGINS=https://wc-version2.vercel.app,http://localhost:3001

# Cloudinary
CLOUDINARY_CLOUD_NAME=dqnulkx1a
CLOUDINARY_API_KEY=822489184162452
CLOUDINARY_API_SECRET=uPsHGfJ4fAmv1oqb5uz_F7I1HBk
```

## Important Notes

1. **NODE_ENV must be "production"** - This ensures cookies use `secure: true`
2. **ALLOWED_ORIGINS** - Must include your Vercel deployment URL
3. After updating environment variables, **redeploy the backend** on Render

## Frontend Configuration (Vercel)

Set these in your Vercel project → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PUSHER_KEY=fa1c59baf7529c654592
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyA22awt3-aPimxwxknDi53fXs6lqmJsc7E
NEXT_PUBLIC_STRIPE_PK=pk_test_your_key_here
NEXT_PUBLIC_SITE_URL=https://wc-version2.vercel.app
```

## Testing Cross-Origin Cookies

After deployment:

1. Open browser DevTools → Application → Cookies
2. Login on your Vercel site
3. Check if `access_token` and `refresh_token` cookies are set
4. Cookies should have:
   - `Secure: true`
   - `HttpOnly: true`
   - `SameSite: None`
   - `Domain: wc-backend-ayx0.onrender.com`

## Troubleshooting

If cookies still don't work:

1. Ensure both domains use HTTPS ✅
2. Check CORS headers in Network tab
3. Verify `Set-Cookie` header is present in login response
4. Check browser console for cookie warnings
5. Try in incognito mode to rule out browser extensions

## Alternative: Use Same Domain

For best cookie support, deploy both frontend and backend under the same domain:

- Frontend: `westminsterchariots.com`
- Backend: `api.westminsterchariots.com`

This eliminates all cross-origin cookie issues.
