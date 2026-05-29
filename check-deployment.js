const BACKEND_URL = 'https://wc-backend-ayx0.onrender.com';

async function checkDeployment() {
  console.log('Checking Render deployment status...\n');
  
  try {
    // Check version
    console.log('1. Checking deployed version...');
    const versionRes = await fetch(`${BACKEND_URL}/version`);
    if (versionRes.ok) {
      const version = await versionRes.json();
      console.log('   Deployed commit:', version.commit);
      console.log('   Deployed branch:', version.branch);
      console.log('   Deploy timestamp:', version.timestamp);
      console.log('   Documents route file exists:', version.documentsRouteExists);
    } else {
      console.log('   Version endpoint not available yet');
    }
    
    console.log('\n2. Checking documents endpoint...');
    const docsRes = await fetch(`${BACKEND_URL}/api/v1/documents`);
    
    if (docsRes.status === 401) {
      console.log('   ✓ Documents endpoint EXISTS (401 - auth required)');
      console.log('\n✓ SUCCESS! Documents API is now live!\n');
    } else if (docsRes.status === 404) {
      console.log('   ✗ Documents endpoint NOT FOUND (404)');
      console.log('\n   Possible issues:');
      console.log('   - Render deployment failed');
      console.log('   - Build error preventing route registration');
      console.log('   - Check Render logs at: https://dashboard.render.com\n');
    } else {
      console.log(`   ? Unexpected status: ${docsRes.status}`);
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

checkDeployment();
