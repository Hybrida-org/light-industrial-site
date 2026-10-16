// Cloudflare Worker — receives every lead form on lightindustrial.co.za as JSON
// and submits it to a HubSpot form (portal 148893758, EU). HubSpot then owns the
// rest: the contact, the deal, the notification email and the follow-up task
// are workflows in HubSpot, not code here.
//
// Why the Forms API and not the CRM API: it needs no secret, it accepts the
// visitor's hubspotutk cookie so the contact inherits its own page views and
// original source, and it records the POPIA consent text with the submission.
//
// Vars (wrangler.toml): HUBSPOT_PORTAL_ID, HUBSPOT_FORM_GUID, ALLOWED_ORIGIN.
// No secrets. See worker/lead/README.md.

// Field name on the site → contact property in HubSpot. Every property on the
// right must exist in HubSpot and sit on the form, or HubSpot rejects the whole
// submission. The core five are HubSpot defaults; the rest are custom
// (worker/lead/README.md has the list to create).
const FIELD_MAP = {
  email: 'email', company: 'company', phone: 'phone',
  delivery_notes_per_week: 'delivery_notes_per_week',
  stock_system: 'stock_system',
  source: 'lead_source_detail', variant: 'lead_form_variant', page: 'lead_page',
  // calculator
  minutes_per_document: 'calc_minutes_per_document',
  monthly_staff_cost: 'calc_monthly_staff_cost',
  error_rate_percent: 'calc_error_rate_percent',
  short_delivery_percent: 'calc_short_delivery_percent',
  monthly_supplier_spend: 'calc_monthly_supplier_spend',
  documents_per_month: 'calc_documents_per_month',
  hours_saved: 'calc_hours_saved',
  monthly_net: 'calc_monthly_net',
  break_even_month: 'calc_break_even_month',
};
const ATTR_MAP = {
  utm_source: 'utm_source', utm_medium: 'utm_medium', utm_campaign: 'utm_campaign',
  utm_content: 'utm_content', utm_term: 'utm_term', gclid: 'gclid',
  landing_page: 'landing_page', referrer: 'first_referrer',
};
const CORE = ['email', 'firstname', 'lastname', 'company', 'phone'];
const CONSENT_TEXT = 'I’m happy for Light Industrial to contact me about this enquiry.';

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

    let lead;
    try { lead = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, cors); }
    if (!lead || typeof lead !== 'object') return json({ error: 'Invalid JSON' }, 400, cors);

    const email = str(lead.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'A valid email is required.' }, 400, cors);
    // Honeypot: the forms drop these client-side, but a bot posting straight here does not.
    if (str(lead.website)) return json({ ok: true }, 200, cors);

    const fields = [];
    const name = str(lead.name);
    if (name) {
      const parts = name.split(/\s+/);
      fields.push({ name: 'firstname', value: parts.slice(0, -1).join(' ') || parts[0] });
      if (parts.length > 1) fields.push({ name: 'lastname', value: parts[parts.length - 1] });
    }
    for (const [from, to] of Object.entries(FIELD_MAP)) {
      const v = str(lead[from]); if (v) fields.push({ name: to, value: v });
    }
    const attr = lead.attribution && typeof lead.attribution === 'object' ? lead.attribution : {};
    for (const [from, to] of Object.entries(ATTR_MAP)) {
      const v = str(attr[from]); if (v) fields.push({ name: to, value: v });
    }

    const context = {
      hutk: str(attr.hutk) || undefined,
      pageUri: str(attr.page_url) || undefined,
      pageName: str(attr.page_title) || undefined,
      ipAddress: request.headers.get('CF-Connecting-IP') || undefined,
    };
    const body = { fields, context };
    if (lead.consent === true || lead.consent === 'yes') {
      body.legalConsentOptions = { consent: { consentToProcess: true, text: CONSENT_TEXT } };
    }

    const url = `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${env.HUBSPOT_PORTAL_ID}/${env.HUBSPOT_FORM_GUID}`;
    let res = await submit(url, body);
    if (!res.ok) {
      // A custom property missing in HubSpot must never cost us the lead:
      // send the core fields alone, and log what HubSpot disliked.
      console.error('HubSpot rejected full submission', res.status, await res.text());
      body.fields = fields.filter((f) => CORE.includes(f.name));
      res = await submit(url, body);
    }
    if (!res.ok) {
      console.error('HubSpot rejected core submission', res.status, await res.text());
      return json({ error: 'Could not record the lead.' }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

function submit(url, body) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function str(v) {
  if (v === undefined || v === null || v === false) return '';
  return String(v).trim().slice(0, 1000);
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}
