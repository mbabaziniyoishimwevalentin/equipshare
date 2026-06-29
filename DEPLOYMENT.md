# Deployment Guide

## Architecture

- **Client**: Next.js app → Vercel (static + serverless)
- **Server**: Express API → Render (web service)
- **Database**: PostgreSQL → Supabase (free tier)

---

## 1. GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create equipshare --public --push
```

---

## 2. Supabase PostgreSQL

1. Go to [supabase.com](https://supabase.com) → Create project
2. Copy the **Connection string** (URI) from Database → Connection string → URI
3. Save this as `DATABASE_URL` — it looks like:
   `postgresql://postgres:XXXXXX@db.xxxxxx.supabase.co:5432/postgres`

---

## 3. Deploy Server to Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `equipshare-server`
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
4. Add environment variables (see below)
5. Deploy

### Required Environment Variables (Render)

| Key | Value |
|---|---|
| `PORT` | `5000` |
| `DATABASE_URL` | *(your Supabase connection string)* |
| `JWT_SECRET` | *(generate a random string)* |
| `EMAIL_USER` | *(your Gmail)* |
| `EMAIL_PASS` | *(Gmail app password)* |
| `EMAIL_FROM` | *(sender email)* |
| `CLIENT_URL` | `https://equipshare-client.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `https://equipshare-server.onrender.com` |

After deploy, note the server URL: `https://equipshare-server.onrender.com`

### Run Prisma Migrations

Render's `npx prisma migrate deploy` runs automatically on start. If it fails, run manually via Render Shell:

```bash
cd server && npx prisma migrate deploy
```

Then seed the database:

```bash
cd server && npx prisma db seed
```

---

## 4. Deploy Client to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import your GitHub repo
3. **Root Directory**: `client`
4. **Framework Preset**: Next.js (auto-detected)
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://equipshare-server.onrender.com`
6. Deploy

After deploy, note the client URL: `https://equipshare-client.vercel.app`

---

## 5. Update Server with Client URL

On Render, update the `CLIENT_URL` env var to your Vercel domain and redeploy.

---

## 6. Verify

- Visit the client URL — the app loads
- Register/login works
- Equipment listing loads from the Render API
- Health check: `https://equipshare-server.onrender.com/api/health`

---

## Notes

- **Image uploads** are stored on the server filesystem. Render's ephemeral storage means uploads will be lost on restart. For production, switch to cloud storage (S3, Cloudinary, etc.).
- **Email** uses Gmail SMTP. For high volume, use a dedicated email service (SendGrid, Resend, etc.).
- The Prisma schema is set to PostgreSQL — no migration is needed if using SQLite locally. For new local dev, run `npx prisma migrate dev` in the `server/` directory.
