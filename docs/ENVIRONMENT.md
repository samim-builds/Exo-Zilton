# Environment setup

Every setting the app reads from the environment, what it does, and how to get a value for it.

## Quick start

```bash
cp .env.example .env     # then fill in the values below
npx prisma migrate deploy
npm run db:seed          # first time only: loads the 6 products
npm run dev
```

Keep all local values in **`.env`**. The Prisma CLI (migrations, seed, studio) only reads `.env`. Next.js reads it too, but lets `.env.local` override it, so if you also keep a `.env.local`, make sure the two don't disagree on `DATABASE_URL`.

| Variable | Required | Used for |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Products, orders, customers |
| `SESSION_SECRET` | **Yes** | Encrypting the admin login cookie |
| `ADMIN_PASSWORD_HASH` / `ADMIN_PASSWORD` | **Yes** (one of them) | Admin login |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | SEO, sitemap, links in emails |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | All WhatsApp buttons |
| `CONTACT_EMAIL` | Yes | Where order alerts and inquiries go |
| `RESEND_API_KEY`, `RESEND_FROM` | Recommended | Sending order and inquiry emails |
| `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID` | Required on Vercel | Admin product image uploads |
| `NEXT_PUBLIC_INSTAGRAM_HANDLE` | Optional | Instagram link and feed |
| `NEXT_PUBLIC_ELFSIGHT_INSTAGRAM_WIDGET_ID` | Optional | Live Instagram feed widget |

> Variables starting with `NEXT_PUBLIC_` are baked into the browser bundle at **build time**. After changing one, restart `npm run dev`, or redeploy on Vercel.

---

## 1. Database — `DATABASE_URL`

1. Sign in at [console.neon.tech](https://console.neon.tech) and open your project (or create one; the free tier is fine to start).
2. Click **Connect** on the project dashboard.
3. Turn **Connection pooling** on. The host should contain `-pooler`. Pooled connections suit Vercel's serverless functions.
4. Copy the connection string into `.env`:
   ```
   DATABASE_URL="postgresql://neondb_owner:...@ep-xxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=verify-full"
   ```
   Change `sslmode=require` to `sslmode=verify-full`. It's equally secure and stops the `pg` SSL warning.
5. Create the tables: `npx prisma migrate deploy`. Check with `npx prisma migrate status`.

**Tip:** Neon's free compute goes to sleep when idle. The first request after a pause can take a few seconds or fail once ("Can't reach database server"). That's normal; just retry.

## 2. Admin login — `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `ADMIN_PASSWORD`

**`SESSION_SECRET`:** a random string of at least 32 characters. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

If you don't set it, the app falls back to a default value that is written in the source code, so anyone could forge an admin login. Always set it in production. Changing it logs out all admin sessions.

**Admin password:** set **one** of these:

- **`ADMIN_PASSWORD_HASH` (recommended):** a bcrypt hash, so the real password never sits in a config file.
  ```bash
  node -e "console.log(require('bcryptjs').hashSync('your-strong-password', 12))"
  ```
  The output looks like `$2b$12$abc...`. **In a `.env` file, put a backslash before every `$`.** Otherwise Next.js treats `$...` as a reference to another variable and silently corrupts the hash:
  ```
  ADMIN_PASSWORD_HASH="\$2b\$12\$abc..."
  ```
  In the Vercel dashboard, paste the hash **as is**, without backslashes.
- **`ADMIN_PASSWORD`:** a plain-text password. Fine for local development. It's ignored when a hash is set.

You log in at `/admin/login`.

## 3. Site settings

- **`NEXT_PUBLIC_SITE_URL`:** your public domain, with no trailing slash (e.g. `https://exozilton.com`). It's used in the sitemap, SEO tags and the admin link in order emails. Locally you can use `http://localhost:3000`.
- **`NEXT_PUBLIC_WHATSAPP_NUMBER`:** your WhatsApp Business number in international format, **digits only**. `+92 300 1234567` becomes `923001234567`. Until you set it, every WhatsApp button points at a placeholder number.
- **`CONTACT_EMAIL`:** the inbox that receives new-order alerts and contact-form inquiries. It's also the reply-to address on customer emails.

## 4. Email — `RESEND_API_KEY`, `RESEND_FROM`

Without these, emails are **not sent**. They're printed to the server log instead, so ordering still works but nobody gets notified.

1. Create a free account at [resend.com](https://resend.com) (3,000 emails/month).
2. **Domains → Add Domain** → enter `exozilton.com` → add the DNS records it shows (SPF, DKIM) at your domain registrar → wait for **Verified**.
3. **API Keys → Create API Key** with *Sending access* → copy it into `RESEND_API_KEY` (it starts with `re_`).
4. Set `RESEND_FROM` to an address on the verified domain, e.g. `Exo Zilton <orders@exozilton.com>`.

Before your domain is verified you can test with `RESEND_FROM="Exo Zilton <onboarding@resend.dev>"`. In that test mode Resend only delivers to your own Resend account email.

Check it: place a test order. You should get the "New order" alert at `CONTACT_EMAIL`, and the customer address gets the confirmation.

## 5. Image uploads — `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`

Used when you upload product photos in the admin panel.

- **Locally (optional):** without it, uploads are saved to `public/uploads/`.
- **On Vercel (required):** Vercel's file system is read-only, so uploads fail without Blob.

Setup: Vercel dashboard → your project → **Storage → Create → Blob** → choose **Public** access (product photos are shown on the public site) → connect it to the project. Vercel adds `BLOB_STORE_ID` (and on older setups `BLOB_READ_WRITE_TOKEN`) automatically.

The SDK accepts either credential:
- **On Vercel:** `BLOB_STORE_ID` plus the `VERCEL_OIDC_TOKEN` that Vercel injects. No secret to manage.
- **Locally:** `BLOB_READ_WRITE_TOKEN`, because your machine has no OIDC token. Copy it from the store's **.env.local** tab into your `.env`.

Having both set is fine.

## 6. Instagram feed (optional)

- **`NEXT_PUBLIC_INSTAGRAM_HANDLE`:** your handle without `@`. It's used for the footer Instagram link, the feed post links, and the brand profile data Google reads.
- **`NEXT_PUBLIC_ELFSIGHT_INSTAGRAM_WIDGET_ID`:** for a live feed, create a free Instagram Feed widget at [elfsight.com](https://elfsight.com), connect your account, and copy the widget ID (the part after `elfsight-app-` in the embed code). Leave it empty to show the built-in image grid.

---

## Deploying to Vercel

Add the same variables under **Project → Settings → Environment Variables** for the *Production* (and *Preview*) environments, then redeploy. Remember:

- Use `NEXT_PUBLIC_SITE_URL` = your real domain in Production.
- Paste `ADMIN_PASSWORD_HASH` **without** the `\` escapes.
- Use a different, strong `SESSION_SECRET` than the one you use locally.
- With the Vercel CLI installed (`npm i -g vercel`), `vercel env pull .env` copies the project's variables into your local file.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `DATABASE_URL environment variable is not set` | No `.env` file, or the dev server was started before you created it. Restart it. |
| `The table "public.Product" does not exist` | Migrations not applied. Run `npx prisma migrate deploy`. |
| Admin login always says "Invalid password" | The `$` in the bcrypt hash wasn't escaped in `.env` (see section 2). |
| Orders work but no emails arrive | `RESEND_API_KEY` is missing, or the domain isn't verified yet. Check the server log. |
| WhatsApp opens the wrong number | `NEXT_PUBLIC_WHATSAPP_NUMBER` isn't set, or the server wasn't restarted or redeployed after setting it. |
