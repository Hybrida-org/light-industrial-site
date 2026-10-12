# Website task list

**Kept by:** Tankiso · **From:** the 23 September review with Donovan
One line per job, in the order I plan to do them. Each one is finished when the
thing described is live on the branch and reviewable on a link.

---

## 1. Doing now — no decision needed from anyone

These are mine. Nobody is blocking them.

- [ ] **Modules section cleanup.** Donovan's bullets instead of paragraphs,
      smaller images, and the dot element above the headings removed.
- [ ] **"What it saves you" rewritten as four wins** — keeps your data clean,
      matches your suppliers' units to yours, gives you back time, AI alerts that
      watch the numbers for you. Framed as how we help, not what it does.
- [ ] **Who it's for.** Add tile shops, mining and engineering.
- [ ] **Calculator section.** Cut the sub-text down to tooltips. One number on
      the home page; "see full results" opens the full breakdown.
- [ ] **Trim About Us.** It is about 690 words and reads like a company history.
      Target: half that. "What we have built" drops from four long blocks to four
      short lines, and the team bios go to one sentence each.
- [ ] **Finish Contact Us.** Opposite problem — it is too thin. Add the address
      (22 on Sloane).
- [ ] **Swap in the words the trade actually uses.** "GRV it" instead of "capture
      the receipt", "stock on hand", "short delivery". Full list in
      `docs/word-list.md`.
- [ ] **Small content bugs.** FAQ claims Xero and Sage sync, which we do not
      have. Footer reads © 2026. A font name is misspelt so some headings fall
      back to the system font.
- [ ] **Privacy and data-handling pages.** Required before any tracking tag can
      go live.
- [ ] **Put Tag Manager and Analytics on the site.** Tag Manager goes on every
      page, Analytics loads through it, and the two key events get wired to the
      lead form and the calculator. Also the Adbot checklist — the things
      Michelle needs in place before she can run ads against this site. Order
      matters: the privacy page has to exist first, because POPIA means we
      cannot track anyone before we have told them we do. The only part waiting
      on Donovan is which two events count (see section 2); I can install and
      test everything else before that answer lands.
- [ ] **Speed pass.** Compress the images, make a proper share image for
      WhatsApp and LinkedIn previews.

## 2. Blocked on a decision from Donovan

I will build these the day there is an answer. Each one is a single question.

- [ ] **Pricing section.** Waiting on the model being settled. What I need: does
      the price climb in steps of 100 documents, or stay as the three bands the
      site already has (R2,500 up to 50, R6,500 up to 150, R12,000 above that)?
      And is the ERP module a flat R6,000 a month, or does it scale too?
- [ ] **The per-user line.** The site says users are never charged for. The real
      limit is five. I will change it to "up to five users" unless told
      otherwise — but it blunts our best line against Odoo, so say the word.
- [ ] **The onboarding fee.** It is now off the page entirely; the page says we
      quote it on a call. If there is a real "from" number, it goes back on.
- [ ] **Which two things Analytics measures.** Only two are allowed. My pick:
      lead form submitted, and calculator completed.

## 3. Blocked on a fact from someone

- [ ] **A phone number for the site.** Donovan or Danika. We made phone a
      required field on the form and then gave visitors no number to ring.
- [ ] **Is 25 minutes per document real?** Danika. Every number on the savings
      calculator rests on it.
<!-- - [ ] **Is 48 hours the right promise?** Danika. It is now in writing in four
      places. Note it spans a weekend. -->
- [ ] **LinkedIn and Google Business Profile links.** Donovan. Without them,
      search engines and AI assistants cannot confirm who we are.
- [ ] **Four photos, a job title and one line each.** The team section is built
      and holding empty frames.
- [ ] **HubSpot key.** Until it lands, the form falls back to opening the
      visitor's email app instead of creating a lead.
- [ ] **Evercool's written yes.** Until then the cold-room story runs unnamed.

<!-- ## 4. Not website work, but owed from the same meeting

- [ ] Finish the research document and drop it in the Hybrida Slack.
- [ ] Rework the first Meta ad hook; post all three for comment.
- [ ] Send the Fireflies transcripts over for the Obsidian hub. -->

---

## Already done

- Five-page structure, shared nav and footer.
- Lead form as a page section on Home and Contact Us, with a thank-you page.
- Savings calculator rebuilt as two steps on its own page, with a PDF button.
- About Us and Contact Us pages built (both still need the trim above).
- ERP module page.
- Setup fee taken off the pricing section; base band moved to R2,500.
- Crawlability and AI-answer-engine groundwork: sitemap, `llms.txt`, FAQ data.
- Document Intake module page, carrying the lead form.
- Hero: the eyebrow pill and the sub-line merged into one line naming the trades.
- Readability pass, all six pages. Every text style now clears WCAG AA (4.5:1
  for small text). The recurring fault was the bronze accent used as a label
  colour on the light panels, where it sat at 2.4:1; those uses moved to a new
  `--bronze-ink`. Also fixed the hero form's see-through fields, a focus ring
  that was invisible on light panels, and list bullets at 2:1. Still open, as
  size rather than colour: 9.5px chips on the savings page and 10px form labels.
