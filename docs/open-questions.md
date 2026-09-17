# Open questions and known gaps

**Kept by:** Tankiso · **Started:** 2026-09-17
Everything the website rebuild is waiting on, or has deliberately left alone.
Add to it; tick things off as they're answered. Nothing here is a blocker on the
work in flight — they're the things I can't decide on my own.

---

## 1. Needs an answer from Donovan

| # | Question | Why it matters | Where it came from |
|---|---|---|---|
| 1 | Does the page really say **"up to five users"**? | `pricing.md` argues per-seat is what industrial buyers resent most, and our Odoo counter-pitch is literally "per-user pricing is the wedge". Publishing a seat cap blunts our own best line | D4 vs `pricing.md` |
| 2 | Is onboarding really **"from R18,000"**? | `pricing.md` says R25–30k, the field quote was R25–50k, and `objections.md` says never discount the onboarding fee. R18,000 appears in no meeting record | D3 vs `pricing.md` |
| 3 | Does **R6,500 have an upper document limit**? | The brief reads open-ended; `pricing.md` caps it at 500/month with R12,000 above. Open-ended means selling 400 documents a month at R6,500 forever | § 5.5 vs `pricing.md` |
| 4 | Which **two GA4 key events**? | Only two are allowed. The brief says form + calculator; Michelle originally said form + worksheet download. Three candidates, two slots | § 4 vs Michelle |
| 5 | **Machine-readable dates** on the page? | D21 says no dates anywhere. That rule is about visible claims ("since June"), but a `dateModified` in the schema is invisible and tells answer engines the page is current. Also needs updating every deploy | Adbot GEO scan vs D21 |
| 6 | **Headline**: keep it, or reorder to lead with the ERP? | Donovan said he still likes the current headline; the brief's P0.3 says make the ERP the hook and demote "snap the paperwork" to the intake section | Donovan vs § 5.3 |

## 2. Needs a fact from someone

| # | What I need | Who | Blocks |
|---|---|---|---|
| 7 | **Is 25 minutes per document real?** | Danika | Every number on the calculator. At 15 minutes the default view tells visitors not to buy |
| 8 | **A phone number for the site** | Donovan / Danika | Click-to-call. We made phone a required field because this buyer answers phones, then gave them no number to ring |
| 9 | **LinkedIn / Google Business Profile URLs** | Donovan | `sameAs` entity signals — answer engines can't confirm who we are. Adbot includes GBP setup free in every tier |
| 10 | **A photo, job title and one line each** | Everyone | The "meet the team" section |
| 11 | **Is 48 hours the right promise?** | Danika | It is now in writing in four places, including the thank-you page. Note 48 hours spans a weekend — a Friday-afternoon lead expects a call by Sunday |

## 3. Waiting on something that does not exist yet

| # | Thing | Blocks | Note |
|---|---|---|---|
| 12 | **HubSpot key** for the Worker | The form creating a real lead | Built and working; falls back to the visitor's email app until the key lands |
| 13 | **The ROI worksheet PDF** | Two buttons | Both held behind a `worksheetReady` flag. We don't promise a document nobody has written |
| 14 | **Privacy page** | The link under the consent tick | Also required before any tracking tag goes live (POPIA) |
| 15 | **Capability ledger update** | Feature copy, and two FAQ entries in the schema | Parked by Tankiso for now — not chasing Francois |

## 4. Content bugs found along the way

| # | Bug | Where | Fix |
|---|---|---|---|
| 16 | **"15-min demo" in six places; the Calendly link is a 30-minute event** | Buttons, FAQ, modal | Copy fix, tied to research task D on booking length. Kept out of the FAQ schema until settled |
| 17 | **FAQ claims Xero, QuickBooks and Sage sync** | FAQ item 3 | The ledger says QuickBooks is customer-sync only and client-blocked; the others don't exist. Kept out of the FAQ schema |
| 18 | **Footer reads © 2026** | Footer | Trivial, but it's the kind of thing a prospect notices |
| 19 | **`'Miranda Sans'` is not a real font** | `styles.css`, modal headings | A typo for `'Mona Sans'`. Those headings silently fall back to the system sans |

## 5. Deliberately parked

| # | Thing | Why |
|---|---|---|
| 20 | **Smooth mouse-wheel scrolling** | Needs a JavaScript library; works against the Lighthouse mobile 90+ target that's in our own acceptance criteria. Revisit after launch with real numbers |
| 21 | **Open Graph image is the 489KB hero photo** | Works, but every WhatsApp preview downloads it. A purpose-made 1200×630 belongs with the image compression work in week 3 |
| 22 | **No nav link to the calculator** | The nav changes when the story is reordered; didn't want to crowd it before that decision |
