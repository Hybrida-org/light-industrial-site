// Smallest check that fails if the HubSpot mapping, the retry or the form switch breaks.
// Run: node docs/test-lead.js
const vm = require('vm'), fs = require('fs'), assert = require('assert');
const store = {}, calls = [], dl = [];
const window = {
  location: { pathname: '/', search: '?utm_source=google&gclid=G1', host: 'lightindustrial.co.za', href: 'https://lightindustrial.co.za/?utm_source=google' },
  localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } },
  addEventListener() {}, dataLayer: dl,
  fetch: async (url, init) => {
    const body = JSON.parse(init.body); calls.push({ url, body });
    const custom = body.fields.some((f) => f.name === 'utm_source');
    return { ok: !custom, status: custom ? 400 : 200 };
  }
};
const document = { referrer: '', cookie: 'hubspotutk=abc', title: 'Home', body: {}, head: { appendChild() {} },
  createElement: () => ({}), addEventListener() {}, querySelectorAll: () => [], getElementById: () => null, documentElement: {} };
window.URLSearchParams = URLSearchParams;
const src = fs.readFileSync(__dirname + '/../tracking.js', 'utf8').replace(/hubspotFormGuid: '[^']*'/, "hubspotFormGuid: 'guid'");
vm.runInNewContext(src, { window, document, URLSearchParams, JSON, Date, console });
const T = window.LI_TRACKING;

(async () => {
  await T.sendLead({ name: 'Ann Mary Smith', email: 'a@b.co', company: 'X', phone: '0215550123', consent: true, delivery_notes_per_week: '10-30' });
  assert.equal(calls.length, 2, 'rejected once, retried with core fields');
  assert.match(calls[0].url, /^https:\/\/api-eu1\.hsforms\.com\/submissions\/v3\/integration\/submit\/148893758\/guid$/);
  const f = Object.fromEntries(calls[0].body.fields.map((x) => [x.name, x.value]));
  assert.deepEqual([f.firstname, f.lastname, f.utm_source, f.gclid, f.delivery_notes_per_week], ['Ann Mary', 'Smith', 'google', 'G1', '10-30']);
  assert.equal(calls[0].body.context.hutk, 'abc');
  assert.equal(calls[0].body.legalConsentOptions.consent.consentToProcess, true);
  assert.deepEqual(calls[1].body.fields.map((x) => x.name).sort(), ['company', 'email', 'firstname', 'lastname', 'phone']);
  calls.length = 0;
  store.li_attr = '{}';
  await T.sendLead({ email: 'a@b.co', variant: 'calculator_lead', monthly_net: 6500 });
  assert.equal(calls.length, 1, 'accepted first time, no retry');
  console.log('lead to HubSpot: all checks pass');
})().catch((e) => { console.error(e); process.exit(1); });
