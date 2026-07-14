# Invoice form → Resend (Cloudflare Worker)

This tiny Worker receives the website's "Send a supplier invoice" form (fields +
uploaded file) and emails it to Danika via Resend, with the invoice attached.

The Worker exists because a static site (GitHub Pages) can't safely hold the
Resend API key or send email itself. The key lives only in the Worker.

## Prerequisites

- **Resend domain verified.** In Resend, the DNS for `lightindustrial.co.za` must
  show *Verified* before mail will send. (This was in progress.)
- **A Cloudflare account** (free tier is fine).
- **Node.js installed** locally (to run the deploy tool).

## One-time setup

1. Install the Cloudflare CLI and sign in:

   ```
   npm install -g wrangler
   wrangler login
   ```

2. From this `worker/` folder, edit **wrangler.toml** and confirm the three vars:
   - `TO_EMAIL` — where supplier invoices should land.
   - `FROM_EMAIL` — a sender on your verified Resend domain (e.g.
     `Light Industrial <admin@lightindustrial.co.za>`). It must be on the
     verified domain or Resend will reject it.
   - `ALLOWED_ORIGIN` — the exact site origin that may POST, e.g.
     `https://lightindustrial.co.za` (no trailing slash). Use `*` only for testing.

3. Add the Resend API key as a **secret** (never put it in the files):

   ```
   wrangler secret put RESEND_API_KEY
   ```

   Paste the key from https://resend.com/api-keys when prompted.

4. Deploy:

   ```
   wrangler deploy
   ```

   Wrangler prints a URL like
   `https://light-industrial-invoice.<your-subdomain>.workers.dev`.

## Turn it on in the website

Open `index.html`, find `var WORKER_URL = '';` in the contact-form script, and
paste the deployed URL:

```js
var WORKER_URL = 'https://light-industrial-invoice.<your-subdomain>.workers.dev';
```

Commit and push. The form now shows a file-upload field and sends real emails
with the attachment. (While `WORKER_URL` is blank, the form falls back to opening
the visitor's mail app instead.)

## Notes

- Max attachment size is 15 MB, enforced both in the form and the Worker. Resend's
  own limit is ~40 MB per message; keep them in sync if you change it.
- To watch live logs while testing: `wrangler tail`.
- Local dry run (won't actually send unless secrets/vars are set): `wrangler dev`.
