// api/_middleware.js

const allowedOrigin = 'https://notdeath.vercel.app';
const rateLimit = new Map();

export default function middleware(req, res, next) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting for specific routes
  const path = req.nextUrl.pathname;
  if (path === '/api/report') {
    const ip = req.ip || req.headers.get('x-forwarded-for');
    const limit = 5; // 5 requests per minute
    const window = 60 * 1000; // 1 minute
    const now = Date.now();
    const requests = rateLimit.get(ip) || [];
    const recentRequests = requests.filter(time => now - time < window);
    
    if (recentRequests.length >= limit) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);
  }

  return next();
}
