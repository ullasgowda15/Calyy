# Railway Deployment Guide

## Prerequisites

- Railway account (https://railway.app)
- GitHub account with the Caly repo pushed
- Razorpay test/live keys (https://dashboard.razorpay.com)
- Google OAuth credentials (https://console.cloud.google.com)
- Resend API key (already in `.env`)

---

## Step 1 — Create Railway Project

1. Go to https://railway.app and log in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `ullasgowda15/Calyy` (or your fork)
4. Railway detects `railway.json` → builds using `Backend/Dockerfile`
5. Wait for the build to finish (watch logs in the Deployments tab)

---

## Step 2 — Add PostgreSQL and Redis

1. In the project dashboard, click **"New"** (or **"+"** button)
2. Select **"Plugin"** → **"PostgreSQL"** → **"Add"**
3. Wait for it to show **"Online"**
4. Click **"New"** again → **"Plugin"** → **"Redis"** → **"Add"**
5. Wait for it to show **"Online"**

Railway automatically injects `DATABASE_URL` and `REDIS_URL` into all linked services.

---

## Step 3 — Set Environment Variables

1. Click the web service (the one running Gunicorn)
2. Go to the **Variables** tab
3. Add the following variables:

| Variable | Value |
|---|---|
| `SECRET_KEY` | Generate a strong key: `python -c "import secrets; print('django-insecure-' + secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `.railway.app,localhost` |
| `FRONTEND_URL` | `https://caly.vercel.app` (update after frontend deploy) |
| `BASE_URL` | `https://caly-backend.up.railway.app` (update after deploy) |
| `RESEND_API_KEY` | Get from [Resend dashboard](https://resend.com/api-keys) |
| `C_FORCE_ROOT` | `true` |
| `RAZORPAY_KEY_ID` | Get from [Razorpay dashboard](https://dashboard.razorpay.com) |
| `RAZORPAY_KEY_SECRET` | Get from [Razorpay dashboard](https://dashboard.razorpay.com) |
| `RAZORPAY_WEBHOOK_SECRET` | Get from Razorpay dashboard → Settings → Webhooks |
| `GOOGLE_CLIENT_ID` | Get from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Get from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GOOGLE_REDIRECT_URI` | `https://api.yourcaly.com/api/integrations/google/callback/` |
| `CORS_ALLOWED_ORIGINS` | `https://yourcaly.com` |

4. After setting all vars, Railway auto-redeploys the service

---

## Step 4 — Get the Backend URL

1. After build succeeds, click the web service
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Copy the URL (e.g. `https://caly-backend.up.railway.app`)
5. Update `BASE_URL` and `ALLOWED_HOSTS` in Variables with this URL
6. Update `GOOGLE_REDIRECT_URI` with this URL

---

## Step 5 — Add Celery Worker Service

1. Click the **"+"** or **"New Service"** button in the project
2. Select **"GitHub Repo"** → pick `ullasgowda15/Calyy`
3. Click the new service → **Settings** → **Start Command**:
   ```
   celery -A core worker --loglevel=info --concurrency=2
   ```
4. Go to **Variables** → **"Copy from"** → select the web service → confirm
5. Make sure `C_FORCE_ROOT=true` is present

---

## Step 6 — Add Celery Beat Service

Repeat Step 5 but with this start command:

```
celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## Step 7 — Run Database Migrations

1. After all 3 services are deployed, click the web service → **Connect** tab → **"SSH"**
2. Run:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

---

## Step 8 — Deploy Frontend to Vercel

1. Go to https://vercel.com → **"Add New"** → **"Project"**
2. Import `ullasgowda15/Calyy`
3. Set **Root Directory** to `Frontend/`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add environment variable:
   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://caly-backend.up.railway.app` |

7. Click **"Deploy"**
8. After deploy, update `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` in Railway Variables

---

## Step 9 — Update Google OAuth Redirect URI

1. Go to https://console.cloud.google.com
2. Select your project → **"APIs & Services"** → **"Credentials"**
3. Click the OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://caly-backend.up.railway.app/api/integrations/google/callback/
   ```
5. Click **Save**

---

## Step 10 — Set Up Razorpay Webhook

1. Go to https://dashboard.razorpay.com → **"Settings"** → **"Webhooks"**
2. Click **"Add New Webhook"**
3. Webhook URL:
   ```
   https://caly-backend.up.railway.app/api/payments/webhook/
   ```
4. Select events: `payment.captured`, `payment.failed`
5. Copy the **Webhook Secret** and update `RAZORPAY_WEBHOOK_SECRET` in Railway Variables

---

## Step 11 — Verify End-to-End

1. Visit the frontend URL
2. Register a new account
3. Verify email (OTP should arrive via Resend)
4. Create an event type
5. Set availability
6. Create a booking (test payment with Razorpay test card: `4111 1111 1111 1111`)
7. Check email notifications
8. Verify booking appears in dashboard

---

## Troubleshooting

| Error | Fix |
|---|---|
| `/requirements.txt: not found` | Dockerfile paths must be prefixed with `Backend/` |
| `SECRET_KEY` not set | Build step needs dummy key — add `ARG SECRET_KEY=dummy` before `collectstatic` |
| `connection refused` to DB | Ensure PostgreSQL plugin is linked to the service |
| Celery `PermissionError` | Set `C_FORCE_ROOT=true` (already needed on Railway) |
| Google login fails | Check `GOOGLE_REDIRECT_URI` matches exactly what's in Google Cloud Console |
| CORS errors | `CORS_ALLOWED_ORIGINS` must match the frontend URL exactly |

---

## Useful Commands

```bash
# SSH into a running service
railway ssh

# Run management commands
railway run python manage.py migrate
railway run python manage.py collectstatic

# View logs
railway logs

# Restart a service
railway service restart

# Set variables
railway variables set KEY=VALUE
```


PS C:\Users\DELL> ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\caly_do"
Generating public/private rsa key pair.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in C:\Users\DELL\.ssh\caly_do
Your public key has been saved in C:\Users\DELL\.ssh\caly_do.pub
The key fingerprint is:
SHA256:MbGle9BPq8MJWMOM+xh0lF9iuVU5j6sZfD1I9+L4Qdc dell@UllasDG
The key's randomart image is:
+---[RSA 4096]----+
|        o... ... |
|       =.*+ o o  |
|      o %o.=.  + |
|     . = *oo o..o|
|      + S ..+ +oE|
|       + + ooo+oo|
|      . . =  B...|
|           .+ .. |
|             ..  |
+----[SHA256]-----+
PS C:\Users\DELL> Get-Content "$env:USERPROFILE\.ssh\caly_do.pub"
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDNFPobM5Epp8TC/gVEVNuPfOUOSzFcEcn1ZNBOubW6p0UMhc10rMqJd46AuzED7FgvdKZ8DagFBtIZ0EDiK34vCjBXexm4GKcEB91aEam/Y5mnpzVIqwVDnjrdBlOR+am1AFkv6+DGBDLPR2vlPW/ezM5k19vSK+kwXnHHKYA4bpvmo8TISN1JGtQXO0y+jVaNpUDDg5NKpRDTRCz4jm9siollAD11uAFSvtn1muoMnicQUryUfU5KQ1i/EjqwnkQXUEWKm3xrHfzaUZNeU9Fx3s2wTFdQLO5IDmQNODMXnZuswh33b4jHc3CracdTyhAy3mNLhO0G+APAFRg6Z4UcH7cywzgn6itg2GRi87QtgI1rPVwFc+uUqpdjNgHT8xSLXcM+IGFqX9+v/DogRZMAxykEFbPzHJloLo+8JyvtjodCBKQLLebxCo22GakkE+TdbZxUEe2ZTlsYknE8u/fL3y/vIj1gHwra/CyFC645MwLjbhsQtiKEphVplU48OEIah7afUV1q4N2yBydbZpvlZEmj1wgjKx6ryZ9zLXckj+HCF9UA3TmYoOUSUK1LcielaFszAFIdHXg1jIO48H4PdEJ7vR/OD/TziNRTIbGaUBQNgFslzVsL4niW+voUPSn0vBBW89+XG6R0Pk0RvQLUPA90VTDz7B7qei0ECkYnGw== dell@UllasDG
PS C:\Users\DELL>