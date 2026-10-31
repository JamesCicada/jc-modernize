# JC Modernize

Standalone Vercel project for **jcicada.com** and **www.jcicada.com**. Static front end with a real Node.js email endpoint at `/api/contact`. No PHP, framework dependencies, or build downloads required. Node 22.

## Run locally

```powershell
npm run dev
npm test
npm run build
```

Open http://127.0.0.1:4180. To use real email locally, copy `.env.example` to `.env.local` and set the values. Never commit that file. Without credentials the endpoint returns an honest unavailable response with a direct email alternative. Tests mock Resend; they do not send messages.

## Vercel deployment

Import this folder/repository as a new Vercel project. Framework preset: **Other**. Build: `npm run build`. Output: `public`. Vercel automatically deploys `api/contact.js` as a Node function. `vercel.json` contains the configuration. Use this project root, not the `public` folder, so the API is included.

1. Add these environment variables in Vercel for the applicable environments:
   - `RESEND_API_KEY`: a sending API key from your Resend account. Never expose it as a public variable.
   - `CONTACT_FROM`: `JC Modernize <website@jcicada.com>` after verifying this sender domain in Resend.
   - `CONTACT_TO`: `james@jcicada.com`.
   - `CONTACT_ORIGINS`: `https://jcicada.com,https://www.jcicada.com` (optional extra exact origins, comma separated). Vercel's deployment URL environment variables are also allowed automatically.
2. In Resend, verify `jcicada.com` or a dedicated sending subdomain using its exact DNS records. Do not replace existing mailbox MX records. If using a subdomain, set `CONTACT_FROM` to an address on that verified subdomain.
3. Add **jcicada.com** and **www.jcicada.com** in the Vercel project's Domains settings. Follow Vercel's exact DNS instructions for the account. Set `jcicada.com` as the primary domain and configure `www` to redirect to it. Do not alter unrelated subdomains such as `avtechinnovations.jcicada.com`.
4. Redeploy after setting environment variables. Test a real submission, check the Resend delivery log and James's inbox/spam folder, and confirm replies go to the visitor. A successful HTTP response means Resend accepted the email; inbox arrival is separate and must be checked.
5. Enable a Vercel Firewall rate-limit rule for POST `/api/contact` before public promotion. The endpoint already has origin checks, strict validation, bounded input, a honeypot, and provider idempotency, but these are not a substitute for durable request rate limiting.

The CLI sign-in checked during creation was expired. This repository has not been linked to an existing Vercel project, and no domain/DNS changes have been made.

## Content

The two showcases are independent concepts, not commissioned work or endorsements. Their external previews remain at Omaha HVAC's Vercel preview and AV Tech's existing hosted preview. Showcase imagery comes from those businesses' original websites; copyright remains with the respective owners. Do not label these businesses as top clients without a real relationship. The clients section is ready for future commissioned work.

Founder: James Cicada. Contact: james@jcicada.com. Pay-on-satisfaction language calls for an agreed written scope and price before work. The privacy notice describes the implementation; review operational retention and provider settings before launch.

## Files

`public/index.html`, `style.css`, `script.js`: content, design, interactions. `public/privacy.html`: privacy notice. `api/contact.js`: server validation and email delivery. `test/contact.test.js`: meaningful delivery/error-path tests. `scripts/dev.mjs`: local server using the same contact handler. `.env.example`: required configuration without secrets.
