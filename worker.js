// LiftLine marketing site Worker.
//
// Mostly defers to the ASSETS binding (static HTML in ./public). The
// one dynamic route is POST /contact — accepts a JSON body and posts
// it through to Claudia's Telegram bot so Andrew sees enquiries on
// his phone. Keeps a single endpoint instead of a separate webhook.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }

    // Everything else: static files in ./public.
    return env.ASSETS.fetch(request);
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

  const text =
    `📡 *LiftLine enquiry*\n\n` +
    `*From:* ${escape(name)} (${escape(email)})\n` +
    (phone ? `*Phone:* ${escape(phone)}\n` : '') +
    (building ? `*Building:* ${escape(building)}\n` : '') +
    `\n${escape(message)}`;

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
            parse_mode: 'MarkdownV2',
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

// Telegram MarkdownV2 escapes — let user content through without
// breaking the formatting of the surrounding template.
function escape(s) {
  return String(s).replace(/[_*[\]()~`>#+=|{}.!\\-]/g, (c) => `\\${c}`);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
