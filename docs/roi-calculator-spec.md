# Savings calculator — the sum, the words, and what is still open

**Status:** Built, 2026-09-23, to `HYBRIDA-797`. One calculator, two steps. Sum and labels reworked 2026-10-13.
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

Neither page does arithmetic of its own. The teaser hands its six slider values
to `/savings/` in the address bar, so the results open on the visitor's own
numbers, and a shared link still shows something sensible.

## 2. The six inputs

Reworked 2026-10-13: the leakage side is now a share of supplier spend, so a
spend input joined the five, the two percentage sliders were relabelled and
their defaults dropped to single digits.

| Input | Default | Range |
|---|---|---|
| Delivery notes a week | 60 | 5–300 |
| Minutes per document today | 3 | 1–15 |
| What that person costs a month | R15,000 | R6,000–R40,000 |
| Supplier price changes / line updates | 5% | 0–20% |
| Delivery shortfalls & billing errors | 3% | 0–20% |
| Monthly supplier spend | R100,000 | R20,000–R1,000,000 |

**The two percentages are a share of spend, not a share of deliveries.** The
tooltips say so. That is what makes "spend × percentage" an honest sum rather
than a wild one.

## 3. The sum, in plain words

1. Documents a month = notes a week × 52 ÷ 12
2. Hours today = documents × minutes ÷ 60
3. Hours after = hours today × **15%** — somebody still glances and approves. `reviewShare` in `sums.js`; set to 0 to claim every minute
4. What an hour of that person costs = monthly cost ÷ **160** working hours
5. Labour freed = hours saved × cost per hour
6. Leakage stopped = monthly spend × (shortfalls % + price changes %)
7. Net a month = labour freed + leakage stopped − R2,500, **rounded to the nearest R100**
8. Pays for itself in N days = R2,500 ÷ (monthly saving ÷ 30), rounded up. Shown in days up to 14, weeks after
9. Return = net ÷ R2,500, as a percentage

There is no set-up fee, so there is no payback month: it pays back inside the
first month or it does not.

## 4. The rules that do not move

- **The headline is the net monthly gain, with "pays for itself in N days" under it.**
- **When net is zero or less, the headline switches to hours won back.** Never a
  negative on the page, and never the word "never". The third takeaway then says
  from how many notes a week it would pay.
- **Three takeaways under the headline, always:** hours recovered, preventable
  leakage, payback.
- **No dashboard claim, no credit-note recovery figure, no accuracy percentage.**
- **Rounding to the nearest R100.** False precision reads as a made-up number.
- **More than one person's whole month** on paperwork: show the number, but say it
  is past what a calculator can honestly answer.

## 5. What it says on the default sliders

| | |
|---|---|
| Documents a month | 260 |
| Hours today / after / saved | 13 / 2 / 11 |
| Cost per hour | R93.75 |
| Labour freed | R1,036 |
| Leakage stopped | R8,000 (R3,000 short, R5,000 moved prices) |
| Saved a month | R9,036 |
| **Net a month** | **R6,500** |
| **Headline** | **"Net monthly gain R6,500 a month. Pays for itself in 9 days."** |
| Return | 260% |

`node savings/sums.check.js` asserts exactly these numbers.

## 6. The email, and the tracked event

**The email is required to see the full results**, on both ways in: the home
button takes it before navigating, and a direct or shared link to `/savings/`
meets the same gate on the page. The results ship hidden in the markup and are
unlocked by removing a class, so the real numbers are never painted before an
email has been given. The blurred figure in the teaser is a placeholder, not the
real number shrunk down — there is nothing for an inspector to reveal.

**Where the lead goes.** `LI_TRACKING.sendLead()` in `tracking.js` posts it to HubSpot.
While `hubspotFormGuid` there is empty, it falls back to the visitor's own email app,
exactly like the homepage form.

**The tracked event**, an ordinary event in Google Analytics since 2026-10-14 (the key events are `lead_form_submit` and `demo_booked`):

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
