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

## Lead sheet and visit stats
1. New Google Sheet called "EverHaven Leads" in the EverHaven Google account.
2. Extensions > Apps Script. Paste `lead-sheet-apps-script.gs`, save.
3. Project Settings > Script properties: add `SUMMARY_KEY` (the read key the Owner Dashboard sync uses).
4. Run `setup` once and authorize. It builds the Leads, Events and Summary tabs and refreshes Summary every hour.
5. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
6. Copy the Web app URL into `sheetWebhook`.

Visit stats are first-party: no cookies, no IP addresses, no form contents. They log visits, source, device, phone and email taps, tour and referral buttons, booking calendar use, video plays, gallery opens, 3D tour, guide downloads, form starts and leads. Visits from vercel.app preview addresses are left out of the totals. Open the site once with `?notrack=1` on each of your own devices to stop counting your visits.

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

## Images and fonts
Optimized photos live in `assets/img` (WebP in several widths) and fonts in `assets/fonts`. Browsers cache both folders for a year, so when you replace a photo, give the new file a new name and update `index.html`. The original JPEGs stay in `assets` as the source files.
