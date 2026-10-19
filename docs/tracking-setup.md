# Tracking setup

How measurement works on lightindustrial.co.za, which accounts exist, where each ID goes, and how to check it all fires. Written 2026-10-13. Companion files: `gtm-container.json` (import into Google Tag Manager) and `ads-launch-checklist.md`.

## How it fits together

One script, `tracking.js`, loads first in the `<head>` of every page. It sets Consent Mode v2 defaults (everything denied except security), shows the cookie banner only when `consentBanner` is true (off since 2026-10-14: POPIA does not require one, so consent defaults to granted and the footer link is hidden), stores the choice in localStorage under `li_consent`, loads Google Tag Manager when `gtmId` is set, and pushes the events listed below into `window.dataLayer`.

Everything else runs inside GTM. GA4, Google Ads, Meta, LinkedIn, Clarity and HubSpot are tags in the container. You paste their IDs once, in GTM, as variables. Nothing vendor-specific is hard-coded on the site.

## Accounts to create

| Account | Where | Owner of the login | What you take from it |
|---|---|---|---|
| Google Tag Manager | tagmanager.google.com | Donovan (Hybrida Google Workspace) | Container ID `GTM-XXXXXXX` |
| Google Analytics 4 | analytics.google.com | Donovan | Measurement ID `G-XXXXXXXXXX` |
| Google Ads | ads.google.com | Donovan. Give Adbot manager access, not the password | Conversion ID `AW-XXXXXXXXX` and two conversion labels |
| Meta Business + Pixel | business.facebook.com | Donovan. Add Tankiso as Business admin | Pixel ID (15 to 16 digits) |
| LinkedIn Campaign Manager | linkedin.com/campaignmanager | Donovan, tied to the Light Industrial company page | Partner ID and the Lead conversion ID |
| Microsoft Clarity | clarity.microsoft.com | Donovan | Project ID |
| HubSpot tracking | app-eu1.hubspot.com, portal 148893758 | Already exists | Nothing to paste. Portal ID is in the container |

Use one shared Google account for GTM, GA4 and Ads so access does not depend on one person's mailbox. Store every ID in the password manager with the account.

## Where each ID is pasted

Only one ID goes on the site. The rest go into GTM.

| ID | Where | How |
|---|---|---|
| `gtmId` | `tracking.js`, config block at the top | Paste `GTM-XXXXXXX`. Deploy. Nothing loads until this is set |
| GA4 Measurement ID | GTM variable `GA4 Measurement ID` | Variables > User-Defined > edit the constant |
| Google Ads Conversion ID | GTM variable `Google Ads Conversion ID` | Same |
| Lead conversion label | GTM variable `Lead Label` | Same |
| Demo conversion label | GTM variable `Demo Label` | Same |
| Demo booked conversion label | GTM variable `Demo Booked Label` | Same |
| Meta Pixel ID | GTM variable `Meta Pixel ID` | Same |
| LinkedIn Partner ID | GTM variable `LinkedIn Partner ID` | Same |
| LinkedIn Lead conversion ID | GTM variable `LinkedIn Lead Conversion ID` | Same. This is the numeric ID of the conversion you create in Campaign Manager, not the Partner ID |
| Clarity ID | GTM variable `Clarity ID` | Same |
| HubSpot Portal ID | GTM variable `HubSpot Portal ID` | Already `148893758`. Leave it |

The other fields in the `tracking.js` config block (`ga4Id`, `googleAdsId`, labels, `metaPixelId`, `linkedinPartnerId`, `clarityId`) are a record only. Filling them changes nothing. GTM is the source of truth.

## Placeholders in the container

Every one of these must be replaced before you publish the container.

| Placeholder | Variable |
|---|---|
| `GTM-XXXXXXX` | Container public ID (set by GTM on import, ignore) |
| `G-XXXXXXXXXX` | `GA4 Measurement ID` |
| `AW-XXXXXXXXX` | `Google Ads Conversion ID` |
| `LEAD_LABEL` | `Lead Label` |
| `DEMO_LABEL` | `Demo Label` |
| `DEMO_BOOKED_LABEL` | `Demo Booked Label` |
| `META_PIXEL_ID` | `Meta Pixel ID` |
| `LINKEDIN_PARTNER_ID` | `LinkedIn Partner ID` |
| `LINKEDIN_LEAD_CONVERSION_ID` | `LinkedIn Lead Conversion ID` |
| `CLARITY_ID` | `Clarity ID` |

The Meta, LinkedIn and Clarity tags check their ID before loading. If the value is still an all-caps placeholder the tag does nothing. The Google tags have no such guard. A placeholder GA4 or Ads ID sends requests that Google ignores.

## Import the container

1. Create a GTM account and a Web container for lightindustrial.co.za.
2. Admin > Import Container. Choose `docs/gtm-container.json`.
3. Workspace: New. Import option: Merge, Overwrite conflicting tags. On a fresh container both options give the same result.
4. Confirm. You should see 21 tags, 9 triggers, 19 variables, 7 folders.
5. Open Variables and replace every placeholder above.
6. Admin > Container settings > turn on Enable consent overview. Open the consent overview and confirm every non-Google tag shows a required consent type.
7. Preview (see Verification), then Submit > Publish.

Do not add a Consent Mode default tag, a consent template, or a cookie banner from the GTM gallery. `tracking.js` owns defaults and updates. A second default would race the first.

## Events

All events are pushed by the site. GTM only listens.

| Event | Params | Fired by |
|---|---|---|
| `page_view_li` | `page_path`, `page_type` (home, intake, erp, pricing, about, contact, savings, lander, thank_you, legal) | `tracking.js` on every page load |
| `lead_form_submit` | `form_source` (hero, website, meta, savings-results-page), `page_path`, `delivery_notes_band`, `stock_system` | the thank-you page load after the hero form or the full form (`src`, `band`, `sys` in its query string), and `calculator.js` after the savings gate |
| `demo_click` | `page_path`, `location` (hero, section, nav, footer) | Click on any `[data-open-demo]` link |
| `demo_booked` | `page_path`, `location` (modal, calendly_redirect) | `tracking.js` when the Calendly modal posts `calendly.event_scheduled`, or when Calendly redirects to `/thank-you/?src=demo` after a booking in its own tab |
| `calculator_results_unlocked` | `page_path`, `docs_per_week`, `net_monthly_band` | `calculator.js` when the email gate succeeds |
| `pricing_view` | `page_path` | Pricing page load, and when the pricing section on Home scrolls into view |
| `contact_click` | `method` (email, phone) | Click on a mailto or tel link |
| `scroll_75` | `page_path` | Once per page at 75 percent scroll depth |

No event carries a name, email or phone number. Keep it that way. GA4 rejects personal data and POPIA requires we never send it to a processor without a reason.

What fires in each vendor:

| Event | GA4 | Google Ads | Meta | LinkedIn |
|---|---|---|---|---|
| `lead_form_submit` | event, key event | Lead form submit (primary) | Lead | Lead conversion |
| `demo_click` | event | Demo click (secondary) | | |
| `demo_booked` | event, key event | Demo booked (primary) | Schedule | |
| `calculator_results_unlocked` | event, key event | | | |
| `pricing_view` | event | | ViewContent | |
| `page_view_li`, `contact_click`, `scroll_75` | event | | | |

Clarity and HubSpot load on every page and receive no custom events.

## GA4 key events

Mark exactly two events as key events in GA4. Admin > Events > toggle Mark as key event.

1. `lead_form_submit`
2. `demo_booked`

Why only two. Adbot's advice is a maximum of two, so the reports and Google's bidding focus on what matters. Form submits are the lead. A booked demo is the strongest signal the site produces. Calculator unlocks are the warm step before either and stay an ordinary event (changed 2026-10-14; it was the second key event before bookings were measurable). Demo clicks are a click on a link, not a booking, so they stay an ordinary event in GA4 and a secondary conversion in Ads.

Events take 24 hours to appear in the Events list. Push each one in Preview first, or create them by name under Admin > Events > Create event if you do not want to wait.

## Google Ads conversions

Create three conversion actions in Google Ads. Goals > Conversions > New conversion action > Website > Add a conversion action manually.

| Name | Category | Goal | Value | Count | Window |
|---|---|---|---|---|---|
| Lead form submit | Submit lead form | Primary | None | One | 30 days click |
| Demo booked | Book appointment | Primary | None | One | 30 days click |
| Demo click | Book appointment | Secondary | None | One | 30 days click |

After saving, open each action, choose Use Google Tag Manager, and copy the Conversion ID and Conversion label into the GTM variables.

Direct tag or import from GA4. Use the direct tag, which is what the container does. Importing GA4 key events into Ads is simpler to set up but reports with a delay of several hours, attributes differently, and ties Ads reporting to GA4's data thresholds. The direct tag reports within minutes, works with the Conversion Linker for click IDs, and is what Adbot will audit. Do not do both or every lead counts twice.

Both Ads conversion tags require `ad_storage` consent. With consent denied, Google's consent mode still records a modelled conversion where it can. That is expected.

## Meta Events Manager

1. Business settings > Data sources > Pixels > Add. Name it Light Industrial web. Copy the ID into the GTM variable.
2. Brand safety > Domains > Add lightindustrial.co.za. Verify with the DNS TXT record in Cloudflare. Meta tag verification also works but DNS survives site rebuilds.
3. Events Manager > the pixel > Aggregated event measurement > Configure web events. Add Lead, Schedule, ViewContent for the domain. Lead goes at the top.
4. Events Manager > Test events. Load the site, accept cookies, submit the form on a test page. You should see PageView, then Lead.

Meta events also require `ad_storage`. The base pixel fires once per page and the event tags are set up to fire only after it.

## LinkedIn

1. Campaign Manager > Analyze > Insight Tag > Install my Insight Tag myself. Copy the Partner ID.
2. Analyze > Conversions > Create. Name: Lead form submit. Type: Lead. Method: event-specific. Copy the numeric conversion ID into `LinkedIn Lead Conversion ID`.
3. Accept cookies on the site and submit a test form. The conversion shows as Active within 24 hours.

## Microsoft Clarity

Create a project at clarity.microsoft.com, Settings > Overview > copy the Project ID into `Clarity ID`. Clarity records sessions, so it only loads with `analytics_storage` consent. Turn on Mask all text under Settings > Masking. The lead form fields are then blurred in recordings.

## Attribution on the lead itself

`tracking.js` stores the first visit's `utm_*`, `gclid`, `fbclid`, `msclkid`, `li_fat_id`, landing page and referrer in localStorage `li_attr`, once, and never overwrites it. Every lead form sends that object as `attribution`, with HubSpot's `hubspotutk` cookie and the page URL, and `LI_TRACKING.sendLead()` writes it onto the contact (properties listed under HubSpot form below). The same UTMs are appended to every Calendly link and to the modal URL, so a booking carries the campaign too. This means a lead's source survives ad blockers, blocked cookies and a visitor who reads four pages first.

## Calendly

- Event type: Donovan's 30-minute demo, `calendly.com/donovan-lightindustrial/30min`. On Home it opens in the modal; everywhere else the link opens Calendly in a new tab.
- Integrations > HubSpot: connect it. Each booking creates or updates the contact and logs a meeting, and the `utm_*` on the link land on the contact. Requires a paid Calendly seat.
- Event type > Confirmation page > Redirect to an external site: `https://lightindustrial.co.za/thank-you/?src=demo`, with "Pass event details" on. This is what counts bookings made in Calendly's own tab as `demo_booked`. Also paid.
- Invitee questions: keep name, email, and add "Company" and "Phone" as required. Cheap to ask on a booking, expensive to chase afterwards.
- Verify: book a test slot from the modal (DebugView shows `demo_booked` with `location: modal`), and one from the Pricing page link (`location: calendly_redirect`). Cancel both.

## HubSpot tracking

Nothing to create. The container loads `js-eu1.hs-scripts.com/148893758.js` with `analytics_storage` consent. This ties page visits to the contact once they submit the form. Every lead form posts from the browser to the HubSpot Forms API on the EU host, carrying the `hubspotutk` cookie when it exists. Leads arrive whether cookies are accepted or not, and join their page views when they are.

## HubSpot form

One HubSpot form receives every lead form on the site. It is never embedded. It is the API target.

1. Settings > Properties > Contact properties > Create, in a group called Website lead. Internal names must match exactly:

   | Internal name | Type | Values |
   |---|---|---|
   | `delivery_notes_per_week` | Dropdown | under-10, 10-30, 30-100, over-100, unsure |
   | `stock_system` | Dropdown | spreadsheet, sage, pastel, other-erp, nothing, other |
   | `lead_source_detail` | Single-line text | website, meta, savings-results-page, home-savings-calculator |
   | `lead_form_variant` | Single-line text | contact, worksheet, hero, calculator_lead |
   | `lead_page` | Single-line text | path of the page the form was on |
   | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `landing_page`, `first_referrer` | Single-line text | first touch |
   | `calc_minutes_per_document`, `calc_monthly_staff_cost`, `calc_error_rate_percent`, `calc_short_delivery_percent`, `calc_monthly_supplier_spend`, `calc_documents_per_month`, `calc_hours_saved`, `calc_monthly_net`, `calc_break_even_month` | Number | calculator inputs and result |

2. Marketing > Forms > Create > Embedded form, named Website lead. Add email, first name, last name, company, phone and every property above. Only Email is required. Turn on submission notifications to the sales inbox.
3. Copy the form ID (Share > Embed code, `formId`) into `hubspotFormGuid` in `tracking.js`. Commit and push. Every form on the site switches from the mailto fallback to HubSpot at once.
4. If a property is missing from the form, HubSpot rejects the submission. The site then retries with email, name, company and phone only, so the lead still arrives. A contact with no `lead_form_variant` means a property name is wrong.
5. `node docs/test-lead.js` checks the field mapping and the retry.

Workflows (no code): form submission creates a deal in the sales pipeline, stage New lead, with a Call back task for 08:00 next working day. Calculator leads (`lead_form_variant` is calculator_lead) get a Send worksheet task and no deal. Lifecycle: Lead on submit, MQL at 10-30 notes a week or more, SQL when a meeting is booked.

In HubSpot, Settings > Tracking & analytics > Tracking code > Advanced tracking: set Cookie consent to Do not show, the site banner already handles it. Add lightindustrial.co.za under Settings > Domains & URLs > Tracking domains.

## Consent Mode v2 and POPIA

`tracking.js` sets these defaults before GTM loads, with `wait_for_update` at 500 ms so a stored choice applies before the first hit:

| Signal | Default |
|---|---|
| `ad_storage`, `ad_user_data`, `ad_personalization` | denied |
| `analytics_storage` | denied |
| `functionality_storage`, `security_storage` | granted |

Accept all grants everything. Only necessary keeps the defaults. Cookie settings lets the visitor pick analytics and marketing separately. The choice is stored with a timestamp until the visitor clears site data or changes it from the footer link.

Inside GTM the mapping is:

| Consent type | Tags |
|---|---|
| `ad_storage` | Google Ads conversions, Meta base and events, LinkedIn tag and conversion |
| `analytics_storage` | Clarity, HubSpot tracking code |
| Built-in consent | GA4 Google tag and events, Conversion Linker. Google tags read the consent state themselves and switch to cookieless pings when denied |

When a visitor accepts after the page has loaded, GTM fires the tags that were blocked. No reload is needed. Check this in Preview.

POPIA notes. Analytics and marketing cookies are consent-based, which is why the defaults are denied. GA4 is set to 14 months retention and IP anonymisation is on by default. The privacy page names every processor above. If a vendor is added to GTM, add it to the privacy page in the same change. Keep the banner text and the privacy page in step.

## Verification

Do these in order after publishing.

1. GTM Preview. Workspace > Preview, enter the site URL. Walk through: load Home, open the banner, accept all, click Book a demo, open Pricing, submit the form on a test page. In the Tag Assistant panel each dataLayer event should appear by name, and the tags listed above should show as Fired. Before accepting, every non-Google tag must show as blocked by consent.
2. Tag Assistant Companion (Chrome extension). Shows the GA4 and Ads hits on the live site with no Preview session.
3. GA4 DebugView. Admin > DebugView. With Preview open, events arrive in seconds with their params. Check `lead_form_submit` carries `form_source` and no email.
4. Meta Pixel Helper (Chrome extension). Green tick on the pixel ID, PageView on load, Lead after the form.
5. LinkedIn Insight Tag status. Campaign Manager > Insight Tag shows Active after the first visit.
6. Google Ads conversion status. Goals > Conversions. Status moves from Inactive to Recording conversions after the first test lead, up to 24 hours later. Nothing is spent until this reads Recording.
7. Clarity. Recordings appear in the dashboard within 30 minutes.
8. Consent. Clear site data, load the page, choose Only necessary, repeat the walk. Only GA4 cookieless pings and the Google tag should fire.

Delete the test leads from HubSpot afterwards.

## Cloudflare Pages

- `tracking.js` and `gtm-container.json` are static files. Cloudflare caches them. After changing `gtmId`, purge the cache (Caching > Purge everything) or the old file serves for up to four hours.
- Do not add a Content-Security-Policy header without listing googletagmanager.com, google-analytics.com, googleadservices.com, connect.facebook.net, snap.licdn.com, px.ads.linkedin.com, clarity.ms and js-eu1.hs-scripts.com. The `_headers` file is where that would go. There is no CSP today.
- Cloudflare Web Analytics is a separate beacon. Leave it off, GA4 already counts page views, and one fewer script on the page helps the speed score.
- Bot Fight Mode can block Meta's domain verification crawler. Turn it off for the verification step if the record fails.

## Week-1 metrics

Agree these before launch and read them weekly, same day, same view.

| Metric | Where | Definition |
|---|---|---|
| Clicks | Google Ads > Campaigns | Paid clicks on search ads, per campaign |
| Cost | Google Ads > Campaigns | Spend excluding VAT |
| Form submits | GA4 key event `lead_form_submit`, cross-checked against HubSpot contacts created | Count per source |
| Calculator unlocks | GA4 key event `calculator_results_unlocked` | Count |
| Cost per lead | Cost divided by Ads conversions for Lead form submit | Compare to Adbot's tier cost |
| Click to lead rate | Form submits divided by clicks | Below 2 percent means the landing page or keyword list is wrong, not the budget |
| Meta reach | Meta Ads Manager | Reach and link clicks to /stop-retyping/ |

Hold the first review at the end of week one, the second at the end of month one, the decision at three months.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Nothing fires, no GTM request in the Network tab | `gtmId` empty in `tracking.js`, or cache serving the old file | Set the ID, deploy, purge the Cloudflare cache |
| GTM loads, GA4 shows no hits | `GA4 Measurement ID` still a placeholder | Replace the variable, publish the container |
| Event visible in Preview but the GA4 tag did not fire | Event name typo between the site and the trigger | Names are exact. Compare against the Events table |
| Meta Pixel Helper shows no pixel | Consent not granted, or ID still a placeholder | Accept all in the banner, check the variable |
| Meta Lead fires twice | Both the site and GTM sending it, or two base pixels | Only GTM sends events. Remove any pixel code added elsewhere |
| Ads conversion stays Inactive | No test conversion yet, or label mismatch | Submit a test lead with consent accepted, wait 24 hours, compare label |
| Ads counts double | GA4 import and direct tag both on | Delete the imported GA4 conversion action |
| LinkedIn conversion never active | Conversion ID is the Partner ID by mistake | Use the numeric event-specific ID from the conversion itself |
| Clarity shows no recordings | `analytics_storage` denied, or ID placeholder | Accept cookies, check the variable |
| HubSpot visits not linked to contacts | Domain not in tracking domains, or script blocked | Add the domain in HubSpot settings, check consent |
| Banner shows on every visit | localStorage blocked, or the key `li_consent` cleared by another script | Check in a normal window, not private |
| Tag fires before consent | `consentSettings` missing on the tag | Open the tag > Advanced > Consent settings > Require additional consent |
| GA4 reports personal data warning | A param carries an email | Check `lead-form.js` only pushes the allowed params |
