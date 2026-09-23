# Lead form — what it asks, what it does, what it looks like when things go wrong

**Status:** Built. The form is a section on the page, not a pop-up (`HYBRIDA-905`).
**Written by:** Tankiso · **Decisions needed from:** Donovan (§ 6)
**From:** `website-launch-brief.md` § 5.9

The form that turns a website visitor into a lead in HubSpot, with a follow-up task for
Danika, without anyone retyping anything.

---

## 1. Where it appears

One form, built once in `lead-form.js`, shown in two places:

| Where | What it is |
|---|---|
| The last section of the home page | The page's final ask, after the price and the questions |
| The Contact Us page | Under the ways of reaching us directly |

A page marks the spot with `<div data-lead-form></div>` and the script fills it in. Same
fields, same checks, same place it sends — one form to fix when something is wrong.

**It used to be a pop-up.** A form you can already see gets filled in far more often than
one you have to click to open, and every "Get in touch" button on the site now has
somewhere on the page to land.

**A second set of words is wired but unused.** The `worksheet` variant reworded the heading
and the button for the ROI worksheet. Nothing triggers it since 2026-09-23: the savings
calculator (`HYBRIDA-797`) took its own single-field email gate instead.

---

## 2. The fields

Six, plus the consent tick. Every one has to earn its place, because each extra field
costs us conversions.

| # | Label on screen | Required | Type | Why it's here |
|---|---|---|---|---|
| 1 | Your name | Yes | Text | So Danika opens with a name |
| 2 | Company | Yes | Text | So she can look them up before phoning |
| 3 | Work email | Yes | Email | Where we reply |
| 4 | Phone | Yes | Phone number | This buyer answers a phone faster than an email |
| 5 | Supplier delivery notes a week | Yes | Pick one | The qualifying question — see below |
| 6 | What runs your stock today | Yes | Pick one | Tells us what we'd be syncing with, and how big a change this is |
| 7 | Consent tick | Yes | Checkbox | Required by law before we may contact them |

### Field 5 is the important one

A **delivery note** is the paper that arrives with a delivery — the thing that has to be
checked against the order, matched to the supplier's invoice, and typed into the stock
system. How many arrive each week is how much of someone's day is disappearing.

We ask this instead of asking their turnover because revenue is an awkward question early
on and people dodge it. Volume is polite, easy to answer, and tells us roughly the same
thing. Below real receiving volume a cheap tool plus a spreadsheet genuinely does the job
and we are too expensive — so a low number is a kindness to everyone.

It's a pick-one list, not a type-a-number box, for three reasons: it's one tap on a phone
instead of typing, it stops answers like "lots" and "±20" that we can't sort on, and it
lets someone answer honestly when they don't know the exact figure.

The options are set to line up with our price tiers, so the answer tells Danika the likely
price before she picks up the phone:

| Option | Roughly per month | Likely tier |
|---|---|---|
| Fewer than 10 a week | under 45 | Too small — be honest with them |
| 10 to 30 a week | 45 to 130 | R3,500 |
| 30 to 100 a week | 130 to 430 | R6,500 |
| More than 100 a week | over 430 | Talk to us |
| I'm not sure | — | Danika asks on the call |

**"I'm not sure" is deliberate.** Forcing a guess loses the lead, and the answer is
itself a signal — if nobody is counting, nobody is measuring the pain yet.

**It is a proxy, not a quote.** Delivery notes are one document type, but we bill on all
of them — quotes and supplier invoices count too. One purchase order can also throw off
several documents, because 20–30% of deliveries arrive partial, so one order becomes two
or three delivery notes plus an invoice. That is why a company at 50–100 purchase orders a
month lands in the higher tier. Danika should read the answer as *which tier is this
likely to be*, never as a price she can commit to on the call.

### The consent wording

> ☐ I'm happy for Light Industrial to contact me about this enquiry.

Plain, specific, and it does not pretend to be a newsletter sign-up. Underneath, small:

> We'll only use your details to reply to you. [How we handle your data](/privacy)

That link needs the privacy page to exist. It doesn't yet.

---

## 3. What they see when something goes wrong

Errors appear **under the field they belong to**, the moment the person leaves that
field — not all at once after they press the button.

| What happened | What it says |
|---|---|
| Left a required field empty | "We need your name to get back to you." (etc. per field) |
| Email doesn't look like an email | "That email doesn't look right — check for a typo?" |
| Phone is too short | "That number looks too short. Include the area code." |
| Didn't tick consent | "Please tick the box so we're allowed to contact you." |
| Sending failed | "Something went wrong on our side. Email danika@lightindustrial.co.za and we'll pick it up." |

Two rules on errors:

- **Never colour alone.** Red text plus a written message, so it works for someone who
  can't distinguish the colour.
- **Never lose the lead.** If our end breaks, the message shows a real email address they
  can use instead. Right now a failure would be silent, which is how the current form
  already loses people.

---

## 4. What they see when it works

The form is replaced by:

> **Thanks — we've got it.**
> Danika will be in touch within one working day. Your ROI worksheet is on its way to
> [their email address].

Saying *who* and *by when* sets a real expectation. We then have to meet it.

---

## 5. What happens behind the scenes

1. The form sends the answers to the Cloudflare Worker already sitting in `worker/`.
2. The Worker holds the HubSpot password. **The website cannot** — anyone can read a
   website's code, so a key in the page is a key given away.
3. The Worker creates in HubSpot: a contact, a company, source "website", a deal where
   HubSpot allows it, and a follow-up task for Danika at 08:00 the next working day.
4. It emails danika@lightindustrial.co.za, copying admin@lightindustrial.co.za.
5. It emails the visitor the ROI worksheet.

**Blocking bots without blocking people:** one hidden field that a human never sees. Real
people leave it empty; automated spam fills everything in. If it's filled, we bin the
submission quietly. No puzzles, no "pick the traffic lights" — those cost real leads.

---

## 6. Decisions I need before building

| # | Question | My recommendation |
|---|---|---|
| 1 | Should phone be required? | **Yes.** A lead with no phone number is much less use to Danika with this buyer. It costs some conversions and buys better ones |
| 2 | Are the volume bands right? | They're my read of the ICP, not a decision anyone made. Danika should sanity-check them against her calls |
| 3 | Add an optional "anything else?" box? | **Leave it out.** Seven fields is a lot, and Danika gets the context on the phone |
| 4 | Is the consent line good enough for POPIA? | Donovan signs this off — he's already said he'll do it after the fact, so it isn't holding us up |

## 7. Things that must exist before this form can go live

- **A HubSpot key** for the Worker. Without it the form can be built and tested, but can't
  create a real lead.
- **The ROI worksheet itself.** The button promises a PDF that nobody has made yet. We
  should not promise it until it exists.
- **The privacy page**, for the link under the consent tick.

None of these stop me building the form. They stop it going live.
