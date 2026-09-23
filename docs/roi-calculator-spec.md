# Savings calculator — the sum, the words, and what is still open

**Status:** Built, 2026-09-23, to `HYBRIDA-797`. One calculator, two steps.
**Replaces:** the three-input homepage calculator and the five-input `/intake/`
page, which disagreed with each other on purpose until somebody chose. The
stricter sum won.
**Written by:** Tankiso · **Decisions still needed from:** Donovan (§ 7)
**From:** `website-launch-brief.md` § 5.10 · Pairs with [`lead-form-spec.md`](lead-form-spec.md)

---

## 1. Where it lives

| | |
|---|---|
| **Step 1 — the teaser** | Home page, `#calculator`. Five sliders, one part-hidden headline, one email field, one button |
| **Step 2 — the results** | `/savings/`. The payback headline, four tiles with real charts, the working, three benefit lines, the price strip |
| **The maths** | `savings/sums.js`. Every setting and every formula, in one place |
| **The drawing** | the teaser script inside `index.html`, and `savings/calculator.js` |
| **`/intake/`** | a redirect to `/savings/`. The Document Intake module page is still to build (`HYBRIDA-898`) |

Neither page does arithmetic of its own. The teaser hands its five slider values
to `/savings/` in the address bar, so the results open on the visitor's own
numbers, and a shared link still shows something sensible.

## 2. The five inputs

| Input | Default | Range |
|---|---|---|
| Delivery notes a week | 30 | 5–150 |
| Minutes a document, today | 12 | 3–30 |
| What that person costs a month | R11,000 | R6,000–R25,000 |
| Captured lines needing a fix | 15% | 0–40% |
| Deliveries arriving short or wrong | 20% | 0–40% |

Plus two setup toggles, on the results page only: **keeping their own system**
(+R15,000, ticked by default, because most buyers are) and **data migration**
(+R5,000). The teaser leaves these out and assumes the common case — they are
detail, and detail is what step 2 is for.

**"Minutes a document" needs its label to do real work.** Somebody reading it as
*typing time* will say 12 minutes is ridiculous, and they would be right. What we
mean is the whole loop: taking the delivery, checking it against the order,
chasing what is short, filing the paper, and capturing it.

## 3. The sum, in plain words

1. Documents a month = notes a week × 4.33
2. Hours today = documents × minutes ÷ 60
3. Hours after = documents × **2 minutes** ÷ 60 — somebody still checks and approves
4. What an hour of that person costs = monthly cost ÷ **173** working hours
5. Labour freed = hours saved × cost per hour
6. Net a month = labour freed − our monthly price, **rounded to the nearest R100**
7. Payback month = setup fee ÷ net a month, rounded up

**The price follows the document count**, using the published tiers: R3,500 up to
50 documents a month, R6,500 up to 150, R12,000 above. All ex VAT, stated on screen.

**The 2 minutes and the 173 hours are the honest version.** The old homepage sum
used 160 hours and claimed we remove 80% of the work, which produced a bigger
number for the same business. This one is smaller and defensible.

## 4. The rules that do not move

- **The headline is the payback month, never annual savings.**
- **When net is zero or less, the headline switches to hours won back.** Never a
  negative on the page, and never the word "never".
- **The 2 minutes a document is fixed and labelled**, not a slider.
- **No dashboard claim, no credit-note recovery figure, no accuracy percentage.**
- **Rounding to the nearest R100.** False precision reads as a made-up number.

Two guards beyond that:

- **More than one person's whole month** on paperwork: show the number, but say it
  is past what a calculator can honestly answer.
- **A payback longer than 24 months**: say so rather than let the number stand.

## 5. What it says on the default sliders

Worth knowing before anybody demos it:

| | |
|---|---|
| Documents a month | 130 |
| Hours today / after / saved | 26 / 4 / 22 |
| Cost per hour | R63.58 |
| Labour freed | R1,378 |
| Our price at 130 documents | R6,500 |
| Setup (base + keeping their own system) | R30,000 |
| **Net a month** | **−R5,100** |
| **Headline** | **"Win back 22 hours every month"** |

So the page opens on time, not money. That is the fallback rule working exactly
as specified — but it means the first thing a visitor reads is us not promising a
saving. **This is open question 25 and it is Donovan's call:** either the defaults
are wrong, or the ICP is narrower than the slider ranges suggest.

It is not a bug in the arithmetic. Our own qualification rule says a business
below real receiving volume is better off with a cheap tool and a spreadsheet.
The calculator saying "hours, not rands" to a small shop is that rule applied
honestly, in public. It will disqualify people, and it should.

## 6. The email, and the tracked event

**The email is required to see the full results**, on both ways in: the home
button takes it before navigating, and a direct or shared link to `/savings/`
meets the same gate on the page. The results ship hidden in the markup and are
unlocked by removing a class, so the real numbers are never painted before an
email has been given. The blurred figure in the teaser is a placeholder, not the
real number shrunk down — there is nothing for an inspector to reveal.

**The lead does not reach HubSpot yet.** `leadEndpoint` in `savings/sums.js` is
empty, so it falls back to the visitor's own email app, exactly like the homepage
form. It never silently swallows a lead. `HYBRIDA-907` closes that.

**The tracked event**, one of only two key events in Google Analytics:

- `calculator_completed` fires **once per visit**, only after the visitor has
  changed at least one input. Never on page load — a default nobody touched is
  not a signal.
- `savings_pdf_downloaded` fires when the PDF button is pressed.
- Both are pushed to `dataLayer` and cost nothing while no tag manager is listening.

## 7. Decisions still open

| # | Question | Where it sits |
|---|---|---|
| 23 | **The setup fee: R15,000 base, +R15,000, +R5,000.** A best reading of a brief that contradicts itself — `pricing.md` says R25–30k onboarding and the field quote was R25–50k. The payback month is the setup fee divided by the monthly saving, so nothing on the results page depends on more | Open questions, item 23 |
| 25 | **The defaults open on hours, not money.** See § 5 | Open questions, item 25 |
| 7 | **Is 12 minutes a document real?** Danika hears the real answer on calls and should set it | Open questions, item 7 |
| 3 | **Does R6,500 have a document ceiling?** The R12,000 tier is published on the page, which answers open question 3 by accident | Open questions, item 3 |

## 8. Still to build

- **The designed one-page PDF** (`HYBRIDA-992`). The "Download as PDF" button
  works today, but it hands the page to the browser's own "Save as PDF" against a
  stopgap print stylesheet at the bottom of `savings/savings.css`. That is the
  screen page rearranged, not a page designed for paper.
- **The HubSpot pipe** (`HYBRIDA-907`), as above.
- **Google Tag Manager**, for the events to land anywhere (`HYBRIDA-914`).
