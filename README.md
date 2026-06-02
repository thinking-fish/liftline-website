# LiftLine — website

Marketing / pitch site for [LiftLine](https://myliftline.com), served
by a Cloudflare Worker (account `5d74c403…`, same pattern as
`aaair.uk`). Worker name: `liftline-website`. Repo:
`thinking-fish/liftline-website`.

## Layout

```
public/         # static assets — served by the ASSETS binding
  index.html
  privacy.html
  404-page.html
  favicon.svg
worker.js       # passes through to ASSETS + handles POST /contact
wrangler.toml
```

## Dynamic routes

| Method | Path       | Behaviour                                                               |
| ------ | ---------- | ----------------------------------------------------------------------- |
| GET    | `/*`       | Static files from `public/`. Missing files fall through to 404-page.   |
| POST   | `/contact` | JSON body `{ name, email, phone?, building?, message }` → Telegram via Claudia. |

## Secrets

Set via Wrangler:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

Vault references — see [`claudia-vault/services/telegram.md`](https://github.com/thinking-fish/claudia-vault).

## Deploy

```bash
wrangler deploy
```

Then in the Cloudflare dashboard, add custom domains for
`myliftline.com` and `www.myliftline.com` pointing at the Worker.
