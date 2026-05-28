const BACKEND_URL = 'https://wc-backend-ayx0.onrender.com/api/v1';

async function testDocumentsEndpoint() {
  console.log('Testing documents endpoint...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${BACKEND_URL.replace('/api/v1', '')}/health`);
    const healthData = await healthRes.json();
    console.log('✓ Health check passed:', healthData);
    
    // Test 2: Documents endpoint (should return 401 without auth)
    console.log('\n2. Testing documents endpoint (without auth)...');
    const docsRes = await fetch(`${BACKEND_URL}/documents`);
    
    if (docsRes.status === 401) {
      console.log('✓ Documents endpoint exists (requires authentication)');
    } else if (docsRes.status === 404) {
      console.log('✗ Documents endpoint NOT FOUND (404)');
      console.log('  → Backend needs to be redeployed with documents route');
    } else if (docsRes.ok) {
      console.log('✓ Documents endpoint exists');
    } else {
      console.log('✗ Unexpected status:', docsRes.status);
    }
    
    console.log('\n✓ Test completed');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

testDocumentsEndpoint();
