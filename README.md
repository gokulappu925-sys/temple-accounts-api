# Temple Accounts — Backend Deployment (Render.com)

This backend is what makes your data permanent. It's a small Node.js server
that talks to a real PostgreSQL database — nothing important lives in the
browser anymore.

## Part A — Create the database

1. Go to https://render.com and sign up (free) with your GitHub account.
2. Click **New +** → **PostgreSQL**.
3. Name it `temple-accounts-db`. Choose the **Free** plan. Click **Create Database**.
4. Wait ~1 minute until it says "Available". Open it and copy the **Internal Database URL**
   (you'll paste this into Part B). Keep this tab open.

## Part B — Deploy the backend server

1. Put this `temple_backend` folder into its own GitHub repository (e.g. `temple-accounts-api`).
   Easiest way: on github.com, create a new repository, then use the "upload files" button
   in the browser to drag in everything from this folder.
2. Back on Render: click **New +** → **Web Service**.
3. Connect the GitHub repository you just made.
4. Fill in:
   - **Name**: `temple-accounts-api`
   - **Region**: same region you picked for the database
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | paste the Internal Database URL from Part A |
   | `JWT_SECRET` | any long random string (e.g. mash your keyboard for 40 characters) |
   | `INITIAL_ADMIN_USERNAME` | `admin` (or whatever you want) |
   | `INITIAL_ADMIN_PASSWORD` | a strong password — you'll change it after first login |
   | `ALLOWED_ORIGIN` | `https://gokulappu925-sys.github.io` (your GitHub Pages URL, no trailing slash) |
6. Click **Create Web Service**. Wait for the first deploy to finish (a few minutes).
7. When it's live, Render shows you a URL like `https://temple-accounts-api.onrender.com`.
   Visit `https://temple-accounts-api.onrender.com/api/health` — you should see `{"ok":true,...}`.
   The very first time it starts, it automatically creates the database tables AND your
   first admin login (from the environment variables above) — you don't need to run
   any SQL yourself.

**Free-tier note:** Render's free web service "sleeps" after 15 minutes of no traffic and
takes ~30-60 seconds to wake up on the next request. Your data is never affected by this —
it just means the first request after a quiet period feels slow. If that's a problem later,
Render's cheapest paid tier ($7/mo) removes the sleep.

## Part C — Point your frontend at the backend

1. Open `index.html` in the frontend project (the one on GitHub Pages).
2. Find this line near the top:
   ```html
   window.TEMPLE_API_BASE = 'https://YOUR-BACKEND-URL.onrender.com/api';
   ```
3. Replace it with your real Render URL, e.g.:
   ```html
   window.TEMPLE_API_BASE = 'https://temple-accounts-api.onrender.com/api';
   ```
4. Commit/upload this change to your GitHub Pages repo.
5. Open your site. You should now see a **login screen**. Log in with the
   `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_PASSWORD` you set in Part B.
6. Immediately go to **Settings → Change My Password** and set a real password.

## Part D — Bring your old browser-only data in

If you'd used the earlier version of this app before (the one that only stored
data in the browser), you can bring that data across:

1. Open the *old* version of the app in the same browser it was used in.
2. Go to **Backup & Restore → Download Backup (JSON)** to export what's there.
3. Open the *new* (server-backed) app, log in, go to **Backup & Restore →
   Import Existing Data**, choose that JSON file, and click **Preview & Import**.
4. It shows you exactly how many receipts/payments/members etc. are in the file
   before doing anything. Confirm, and it merges them in — anything with a
   receipt/voucher number that already exists on the server is skipped
   automatically, so importing the same file twice is safe.

## What's included

- Login with roles: **admin** (manage users, restore backups, settings), **treasurer**
  (add receipts/payments/everything day-to-day), **viewer** (read-only).
- Every receipt, payment, transfer, loan and chitty movement is permanently stored in
  PostgreSQL and also posts a balanced double-entry journal pair (Ledger/Trial Balance).
- Audit log of every create/update/void, with who/when/old value/new value.
- Void (not delete) for receipts and payments — the record and its reversing journal
  entries both stay, for a clean audit trail.
- Backup (download anytime), Restore (admin, full replace, with a preview + confirmation
  step), Import Existing Data (admin, merge, duplicate-safe).
- Duplicate receipt/voucher numbers are rejected at the database level, not just in the UI.

## Known simplifications (be aware of these)

- **Offline mode**: this version requires an internet connection to save or load data.
  If a save fails because you're offline, you'll see a clear message and nothing is
  silently lost — but it is **not** saved automatically in the background either; you'll
  need to re-submit it once you're back online. A true offline queue with automatic
  background sync (as the original spec described) is a meaningfully bigger feature —
  happy to build it next if it's a priority, but I didn't want to ship a half-correct
  version that could risk duplicate or mismatched entries.
- **PDF export**: reports currently export to CSV (opens fine in Excel/Sheets) and print
  directly from the browser; a dedicated PDF generator isn't wired in yet.
- **Chitty auction discount/commission math** and **per-project Punarudharanam expense
  tracking** remain the simplified versions from the previous update.

Tell me which of these to tackle next.
