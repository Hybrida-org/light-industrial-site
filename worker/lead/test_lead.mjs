// Smallest check that fails if the mapping or the retry breaks: node test_lead.mjs
import worker from './lead.js';
import assert from 'node:assert/strict';

const calls = [];
globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body); calls.push({ url, body });
  // first call: reject if a custom field is present; second (core-only) call: accept
  const custom = body.fields.some((f) => f.name.startsWith('calc_') || f.name === 'utm_source');
  return new Response(custom ? 'bad field' : 'ok', { status: custom ? 400 : 200 });
};
const env = { HUBSPOT_PORTAL_ID: '148893758', HUBSPOT_FORM_GUID: 'guid', ALLOWED_ORIGIN: 'https://lightindustrial.co.za' };
const post = (o) => worker.fetch(new Request('https://w/', { method: 'POST', headers: { 'CF-Connecting-IP': '1.2.3.4' }, body: JSON.stringify(o) }), env);

let r = await post({ name: 'Ann Mary Smith', email: 'a@b.co', company: 'X', phone: '0215550123', consent: true,
  delivery_notes_per_week: '10-30', attribution: { utm_source: 'google', hutk: 'abc', page_url: 'https://lightindustrial.co.za/' } });
assert.equal(r.status, 200);
assert.equal(calls.length, 2, 'rejected once, retried with core fields');
assert.match(calls[0].url, /api-eu1\.hsforms\.com.*148893758\/guid$/);
const f = Object.fromEntries(calls[0].body.fields.map((x) => [x.name, x.value]));
assert.deepEqual([f.firstname, f.lastname, f.utm_source, f.delivery_notes_per_week], ['Ann Mary', 'Smith', 'google', '10-30']);
assert.equal(calls[0].body.context.hutk, 'abc');
assert.equal(calls[0].body.legalConsentOptions.consent.consentToProcess, true);
assert.deepEqual(calls[1].body.fields.map((x) => x.name).sort(), ['company', 'email', 'firstname', 'lastname', 'phone']);

calls.length = 0;
r = await post({ email: 'nope' }); assert.equal(r.status, 400); assert.equal(calls.length, 0);
r = await post({ email: 'a@b.co', website: 'spam' }); assert.equal(r.status, 200); assert.equal(calls.length, 0, 'honeypot never reaches HubSpot');
r = await post({ email: 'a@b.co', source: 'savings-results-page', variant: 'calculator_lead' }); assert.equal(r.status, 200);
assert.equal(calls.length, 1, 'no custom-free rejection, single call');
console.log('lead worker: all checks pass');
