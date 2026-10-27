const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

export async function onRequestPost({ request, env }) {
  if (!env.WAITLIST_DB) return json({ error: 'Reactions are not configured yet.' }, 503);

  let payload;
  try {
    const body = await request.text();
    if (body.length > 1024) return json({ error: 'Request is too large.' }, 413);
    payload = JSON.parse(body);
  } catch {
    return json({ error: 'Please choose a reaction again.' }, 400);
  }

  const reaction = payload.reaction;
  const sessionToken = typeof payload.sessionToken === 'string' ? payload.sessionToken : '';
  if (!['yes', 'maybe', 'no'].includes(reaction)) return json({ error: 'Choose a valid reaction.' }, 400);
  if (!/^[0-9a-f-]{36}$/i.test(sessionToken)) return json({ error: 'Please refresh the page and choose again.' }, 400);

  try {
    await env.WAITLIST_DB.prepare(
      `INSERT INTO concept_test_reactions (session_token, reaction, updated_at)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT(session_token) DO UPDATE SET
         reaction = excluded.reaction,
         updated_at = excluded.updated_at`
    ).bind(sessionToken, reaction).run();
    return json({ success: true });
  } catch {
    return json({ error: 'We could not save your reaction right now. Please try again.' }, 503);
  }
}

export async function onRequest({ request }) {
  return new Response(null, {
    status: 405,
    headers: { Allow: 'POST', 'Cache-Control': 'no-store' }
  });
}
