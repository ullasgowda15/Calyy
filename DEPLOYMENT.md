# DigitalOcean Deployment Guide

## Prerequisites

- DigitalOcean account (sign up at https://digitalocean.com)
- PayPal or debit/credit card for payment
- GitHub account with the Caly repo pushed
- Razorpay test/live keys
- Google OAuth credentials
- Resend API key (already in `.env`)
- Docker + Docker Compose installed locally (optional — for testing)

---

## Step 1 — Create a Droplet

1. Log in to DigitalOcean
2. Click **"Create"** → **"Droplets"**
3. Choose **"Marketplace"** → search for **"Docker"** → select **"Docker"**
   - This pre-installs Docker + Docker Compose on Ubuntu
4. Plan: **"Basic"** → **"Regular"** → **$6/mo** (1 GB RAM, 1 vCPU, 25 GB SSD)
5. Region: Choose one closest to your users (e.g. **"Bangalore"** for India)
6. Authentication: **"Password"** or **"SSH Key"** (recommended)
7. Hostname: `caly-prod`
8. Click **"Create Droplet"**
9. Note the **IP address** — you'll use it throughout

---

## Step 2 — Set Up the Droplet

SSH into your droplet (replace with your IP):

```bash
ssh root@<your-droplet-ip>
```

### Clone the repo

```bash
git clone https://github.com/ullasgowda15/Calyy.git /root/caly
cd /root/caly
```

### Create .env file

```bash
nano .env
```

Paste the following (update values as needed):

```env
SECRET_KEY=django-insecure-<generate-a-random-key>
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,<your-droplet-ip>

DATABASE_URL=postgres://postgres:postgres@db:5432/calendly_mvp
REDIS_URL=redis://redis:6379/0

POSTGRES_PASSWORD=postgres
POSTGRES_DB=calendly_mvp
POSTGRES_USER=postgres

RESEND_API_KEY=RESEND_API_KEY_REDACTED

RAZORPAY_KEY_ID=RAZORPAY_KEY_ID_REDACTED
RAZORPAY_KEY_SECRET=RAZORPAY_KEY_SECRET_REDACTED
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret

GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID_REDACTED
GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET_REDACTED
GOOGLE_REDIRECT_URI=http://<your-droplet-ip>/api/integrations/google/callback/

FRONTEND_URL=http://<your-droplet-ip>
BASE_URL=http://<your-droplet-ip>

CORS_ALLOWED_ORIGINS=http://<your-droplet-ip>,http://localhost:5173

DEFAULT_FROM_EMAIL=onboarding@resend.dev
```

Generate a secure SECRET_KEY:

```bash
python3 -c "import secrets; print('django-insecure-' + secrets.token_urlsafe(50))"
```

---

## Step 3 — Start the Services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** — database
- **Redis** — message broker
- **Backend** — Django API (Gunicorn on port 8000)
- **Celery worker** — background task processor
- **Celery beat** — scheduled task manager
- **Frontend** — Nginx serving React app (port 80)

### Check status

```bash
docker compose ps
```

All services should show `Up` or `Healthy`.

### View logs

```bash
docker compose logs -f        # all services
docker compose logs -f backend # just the backend
```

---

## Step 4 — Run Database Migrations

```bash
docker compose exec backend python manage.py migrate
```

### Create a superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

---

## Step 5 — Verify the App

1. Open your browser and go to `http://<your-droplet-ip>`
2. You should see the Caly frontend
3. Go to `http://<your-droplet-ip>/admin/` to access the Django admin
4. Register a new account and verify everything works

---

## Step 6 — Set Up SSL (HTTPS)

**Skip this for initial testing. Do it before going live.**

### Option A — Let's Encrypt (free)

```bash
# Install certbot
apt update && apt install -y certbot

# Get certificate (Nginx must be on port 80)
docker compose stop frontend
certbot certonly --standalone -d your-domain.com
docker compose start frontend
```

### Option B — Nginx Proxy Manager

Deploy jlesage/nginx-proxy-manager as an additional Docker container for a web UI.

---

## Step 7 — Configure DNS (Optional)

If you have a domain:
1. Go to your domain registrar's DNS settings
2. Add an **A record** pointing to `<your-droplet-ip>`
3. Update `ALLOWED_HOSTS`, `FRONTEND_URL`, `BASE_URL`, `CORS_ALLOWED_ORIGINS` in `.env`
4. Update the `GOOGLE_REDIRECT_URI` in `.env` and Google Cloud Console
5. Restart: `docker compose down && docker compose up -d`

---

## Step 8 — Set Up Google OAuth Redirect URI

1. Go to https://console.cloud.google.com
2. Select your project → **"APIs & Services"** → **"Credentials"**
3. Click the OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   http://<your-droplet-ip>/api/integrations/google/callback/
   ```
   (or `https://your-domain.com/...` once SSL is set up)

---

## Step 9 — Set Up Razorpay Webhook

1. Go to https://dashboard.razorpay.com → **"Settings"** → **"Webhooks"**
2. Click **"Add New Webhook"**
3. Webhook URL:
   ```
   http://<your-droplet-ip>/api/payments/webhook/
   ```
4. Select events: `payment.captured`, `payment.failed`
5. Copy the **Webhook Secret** and update `RAZORPAY_WEBHOOK_SECRET` in `.env`
6. Restart: `docker compose down && docker compose up -d`

---

## Common Commands

```bash
# SSH into droplet
ssh root@<your-droplet-ip>

# View logs
docker compose logs -f backend

# Restart a single service
docker compose restart backend

# Run management commands
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py collectstatic

# Rebuild and restart after code changes
cd /root/caly
git pull
docker compose up -d --build

# Stop everything
docker compose down

# Rebuild everything from scratch
docker compose down -v   # CAUTION: deletes DB data
docker compose up -d --build
```

---

## Updating the App

```bash
ssh root@<your-droplet-ip>
cd /root/caly
git pull
docker compose up -d --build
```

This rebuilds only the services that changed.

---

## Troubleshooting

| Problem | Likely Fix |
|---|---|
| `Connection refused` to db | Wait 10s for PostgreSQL to start, then `docker compose restart backend` |
| Frontend shows blank page | Check `docker compose logs frontend` — nginx might not be proxying correctly |
| API calls return 404 | Nginx `/api/` location may not match; check nginx config |
| Celery tasks not running | Check `docker compose logs celery-worker` |
| Port 80 already in use | `systemctl stop nginx` if Ubuntu's nginx is running on the host |
| Build fails with `npm ERR!` | SSH into droplet and check `docker compose logs --no-log-prefix frontend-build` |
| Droplet runs out of disk | `docker system prune -a` to clean unused images |
| CORS errors | Ensure `CORS_ALLOWED_ORIGINS` in `.env` includes the exact domain/IP you're accessing from |

---

## Cost Summary

| Item | Cost |
|---|---|
| **DO Droplet** (1 GB RAM, 1 vCPU) | **$6/mo** |
| Total | **$6/mo** |

This runs everything — database, Redis, backend, Celery workers, and frontend — on a single $6 droplet.
