// Keep email sign-in on the application's origin. Supabase still verifies
// credentials and enforces its authentication policies; no service key is used.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({error: 'Method not allowed'});
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return res.status(503).json({error: 'Customer accounts are not available yet'});
  }
  let payload;
  if (req.method === 'POST') {
    // Do not expose a cross-origin credential endpoint.
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) {
          return res.status(403).json({error: 'Sign in from the Mostaed website'});
        }
      } catch { return res.status(403).json({error: 'Invalid request origin'}); }
    }
    if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      return res.status(415).json({error: 'JSON request required'});
    }
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({error: 'Invalid sign-in request'}); }
    if (typeof body?.email !== 'string' || body.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
        typeof body.password !== 'string' || !body.password || body.password.length > 4096) {
      return res.status(400).json({error: 'Enter your email and password'});
    }
    payload = {email: body.email.trim(), password: body.password};
  }
  try {
    const base = new URL(process.env.SUPABASE_URL);
    if (base.protocol !== 'https:') throw new Error('Invalid account configuration');
    const path = req.method === 'GET' ? '/auth/v1/settings' : '/auth/v1/token?grant_type=password';
    const response = await fetch(new URL(path, base), {
      method: req.method,
      headers: {apikey: process.env.SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json'},
      ...(payload ? {body: JSON.stringify(payload)} : {}),
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    const data = await response.json();
    if (!response.ok) {
      const error = data.msg || data.error_description || data.message || 'Sign-in failed';
      return res.status(response.status).json({error});
    }
    if (req.method === 'GET') return res.status(200).json({external: {google: data.external?.google === true}});
    if (!data.access_token || !data.user?.id) {
      return res.status(502).json({error: 'Account service returned an incomplete session'});
    }
    return res.status(200).json({access_token: data.access_token,
      refresh_token: data.refresh_token, expires_at: data.expires_at, expires_in: data.expires_in,
      user: {id: data.user.id, email: data.user.email, user_metadata: {
        full_name: data.user.user_metadata?.full_name || '', username: data.user.user_metadata?.username || ''}}});
  } catch {
    // Never log credentials, tokens, or upstream response bodies.
    return res.status(503).json({error: 'Account service is temporarily unavailable. Please try again. / خدمة الحساب غير متاحة مؤقتاً، حاول مجدداً'});
  }
}
