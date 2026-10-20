# everhavencare.com

One-page lead funnel and showcase for EverHaven Care, a licensed 5-bed assisted living home in Shoreview, MN. Plain HTML, no build step. Hosted on Vercel.

## Settings
Everything you need to change lives in the SETTINGS block near the bottom of `index.html`:

| Setting | What it does | Where to get it |
|---|---|---|
| `web3formsKey` | Emails every form submission to info@everhavencare.com | web3forms.com, enter info@everhavencare.com |
| `sheetWebhook` | Logs every submission to the Google lead sheet | Deploy `lead-sheet-apps-script.gs` (below) |
| `bookingUrl` | Tour button opens the Google Calendar booking page | Google Calendar > appointment schedule > Share > Booking page link |
| `bookingEmbedUrl` | Shows the booking calendar right on the page | Google Calendar > appointment schedule > Share > Website embed > Inline, copy the `src` link |

Edit, commit, push. Vercel redeploys in about a minute.

## Lead sheet
1. New Google Sheet called "EverHaven Leads" in the EverHaven Google account.
2. Extensions > Apps Script. Paste `lead-sheet-apps-script.gs`, save.
3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Authorize.
4. Copy the Web app URL into `sheetWebhook`.

## Forms on the page
- **Check a bed** (hero): who, funding, move-in, phone, email
- **Book a tour**: Google Calendar booking page embedded on the page. Below it, a tour request form (name, phone, email, who, preferred day and time). Request emails include a one-click "Add to Google Calendar" link.
- **Referral intake** (case managers): name, agency, phone, email, funding, care needs, age range, move-in, notes, referral packet request
- **Family funding guide**: name, email. The guide opens on the page after submitting.

No client names, birth dates or diagnoses are collected, by design.

## Domain (GoDaddy)
1. Vercel > Project > Settings > Domains: add `everhavencare.com` and `www.everhavencare.com`.
2. GoDaddy > My Products > everhavencare.com > DNS. Remove the Wix records, then add what Vercel shows (usually an `A` record `@` to `76.76.21.21` and a `CNAME` `www` to `cname.vercel-dns.com`).
3. Wait for Vercel to show "Valid Configuration", then cancel Wix.
