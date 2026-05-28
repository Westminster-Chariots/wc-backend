const BACKEND_URL = 'https://wc-backend-ayx0.onrender.com/api/v1';

async function monitorDeployment() {
  console.log('Monitoring Render deployment...\n');
  console.log('Checking every 15 seconds. Press Ctrl+C to stop.\n');
  
  let attempt = 0;
  
  const check = async () => {
    attempt++;
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      const res = await fetch(`${BACKEND_URL}/documents`);
      
      if (res.status === 401) {
        console.log(`\n✓ [${timestamp}] SUCCESS! Documents endpoint is live!`);
        console.log('✓ The /api/v1/documents route is now working.\n');
        process.exit(0);
      } else if (res.status === 404) {
        console.log(`  [${timestamp}] Attempt ${attempt}: Still deploying... (404)`);
      } else {
        console.log(`  [${timestamp}] Attempt ${attempt}: Status ${res.status}`);
      }
    } catch (error) {
      console.log(`  [${timestamp}] Attempt ${attempt}: Connection error`);
    }
  };
  
  // Check immediately
  await check();
  
  // Then check every 15 seconds
  setInterval(check, 15000);
}

monitorDeployment();
