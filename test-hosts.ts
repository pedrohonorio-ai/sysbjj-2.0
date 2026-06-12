async function run() {
  const host = 'ais-dev-3yqtpuxc7uqrlkhqyjx4ag-460257395159.us-west2.run.app';
  console.log(`\n🥋 Simulating outside requests to http://localhost:3000/ with Host="${host}"`);
  
  const eps = [
    '/',
    '/api/health',
    '/api/health-db',
    '/api/subscription/current',
    '/api/bi',
    '/api/batch?collections=profile,students',
    '/api/data/profile'
  ];

  for (const ep of eps) {
    try {
      const res = await fetch(`http://localhost:3000${ep}`, {
        headers: {
          'Host': host,
          'Origin': `https://${host}`,
          'X-Forwarded-Host': host,
          // Add a dummy Auth header so we don't just get a simple 401
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMSIsImVtYWlsIjoicGVkcm8uaG9ub3Jpb0BnbS5yaW8iLCJyb2xlIjoiTUFTVEVSIn0.dummy'
        }
      });
      console.log(`\nPath: ${ep}`);
      console.log(`Status: ${res.status}`);
      console.log(`Content-Type: ${res.headers.get('content-type')}`);
      const body = await res.text();
      console.log(`Body (first 200 chars): ${body.substring(0, 200)}`);
    } catch (err) {
      console.error(`Error fetching ${ep}:`, err.message);
    }
  }
}

run();
