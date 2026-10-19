# Ads launch checklist

Tick every box before spending. Merges Adbot's advice (2026-09-07) and the website v2 roadmap, Project 3 and Project 5. Owner of the checklist: Donovan. Tankiso pastes IDs and runs verification.

## Site truths

- [ ] Category line reads the same on every page: Document intelligence and operations software for South African manufacturers, workshops and merchants
- [ ] Prices in plain text on Home, Pricing and both module pages: R2,500, R6,500, R9,000, R750 per extra user, excluding VAT
- [ ] No testimonials, client names, counts, accuracy figures or certifications anywhere
- [ ] Every section ends with Book a 30-min demo or See pricing
- [ ] Lead form works end to end and the contact appears in HubSpot with the right properties
- [ ] Thank-you page loads after submit and pushes `page_type: thank_you`

## Legal pages live before any tag fires

- [ ] /privacy/ names every processor: HubSpot, Cloudflare, GA4, Google Ads, GTM, Meta, LinkedIn, Clarity, Calendly
- [ ] /terms/, /accessibility/, /data-handling/ published and linked in the footer
- [ ] `[Hybrida legal entity name and registration number]` and `[Information Officer name]` placeholders replaced
- [ ] Cookie settings link in the footer opens the panel

## Consent banner (off: `consentBanner: false` in tracking.js, skip this section)

- [ ] Banner shows on first visit with Accept all, Only necessary, Cookie settings
- [ ] Only necessary: no Meta, LinkedIn, Clarity or HubSpot request in the Network tab
- [ ] Accept all: the blocked tags fire without a reload
- [ ] Choice persists across pages and reopens from the footer

## IDs pasted

- [ ] GTM container created and `gtm-container.json` imported
- [ ] `gtmId` set in `tracking.js`, deployed, Cloudflare cache purged
- [ ] Every placeholder in `tracking-setup.md` replaced in GTM variables
- [ ] Container published, version named with the date

## Conversions verified

- [ ] GA4: `lead_form_submit` and `demo_booked` marked as key events, no others
- [ ] GA4 DebugView shows all eight events with params and no personal data
- [ ] Google Ads: Lead form submit (primary), Demo booked (primary) and Demo click (secondary) read Recording conversions
- [ ] Calendly: HubSpot integration connected, confirmation redirect to `/thank-you/?src=demo`, a test booking shows `demo_booked` in DebugView and a meeting on the HubSpot contact
- [ ] No GA4 import into Ads, so nothing counts twice
- [ ] Meta: domain verified, Lead, Schedule, ViewContent configured, Pixel Helper green
- [ ] LinkedIn Insight Tag Active, Lead conversion Active
- [ ] Clarity recordings arrive, text masking on
- [ ] Test leads deleted from HubSpot

## Google Ads campaign

- [ ] Claim the new-account spend-match credit before the first campaign
- [ ] Adbot lowest tier, about R3,200 a month, committed for 3 months with a review date
- [ ] One search campaign per module: Document Intake, Core ERP. A third for the supplier paperwork lander if 5.3 ships
- [ ] Region first. Start with one area (Grabouw was named), then the Western Cape, then national only when the budget grows
- [ ] Bidding: Maximise conversions, no target CPA until 30 conversions
- [ ] Search partners and Display Network off
- [ ] Ad schedule: workshop hours, Monday to Friday 07:00 to 17:00
- [ ] Final URLs: Document Intake campaign to /document-intake/, Core ERP campaign to /erp/
- [ ] Sitelinks: Pricing, Savings calculator, Book a demo, Contact
- [ ] Each ad says the price and the region

Keyword list, 20 plain terms a workshop owner types:

1. stock control software
2. stock control software south africa
3. stock system for small business
4. stock management software
5. inventory software south africa
6. workshop management software
7. job card software
8. job card system
9. quoting software for workshops
10. quote and invoice software south africa
11. purchase order software
12. supplier invoice software
13. delivery note software
14. GRV software
15. stock take software
16. stores management system
17. engineering workshop software
18. manufacturing stock software
19. stock software quickbooks
20. stock software sage

Negative keywords, add on day one:

- [ ] free, open source, download, crack, tutorial, course, jobs, salary, vacancy, pdf, template, excel template
- [ ] retail, pos, point of sale, restaurant, pharmacy, salon, clothing
- [ ] sap, oracle, netsuite, dynamics
- [ ] what is, definition, meaning
- [ ] Review the search terms report every Friday and add to this list

## Meta campaign

- [ ] Objective: Awareness, later Traffic. Not Leads
- [ ] Audience: South Africa, start with the same region as Google. Business owners and managers, manufacturing and engineering interests
- [ ] Creative speaks to the pain: retyping supplier invoices, deliveries arriving short, stock counts that are never right
- [ ] Every ad lands on /stop-retyping/
- [ ] Budget: a fifth of the Google budget until the lander converts
- [ ] Pixel events show in Events Manager from the lander

## UTM convention

Every paid link carries UTMs. Lowercase, hyphens, no spaces.

| Param | Values |
|---|---|
| `utm_source` | google, meta, linkedin |
| `utm_medium` | cpc, paid-social |
| `utm_campaign` | intake-search, erp-search, stop-retyping-awareness |
| `utm_content` | the ad or creative name |

- [ ] Google Ads auto-tagging on, UTMs set at campaign level as a tracking template
- [ ] Meta URL parameters set at ad set level
- [ ] HubSpot original source shows the UTMs on a test contact, and the `utm_*` properties written by the site agree with it

## Speed

- [ ] PageSpeed Insights mobile score 90 or above on Home, Document Intake, ERP, Pricing, Stop retyping
- [ ] Images under 200 KB each, total page under 1 MB
- [ ] Stylesheet served from our own domain

## HubSpot lead routing

- [ ] HubSpot form Website lead and the custom properties in `tracking-setup.md` § HubSpot form exist
- [ ] Form ID pasted into `hubspotFormGuid` in `tracking.js`, mailto fallback gone
- [ ] Workflow creates the deal in the right pipeline stage and assigns it to the SDR
- [ ] A test lead from a `?utm_source=test` visit shows `utm_source` on the contact
- [ ] Notification email arrives within a minute
- [ ] `form_source` and `stock_system` land on the contact
- [ ] Reply template ready, pointing to pricing and the calculator

## Review

- [ ] Week-1 review booked: clicks, form submits, cost per lead
- [ ] Month-1 review booked with Adbot
- [ ] Three-month decision date set: continue, change tier, or stop
- [ ] Launch date: ________  Reviewer: ________
