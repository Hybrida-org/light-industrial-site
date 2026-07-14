// Cloudflare Worker — receives the "Send a supplier invoice" form and emails it
// via Resend, with the uploaded invoice attached.
//
// Set these before it will work (see worker/README.md for the how):
//   RESEND_API_KEY  (secret) — from https://resend.com/api-keys
//   TO_EMAIL        (var)    — where invoices go, e.g. danika@lightindustrial.co.za
//   FROM_EMAIL      (var)    — a verified sender on your Resend domain,
//                              e.g. "Light Industrial <invoices@lightindustrial.co.za>"
//   ALLOWED_ORIGIN  (var)    — the site allowed to POST here,
//                              e.g. https://lightindustrial.co.za

const MAX_FILE_BYTES = 15 * 1024 * 1024; // keep in sync with the form's MAX_FILE_BYTES

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ error: 'Invalid form data' }, 400, cors);
    }

    const name = str(form.get('name'));
    const email = str(form.get('email'));
    const company = str(form.get('company'));
    const phone = str(form.get('phone'));
    const message = str(form.get('message'));

    if (!name || !email) return json({ error: 'Name and email are required.' }, 400, cors);

    const attachments = [];
    const file = form.get('invoice');
    if (file && typeof file.arrayBuffer === 'function' && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) return json({ error: 'File is too large (max 15 MB).' }, 413, cors);
      const bytes = new Uint8Array(await file.arrayBuffer());
      attachments.push({ filename: file.name || 'invoice', content: toBase64(bytes) });
    }

    const html =
      '<h2>New supplier invoice / capture request</h2>' +
      row('Name', name) +
      row('Email', email) +
      row('Company', company || '—') +
      row('Phone', phone || '—') +
      '<p><strong>Message:</strong><br>' + (esc(message).replace(/\n/g, '<br>') || '—') + '</p>' +
      '<p><em>Attachment: ' + (attachments.length ? esc(attachments[0].filename) : 'none') + '</em></p>';

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.TO_EMAIL],
        reply_to: email,
        subject: 'Capture my invoice — ' + name,
        html,
        attachments,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      return json({ error: 'Email service error', detail }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

function str(x) {
  return (x == null ? '' : String(x)).trim();
}
function row(label, value) {
  return '<p><strong>' + label + ':</strong> ' + esc(value) + '</p>';
}
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function toBase64(bytes) {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
