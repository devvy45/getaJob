# GetAJob

Curated roles from founders and hiring teams, paired with shareable proof-of-work profiles.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Run the production check with:

```bash
npm test
```

## Environment variables

Create `.env.local` for local-only credentials:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
GEMINI_API_KEY=your-gemini-api-key
JOBS_API_URL=your-google-apps-script-url
```

- Supabase stores POW profiles, photos, and (privately) résumés and phone numbers.
- `VITE_GOOGLE_CLIENT_ID` turns on Google's own sign-in popup, so Google shows trygetajob.com instead of the Supabase address. The `VITE_` variables are baked in at build time, so set them as **build** variables on Cloudflare too.
- Gemini pre-fills editable profile fields from a PDF résumé.
- Google Apps Script lets the Jobs page read your managed Google Sheet. If this is not set, the site uses the small static fallback in `data/jobs.ts`.

## Managing jobs

See [the Google Sheets setup guide](scripts/google-sheets/README.md). It covers the sheet structure, Apps Script deployment, and the ten-day expiry rule.

## Product routes

- `/` — landing page
- `/jobs` — curated job board
- `/talent` — public, opted-in proof-of-work profiles
- `/show-pow` — create or update a profile
- `/p/[slug]` — shareable candidate profile
