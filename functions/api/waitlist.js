const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

export async function onRequestGet({ env }) {
  if (!env.WAITLIST_DB) return json({ error: 'Waitlist is not configured yet.' }, 503);
  try {
    const result = await env.WAITLIST_DB.prepare('SELECT COUNT(*) AS count FROM waitlist_signups').first();
    return json({ count: Number(result?.count || 0) });
  } catch {
    return json({ error: 'Waitlist is temporarily unavailable.' }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.WAITLIST_DB) return json({ error: 'Waitlist is not configured yet.' }, 503);

  let payload;
  try {
    const body = await request.text();
    if (body.length > 2048) return json({ error: 'Request is too large.' }, 413);
    payload = JSON.parse(body);
  } catch {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  // Quietly accept bot submissions into the UI without storing them.
  if (typeof payload.website === 'string' && payload.website.trim()) return json({ success: true });

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Enter a valid email address.' }, 400);
  }
  if (payload.consent !== true) return json({ error: 'Please agree to the email use statement to join.' }, 400);

  try {
    const result = await env.WAITLIST_DB.prepare(
      'INSERT OR IGNORE INTO waitlist_signups (email, consented_at) VALUES (?, ?)' 
    ).bind(email, new Date().toISOString()).run();
    const alreadyJoined = result.meta?.changes === 0;
    return json({ success: true, alreadyJoined }, alreadyJoined ? 200 : 201);
  } catch {
    return json({ error: 'We could not save your sign-up right now. Please try again.' }, 503);
  }
}

export async function onRequest({ request }) {
  return new Response(null, {
    status: 405,
    headers: { Allow: 'GET, POST', 'Cache-Control': 'no-store' }
  });
}
