const BACKEND_URL = 'https://wc-backend-ayx0.onrender.com/api/v1';

async function waitForDeployment() {
  console.log('Waiting for Render deployment to complete...\n');
  console.log('This usually takes 2-5 minutes.\n');
  
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes with 10s intervals
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts}...`);
    
    try {
      const res = await fetch(`${BACKEND_URL}/documents`);
      
      if (res.status === 401) {
        console.log('\n✓ SUCCESS! Documents endpoint is now live!');
        console.log('✓ Status: 401 (requires authentication) - this is expected');
        console.log('\nYou can now use the documents feature in your app.');
        return;
      } else if (res.status === 404) {
        console.log('  Still deploying... (404)');
      } else {
        console.log(`  Unexpected status: ${res.status}`);
      }
    } catch (error) {
      console.log('  Connection error, retrying...');
    }
    
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
  }
  
  console.log('\n✗ Deployment taking longer than expected.');
  console.log('Check Render dashboard: https://dashboard.render.com');
}

waitForDeployment();
