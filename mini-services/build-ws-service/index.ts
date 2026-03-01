// Simple HTTP server for build status polling
// This service is no longer needed as we use polling from the frontend

const PORT = 3003;

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'build-ws' }, { headers });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers });
  },
});

console.log(`Build service running on port ${PORT}`);
