const BACKEND_URL = 'https://wc-backend-ayx0.onrender.com/api/v1';

const routes = [
  '/auth/me',
  '/bookings',
  '/clients',
  '/drivers',
  '/fleet',
  '/pricing',
  '/invoices',
  '/analytics',
  '/documents',
  '/campaigns',
  '/payments',
];

async function testAllRoutes() {
  console.log('Testing all API routes...\n');
  
  for (const route of routes) {
    try {
      const res = await fetch(`${BACKEND_URL}${route}`);
      const status = res.status;
      
      if (status === 404) {
        console.log(`✗ ${route.padEnd(20)} - NOT FOUND (404)`);
      } else if (status === 401) {
        console.log(`✓ ${route.padEnd(20)} - EXISTS (401 - auth required)`);
      } else if (status === 200) {
        console.log(`✓ ${route.padEnd(20)} - EXISTS (200 - OK)`);
      } else {
        console.log(`? ${route.padEnd(20)} - Status ${status}`);
      }
    } catch (error) {
      console.log(`✗ ${route.padEnd(20)} - ERROR: ${error.message}`);
    }
  }
}

testAllRoutes();
