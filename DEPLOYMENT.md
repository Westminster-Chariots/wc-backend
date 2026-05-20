# Deployment Guide: Vehicle Pricing Feature

## Step 1: Run Database Migration

### Option A: Using Neon Console (Recommended)
1. Go to https://console.neon.tech
2. Select your Westminster Chariots database
3. Click "SQL Editor"
4. Copy and paste the contents of `migrations/001_create_vehicle_pricing.sql`
5. Click "Run" to execute the migration
6. Verify the table was created by running:
   ```sql
   SELECT * FROM vehicle_pricing LIMIT 1;
   ```

### Option B: Using psql Command Line
```bash
# From wc-backend directory
psql $DATABASE_URL -f migrations/001_create_vehicle_pricing.sql
```

### Option C: Using Node.js Script
```bash
# From wc-backend directory
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync('./migrations/001_create_vehicle_pricing.sql', 'utf8');
pool.query(sql).then(() => {
  console.log('Migration completed successfully');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
"
```

---

## Step 2: Deploy Backend to Render

### Verify Changes Before Deployment
```bash
cd wc-backend
git status
# Should show changes in:
# - src/db/schema/pricing.ts
# - src/routes/pricing.ts
```

### Commit and Push Changes
```bash
git add .
git commit -m "feat: add vehicle-specific pricing with database persistence"
git push origin main
```

### Deploy on Render
1. Go to https://dashboard.render.com
2. Find your `wc-backend` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete (usually 2-3 minutes)
5. Check logs for any errors

### Verify Deployment
```bash
# Test the new endpoints
curl https://your-backend-url.onrender.com/api/v1/pricing/vehicles

# Should return empty array [] if no vehicle pricing exists yet
```

---

## Step 3: Verify Frontend Integration

1. Go to https://wc-version2.vercel.app/admin/pricing
2. Click "Configuration" tab
3. Scroll to "Vehicle-Specific Pricing"
4. Change pricing values for any vehicle
5. Click "Save Pricing" button
6. Check browser console for success message
7. Refresh the page - values should persist
8. Test "Clear" button to remove custom pricing
9. Go to "Calculator" tab and verify pricing calculations work

---

## Step 4: Test Complete Flow

### Test Vehicle Pricing Override
1. Admin sets custom pricing for "Mercedes S-Class" (vehicle_id: 1)
   - Base Rate: $50
   - Per Mile: $5.00
   - Per Minute: $2.00
   - Tax: 18%

2. Go to Calculator tab
3. Select "Mercedes S-Class"
4. Enter route: "Dulles Airport" to "White House"
5. Verify calculation uses custom pricing ($50 base + distance/time rates)

### Test Category Default Fallback
1. Select a vehicle without custom pricing
2. Verify it uses category defaults (Sedan or SUV rates)

---

## Rollback Plan (If Issues Occur)

### Rollback Database
```sql
DROP TRIGGER IF EXISTS trigger_vehicle_pricing_updated_at ON vehicle_pricing;
DROP FUNCTION IF EXISTS update_vehicle_pricing_updated_at();
DROP TABLE IF EXISTS vehicle_pricing;
```

### Rollback Backend
```bash
git revert HEAD
git push origin main
# Render will auto-deploy the reverted version
```

---

## Environment Variables Checklist

Ensure these are set in Render:
- ✅ DATABASE_URL (Neon connection string)
- ✅ JWT_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ RESEND_API_KEY
- ✅ STRIPE_SECRET_KEY
- ✅ PUSHER_APP_ID
- ✅ PUSHER_KEY
- ✅ PUSHER_SECRET
- ✅ PUSHER_CLUSTER
- ✅ GOOGLE_MAPS_API_KEY

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution**: Table already exists, skip migration or use `DROP TABLE IF EXISTS vehicle_pricing CASCADE;` first

### Issue: Backend deployment fails
**Solution**: Check Render logs for specific error, verify all dependencies in package.json

### Issue: Frontend shows 404 on pricing endpoints
**Solution**: Verify backend deployment completed, check CORS settings include wc-version2.vercel.app

### Issue: Auto-save not working
**Solution**: Check browser console for errors, verify JWT token is valid, check network tab for 401/403 errors

---

## Success Criteria

✅ Migration runs without errors
✅ Backend deploys successfully on Render
✅ GET /api/v1/pricing/vehicles returns 200
✅ Admin can set vehicle-specific pricing
✅ Pricing auto-saves to database
✅ Values persist after page refresh
✅ Calculator uses vehicle-specific pricing
✅ Clear button removes custom pricing

---

## Next Steps After Deployment

1. Set custom pricing for high-demand vehicles
2. Monitor pricing calculator usage in admin panel
3. Consider adding pricing history/audit log
4. Add bulk pricing update feature
5. Implement seasonal pricing adjustments
