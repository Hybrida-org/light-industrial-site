# ROI calculator — the sum, the words, and one problem worth deciding first

**Status:** Draft for review, 2026-09-17. Nothing is built yet.
**Written by:** Tankiso · **Decisions needed from:** Donovan (§ 7)
**From:** `website-launch-brief.md` § 5.10 · Pairs with [`lead-form-spec.md`](lead-form-spec.md)

A visitor puts in three numbers and sees what receiving paperwork costs them today,
against what we charge. It is also the second of the only two things we will measure.

---

## 1. Read this part first

I worked the sum through with real numbers before writing anything. **On the honest
version of the maths, the calculator shows a saving only when receiving is eating most
of somebody's month.** Below that it shows a loss.

| Documents/mo | Minutes each | Person costs | Hours/mo | That's this much of a person | Labour freed | Our price | Net |
|---|---|---|---|---|---|---|---|
| 100 | 15 | R10,000 | 25 | 16% | R1,250 | R3,500 | **−R2,250** |
| 150 | 20 | R10,000 | 50 | 31% | R2,500 | R3,500 | **−R1,000** |
| 150 | 30 | R13,000 | 75 | 47% | R4,875 | R3,500 | **+R1,375** |
| 250 | 25 | R11,000 | 104 | 65% | R5,729 | R6,500 | **−R771** |
| 300 | 25 | R12,000 | 125 | 78% | R7,500 | R6,500 | **+R1,000** |
| 400 | 30 | R13,000 | 200 | 125% | R13,000 | R6,500 | **+R6,500** |

Two things follow.

**This is not a bug — it is the ICP, drawn as a graph.** Our own qualification rule says a
business below real receiving volume is better off with a cheap tool and a spreadsheet.
The calculator saying "not yet" to a small shop is that rule, applied honestly, in public.
It will disqualify people, and it should.

**But it disagrees with how we sell.** On calls the anchor is *"it essentially replaces a
clerk"* — a whole R8–13k salary. The three-input sum only reaches that number when one
person is spending 60–80% of their month on paperwork. A prospect who plays with the
calculator and then hears the clerk line will notice the gap. **Both can be true; they
need to be the same story.**

My recommendation: ship the honest sum, make the disqualifying answer a feature, and let
the page say plainly what the calculator counts and what it leaves out.

---

## 2. Where it sits

Its own section with an anchor, `#calculator`, so sales email signatures and HubSpot
templates can link straight to it. After the pricing section — the saving means nothing
until they know the price it is measured against.

---

## 3. The three inputs

| Input | Default | Range | Why that default |
|---|---|---|---|
| Documents a month | 300 | 20–600 | A real in-market buyer, not the smallest one |
| What that person costs a month | R12,000 | R5,000–R40,000 | Middle of the R8–13k receiving-role band, cost to the business, not take-home |
| Minutes per document | 25 | 5–60 | End to end, not just typing — see below |

**"Minutes per document" needs its label to do real work.** Somebody reading it as
*typing time* will say 25 minutes is ridiculous, and they would be right. What we mean is
the whole loop: taking the delivery, checking it against the order, chasing what is
short, filing the paper, and capturing it. The label on the page should say so:

> Minutes per document — checking, chasing and capturing, not just typing

Each input is a slider with the number beside it, and the number can be typed. Sliders
invite people to play, and playing is what fires the tracked event.

---

## 4. The sum, in plain words

1. Hours a month = documents × minutes ÷ 60
2. What an hour of that person costs = monthly cost ÷ 160 working hours
3. Cost of doing it by hand = hours × cost per hour
4. We do not remove all of it — somebody still checks what we flag — so **we count 80%**
5. Saving = that, minus our monthly price
6. Per year = × 12

**The price it compares against follows the document count**, using the published tiers:
R3,500 up to 150 documents a month, R6,500 above. All ex VAT, stated on screen.

Two guards:

- **Over 600 documents a month**, stop calculating and say "talk to us" — that is past
  the published tiers and needs a person.
- **Over 160 hours a month**, the sum is claiming more than one full-time person. Show it,
  but say so: *"that's more than one person's whole month — worth a conversation."*

---

## 5. What the visitor sees

Saving first, price second, per the brief.

> ## You'd save about **R1,000 a month**
> **R12,000 a year**, and about **125 hours** of somebody's time.
> Measured against Document intake at R6,500/month, ex VAT.

Hours are there deliberately. When the rand figure is thin, the hours are still striking,
and hours are the thing the owner actually feels.

**When the number comes out negative**, don't hide it:

> ## Honestly? Not yet.
> At this volume, a cheap capture tool and a spreadsheet will do the job for less than we
> charge. Come back when the paperwork is beating you.
> [Talk to us anyway →]

That answer costs us a lead and buys something worth more. It is also the only version
that survives a prospect checking our maths.

**Rounding:** to the nearest R100. False precision reads as a made-up number.

---

## 6. The tracked event

One of only two key events in Google Analytics, so when it fires matters.

- **Fires once per visit**, when a result has been shown *after* the visitor changed at
  least one input.
- **Never on page load.** A default result nobody touched is not a signal.
- Pushed as `calculator_completed` with the three inputs and the result, guarded so it
  does nothing when the tag manager isn't there yet.

## 7. Decisions I need before building

| # | Question | My recommendation |
|---|---|---|
| 1 | Do we keep the 80% factor? | **Yes.** Dropping it adds about R1,900 a month to the headline and makes the number indefensible the moment somebody asks whether we remove *all* the work |
| 2 | Is 25 minutes per document defensible? | I think so, end to end — but Danika hears the real answer on calls and should set it |
| 3 | 160 working hours a month? | It is the generous choice; 195 is closer to a 45-hour SA week and would shrink every number. I have used 160 and disclosed it |
| 4 | Does the calculator count leakage? | **Not in version one.** Short deliveries paid in full and credit notes never claimed are the bigger money, but we cannot estimate them honestly from three inputs |
| 5 | Does the onboarding fee appear? | **No.** It is the number that stalled two real deals and may have moved to R18,000 without a record. A monthly saving against a monthly price is a clean story |

## 8. Things that must exist before it goes live

- **The ROI worksheet PDF.** The "email me the worksheet" button opens the lead form's
  worksheet version, which is already built and waiting. Until the PDF exists the button
  stays hidden behind a flag — we do not promise a document nobody has written.
- **Google Tag Manager**, for the event to land anywhere. The event fires regardless and
  costs nothing while no one is listening.
