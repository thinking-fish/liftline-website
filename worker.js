// LiftLine marketing site Worker.
//
// Mostly defers to the ASSETS binding (static HTML in ./public). The
// one dynamic route is POST /contact — accepts a JSON body and posts
// it through to Claudia's Telegram bot so Andrew sees enquiries on
// his phone. Keeps a single endpoint instead of a separate webhook.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // The enquiry endpoint must work on whatever host the page was served
    // from (a 301 would drop the POST body), so handle it before canonicalising.
    if (url.pathname === '/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }

    // Canonicalise to https + apex (non-www) so search engines see one site,
    // not three. http:// and https://www. → 301 https://myliftline.com/…
    if (url.protocol === 'http:' || url.hostname.startsWith('www.')) {
      url.protocol = 'https:';
      url.hostname = 'myliftline.com';
      return Response.redirect(url.toString(), 301);
    }

    // Everything else: static files in ./public, with HSTS so browsers pin
    // https after the first visit.
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    out.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    return out;
  },
};

async function handleContact(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'BAD_JSON' }, 400);
  }
  // The new design form has Name / Email / Phone / Details — `building`
  // is kept for backwards-compat with anyone still posting the old shape.
  const { name, email, phone, building, message } = body ?? {};

  // Light validation — names should be human-typeable, the email should
  // look like an email, the message should be non-empty and short enough
  // to avoid being abused as a spam relay. Phone is optional and only
  // checked for length when supplied.
  if (!isShortString(name, 1, 80) ||
      !isShortString(email, 5, 254) || !email.includes('@') ||
      !isShortString(message, 1, 2000) ||
      (phone && !isShortString(phone, 0, 40))) {
    return json({ ok: false, error: 'BAD_INPUT' }, 400);
  }

  // Plain text — we used to send MarkdownV2 with the user fields escape()d,
  // but the surrounding template literal had unescaped `(` / `)` around the
  // email, which Telegram rejected with HTTP 400 ("Character '(' is reserved
  // and must be escaped"). That dropped every enquiry on the floor silently.
  // Plain text has no parsing surface to trip over.
  const text =
    `📡 LiftLine enquiry\n\n` +
    `From: ${name} <${email}>\n` +
    (phone ? `Phone: ${phone}\n` : '') +
    (building ? `Building: ${building}\n` : '') +
    `\n${message}`;

  // Best-effort forward. If Telegram is unreachable we still tell
  // the user "thanks" — beats a 500 page on a marketing form. But log
  // any non-OK response or thrown error so we can see in the Workers
  // dashboard observability why an enquiry didn't land on the phone
  // (silent failures here had us losing leads).
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try {
      const tg = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text,
          }),
        },
      );
      if (!tg.ok) {
        const body = await tg.text();
        console.error(`Telegram sendMessage failed: HTTP ${tg.status} ${body}`);
      }
    } catch (e) {
      console.error(`Telegram sendMessage threw: ${e.message}`);
    }
  } else {
    console.error('Telegram secrets missing — TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not bound');
  }

  return json({ ok: true });
}

function isShortString(v, min, max) {
  return typeof v === 'string' && v.trim().length >= min && v.length <= max;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
