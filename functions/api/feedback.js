const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

export async function onRequestPost({ request, env }) {
  if (!env.WAITLIST_DB) return json({ error: 'Feedback is not configured yet.' }, 503);

  let payload;
  try {
    const body = await request.text();
    if (body.length > 4096) return json({ error: 'Feedback is too long.' }, 413);
    payload = JSON.parse(body);
  } catch {
    return json({ error: 'Please enter feedback before sending.' }, 400);
  }

  // Quietly accept bot submissions without storing them.
  if (typeof payload.website === 'string' && payload.website.trim()) return json({ success: true });

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (message.length < 3 || message.length > 2000) {
    return json({ error: 'Please enter feedback (up to 2,000 characters).' }, 400);
  }
  const reaction = ['yes', 'maybe', 'no'].includes(payload.reaction) ? payload.reaction : null;

  try {
    await env.WAITLIST_DB.prepare(
      'INSERT INTO product_feedback (message, reaction) VALUES (?, ?)'
    ).bind(message, reaction).run();
    return json({ success: true }, 201);
  } catch {
    return json({ error: 'We could not save your feedback right now. Please try again.' }, 503);
  }
}

export async function onRequest({ request }) {
  return new Response(null, {
    status: 405,
    headers: { Allow: 'POST', 'Cache-Control': 'no-store' }
  });
}
