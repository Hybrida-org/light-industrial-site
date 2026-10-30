// Smallest check that fails if the HubSpot or Zoho mapping, the retry or the either-succeeds send breaks.
// Run: node docs/test-lead.js
const vm = require('vm'), fs = require('fs'), assert = require('assert');
const store = {}, calls = [], zoho = [], dl = [];
let zohoThrows = false, hubspotDown = false;
const window = {
  location: { pathname: '/', search: '?utm_source=google&gclid=G1', host: 'lightindustrial.co.za', href: 'https://lightindustrial.co.za/?utm_source=google' },
  localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } },
  addEventListener() {}, dataLayer: dl,
  fetch: async (url, init) => {
    if (init.mode === 'no-cors') {  // Zoho: opaque response, only a throw is a failure
      zoho.push({ url, params: init.body });
      if (zohoThrows) throw new TypeError('Failed to fetch');
      return { ok: false, status: 0, type: 'opaque' };
    }
    if (hubspotDown) throw new TypeError('Failed to fetch');
    const body = JSON.parse(init.body); calls.push({ url, body });
    const custom = body.fields.some((f) => f.name === 'utm_source');
    return { ok: !custom, status: custom ? 400 : 200 };
  }
};
const document = { referrer: '', cookie: 'hubspotutk=abc', title: 'Home', body: {}, head: { appendChild() {} },
  createElement: () => ({}), addEventListener() {}, querySelectorAll: () => [], getElementById: () => null, documentElement: {} };
window.URLSearchParams = URLSearchParams;
const src = fs.readFileSync(__dirname + '/../tracking.js', 'utf8').replace(/hubspotFormGuid: '[^']*'/, "hubspotFormGuid: 'guid'");
vm.runInNewContext(src, { window, document, URLSearchParams, JSON, Date, console, Promise });
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

  // Zoho: one post per lead, alongside HubSpot.
  assert.equal(zoho.length, 2);
  assert.equal(zoho[0].url, 'https://crm.zoho.com/crm/WebToLeadForm');
  let z = zoho[0].params;
  for (const h of ['xnQsjsdp', 'xmIwtLD', 'actionType', 'returnURL']) assert.ok(z.get(h), h + ' present');
  assert.equal(z.get('aG9uZXlwb3Q'), '', 'Zoho honeypot sent empty');
  assert.deepEqual([z.get('First Name'), z.get('Last Name'), z.get('Company'), z.get('Email'), z.get('Phone')],
    ['Ann Mary', 'Smith', 'X', 'a@b.co', '0215550123']);
  assert.equal(z.get('Lead Source'), 'Website form');
  assert.equal(z.get('LEADCF1'), 'google', 'UTM Source');
  assert.match(z.get('Description'), /Delivery notes a week: 10-30/);
  assert.match(z.get('Description'), /gclid: G1/);
  // Calculator lead: no name, no company.
  z = zoho[1].params;
  assert.equal(z.get('First Name'), null);
  assert.deepEqual([z.get('Last Name'), z.get('Company'), z.get('Lead Source')], ['a', 'Unknown', 'ROI calculator']);
  assert.match(z.get('Description'), /Monthly net: 6500/);
  // Pure mapping: one-word name, utm_campaign in the Description.
  z = T.zohoFields({ name: 'Zoho', email: 'z@e.co', company: 'Co', delivery_notes_per_week: '30-100' }, { utm_source: 's', utm_campaign: 'handover' });
  assert.deepEqual([z.get('First Name'), z.get('Last Name')], [null, 'Zoho']);
  assert.match(z.get('Description'), /Delivery notes a week: 30-100/);
  assert.match(z.get('Description'), /utm_campaign: handover/);

  // Either succeeds: HubSpot down, Zoho up -> resolves; both down -> rejects.
  hubspotDown = true;
  await T.sendLead({ email: 'a@b.co' });
  zohoThrows = true;
  await assert.rejects(T.sendLead({ email: 'a@b.co' }));
  // Zoho down, HubSpot up -> resolves.
  hubspotDown = false;
  await T.sendLead({ email: 'a@b.co' });
  console.log('lead to Zoho and HubSpot: all checks pass');
})().catch((e) => { console.error(e); process.exit(1); });
