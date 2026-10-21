# everhavencare.com

One-page lead funnel and showcase for EverHaven Care, a licensed 5-bed assisted living home in Shoreview, MN. Plain HTML, no build step. Code: github.com/everhavencare/everhaven-site. Hosting: Vercel (EverHaven Care account), which deploys every push to `main` automatically.

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
4. Run `setup` once and authorize. It adds the Website Leads, Website Events and Website Summary tabs (other tabs are never touched) and refreshes the summary every hour.
5. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
6. Copy the Web app URL into `sheetWebhook`.

Visit stats are first-party: no cookies, no IP addresses, no form contents. They log visits, source, device, phone and email taps, tour and referral buttons, booking calendar use, video plays, gallery opens, 3D tour, guide downloads, form starts and leads. Visits from vercel.app preview addresses are left out of the totals. Open the site once with `?notrack=1` on each of your own devices to stop counting your visits.

## Forms on the page
- **Check a bed** (hero): who, funding, move-in, phone, email
- **Book a tour**: Google Calendar booking page embedded on the page. Below it, a tour request form (name, phone, email, who, preferred day and time). Request emails include a one-click "Add to Google Calendar" link.
- **Referral intake** (case managers): name, agency, phone, email, funding, care needs, age range, move-in, notes, referral packet request
- **Family funding guide**: name, email. The guide opens on the page after submitting.

No client names, birth dates or diagnoses are collected, by design.

## Domain and DNS
- Registrar: Squarespace Domains (bought through Google Workspace). Open it from admin.google.com > Account > Domains > Manage domains.
- Nameservers: `ns1.vercel-dns.com` and `ns2.vercel-dns.com`, so all DNS records live in Vercel > EverHaven Care > Domains > everhavencare.com.
- `www.everhavencare.com` is the main address; `everhavencare.com` redirects to it.
- Email records kept in Vercel DNS: MX `smtp.google.com` (priority 1), SPF `v=spf1 include:_spf.google.com ~all`, DMARC `v=DMARC1; p=none`, and the Wix email marketing DKIM keys `s1._domainkey` and `s2._domainkey`.
- Old Wix addresses (`/faq`, `/about-us`, `/privacy-policy`, `/accessibility-statement`) redirect to the matching place on the new site.

## Images and fonts
Optimized photos live in `assets/img` (WebP in several widths) and fonts in `assets/fonts`. Browsers cache both folders for a year, so when you replace a photo, give the new file a new name and update `index.html`. The original JPEGs stay in `assets` as the source files.

## Owner Dashboard sync
A scheduled task on the owner's Mac (EverHaven website sync, hourly 8 AM to 8 PM while the Claude app is open) reads the web app with `?key=` (totals) and `?feed=leads&key=` (recent leads without names or contact details) and writes them to the EverHaven Owner Dashboard. The read key lives in Script Properties as `SUMMARY_KEY` and on the Mac in `~/.everhaven/summary-key`; it is never stored in this repo.
