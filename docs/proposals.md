# Proposals behind a password

Client proposals live at `/proposal/<code>/`. The page on the site holds only a password box and
the proposal encrypted with AES-256-GCM (key from PBKDF2-SHA256, 600,000 rounds). Without the
password the proposal can't be read, in the browser, the page source or this repo.

## Publish a new proposal

1. Build the client copy of the deck from the template in the hub
   (`commercial/proposal-deck-template.html`, `showNotes: false`).
2. From this repo, run:

   ```
   node scripts/encrypt-proposal.mjs <path-to-client-copy.html>
   ```

   It makes a random 6-character code and a four-word password (for example `cedar-quartz-river-mint`), writes
   `proposal/<code>/index.html`, checks it decrypts and holds no plain text, and prints the URL
   and password. The password is never saved. Copy it straight into the password manager.
   Optional: `--code <code>`, `--password <password>`, `--force` to overwrite.
3. Commit only `proposal/<code>/index.html` and push to `main`.
4. Send the link and the password separately. Add `?to=<name>` to the link to tell viewers apart.

## Change the password or update the deck

Run the script again with `--code <same code> --force` (and `--password` to keep the old one).
Everyone who was remembered on their device is asked for the new password.

## How it behaves

- The gate shows the logo, one password box and an Open button. No client name, no hint, the
  title is "Light Industrial", and the page is `noindex`. Nothing on the site links to it, and
  robots.txt and the sitemap don't name the path.
- A wrong password shows "That password didn't work."
- The right password opens the deck in place. The decryption key (not the password) is
  remembered on that device, so a return visit skips the gate.
- There is no limit on attempts, because there is no server. The long random password is what
  makes guessing impractical. Don't use a short or memorable one.

## Tracking

The gate loads `tracking.js` and GTM like every page. Events in the dataLayer, each with
`proposal_code` and `proposal_to` (from `?to=`, `direct` if missing):

- `proposal_view`: the page opened
- `proposal_unlock`: the right password, or a remembered device
- `proposal_unlock_failed`: a wrong password
- `proposal_slide`: a slide shown, with `slide_id` and `slide_no`

The unlocked deck's body has `data-clarity-mask="true"`, so session recordings mask its content.
To report on these events, add GA4 event tags for them in GTM.

Files: `scripts/encrypt-proposal.mjs` (the build) and `scripts/proposal-gate.html` (the gate page).
