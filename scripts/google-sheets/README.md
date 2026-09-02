# Google Sheets jobs backend

This folder is the lightweight admin backend for getajob. You edit jobs in Google Sheets; the site reads them through a small Apps Script web app.

## 1. Create the sheet

1. Create a new Google Sheet named **getajob jobs**.
2. Add a tab named exactly **`Jobs`**.
3. Import `jobs-template.csv`:
   - **File → Import → Upload** → select `jobs-template.csv`
   - Import location: **Replace current sheet**
   - Separator: **Comma**
4. Keep row 1 as the header row. Do not rename the tab.

### Columns

| Column | Required | Notes |
| --- | --- | --- |
| `id` | Yes | Stable slug, e.g. `krea-founding-engineer` |
| `person_name` | Yes | Name shown on the card |
| `person_headline` | Yes | Short headline under the name |
| `company` | Yes | Company name |
| `role` | Yes | Role title |
| `category` | Yes | Engineering, Product, Design, Growth, Marketing, HR, Operations |
| `location` | Yes | City / remote label |
| `excerpt` | Yes | One-line description |
| `published_at` | Yes | `YYYY-MM-DD` |
| `expires_at` | No | `YYYY-MM-DD`. Leave blank to auto-expire after 10 days |
| `source_url` | Yes | Link to the original post |
| `initials` | Yes | Two-letter avatar text |
| `accent` | Yes | Hex color, e.g. `#d56e53` |
| `active` | No | `TRUE` / `FALSE`. Blank means active |

## 2. Attach Apps Script

1. In the sheet: **Extensions → Apps Script**
2. Replace the default `Code.gs` contents with `Code.gs` from this folder
3. Save the project as **getajob jobs api**

The script must run as the Google account that owns or can edit the sheet.

## 3. Deploy the web app

1. **Deploy → New deployment**
2. Type: **Web app**
3. Description: `getajob jobs api`
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Deploy and copy the web app URL

It should look like:

```text
https://script.google.com/macros/s/AKfycb.../exec
```

Open that URL in a browser once. You should get JSON like:

```json
{
  "jobs": [ ... ],
  "updatedAt": "2026-08-26T..."
}
```

## 4. Wire the site

In the project root, create `.env.local`:

```env
JOBS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT/exec
```

Restart the dev server after changing env vars.

For production on Cloudflare, set the same `JOBS_API_URL` variable in your deployment environment.

If the URL is missing or the fetch fails, the site falls back to the static jobs in `data/jobs.ts`.

## Day-to-day editing

- **Add a role:** append a new row
- **Edit a role:** change cells in place
- **Remove a role:** set `active` to `FALSE`, or delete the row
- **Auto-hide old roles:** leave `expires_at` blank and they drop off 10 days after `published_at`

No code changes or redeploys are needed for content updates. The site revalidates every 5 minutes.
