# Lead form → HubSpot (Cloudflare Worker)

Every lead form on the site (hero, full form, calculator gate) POSTs one JSON object to
this Worker. The Worker turns it into a HubSpot form submission in portal 148893758 (EU).
Contact, deal, notification and follow-up task are then HubSpot workflows, not code.

Sibling: `../send-invoice.js` is the older supplier-invoice upload Worker. Different job,
different deploy.

## One-time setup

1. **Create the form in HubSpot.** Marketing > Forms > Create > Embedded form. Name it
   `Website lead (Worker)`. It is never embedded; it is the API target. Add every property
   below as a field. Only Email is required. Under Options, turn on
   "Send submission email notifications to" the sales inbox, and set the follow-up to
   nothing (the workflow does it). Copy the form ID from Share > Embed code (`formId`)
   into `HUBSPOT_FORM_GUID` in `wrangler.toml`.
2. **Create the custom contact properties** (Settings > Properties > Create, group
   "Website lead"). Internal names must match exactly:

   | Internal name | Type | Values |
   |---|---|---|
   | `delivery_notes_per_week` | Dropdown | under-10, 10-30, 30-100, over-100, unsure |
   | `stock_system` | Dropdown | spreadsheet, sage, pastel, other-erp, nothing, other |
   | `lead_source_detail` | Single-line text | website, hero, meta, savings-results-page |
   | `lead_form_variant` | Single-line text | contact, worksheet, hero, calculator_lead |
   | `lead_page` | Single-line text | path of the page the form was on |
   | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid` | Single-line text | first-touch, from the site's own storage |
   | `landing_page`, `first_referrer` | Single-line text | first-touch |
   | `calc_minutes_per_document`, `calc_monthly_staff_cost`, `calc_error_rate_percent`, `calc_short_delivery_percent`, `calc_monthly_supplier_spend`, `calc_documents_per_month`, `calc_hours_saved`, `calc_monthly_net`, `calc_break_even_month` | Number | calculator inputs and result |

   A property missing here does not lose the lead: the Worker retries with email, name,
   company and phone only, and logs the rejection (`wrangler tail`).
3. **Deploy.** From this folder: `npm install -g wrangler && wrangler login && wrangler deploy`.
   Wrangler prints `https://light-industrial-lead.<subdomain>.workers.dev`.
4. **Turn it on.** Paste that URL into `leadEndpoint` in `savings/sums.js`. Commit, push.
   Every form on the site switches from the mailto fallback to the Worker at once.
5. **Test.** Submit each form with a test email. The contact appears in HubSpot within
   seconds with original source "Offline sources > Integration" when cookies were
   blocked, or the real source when the HubSpot tracking script was loaded. Delete
   the test contacts.

## HubSpot workflows to build (no code)

- **New website lead**: trigger on form submission → create deal in the sales pipeline,
  stage "New lead", owner the SDR → task "Call back" due next business day 08:00 →
  Slack or email notification.
- **Calculator lead**: same trigger, `lead_form_variant = calculator_lead` → lighter
  touch: task "Send worksheet", no deal until they answer.
- Lifecycle stage: Lead on submission, MQL when `delivery_notes_per_week` is 10-30 or
  above, SQL when a demo is booked (Calendly integration writes the meeting).
