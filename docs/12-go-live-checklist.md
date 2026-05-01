> [!IMPORTANT]
> **PARTIALLY OUTDATED** — Some steps in this checklist reference agent configuration that no longer exists. For current deploy steps, use [DEPLOY.md](../DEPLOY.md) and [PRODUCTION.md](../PRODUCTION.md).

# Project Vidhya — Go-Live Checklist

*The single document Giri needs to flip from "demo" to "live". All pre-work is done. These are the ~30 minutes of configuration needed.*

---

## Status Legend
- ✅ Done (code already implements this)
- ⏳ Needs your input (requires credentials / decisions)
- 🔧 Optional (can add post-launch)

---

## Step 1: Get Your Gemini API Key (5 min)

**This is the ONLY required step to make AI work.**

1. Go to → https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key (starts with `AIza...`)

Cost: Free tier gives 60 requests/minute, 1M tokens/day. More than enough to start.

---

## Step 2: Deploy to Netlify (10 min)

The frontend is already configured with `netlify.toml` — just connect and deploy.

### Option A: Git Auto-Deploy (recommended)

1. Go to → https://app.netlify.com
2. Click **Add new site → Import an existing project**
3. Connect GitHub → Select `mathconcepts/vidhya-v2`
4. Set **Base directory**: `frontend`
5. Build command: `npm run build` (auto-filled from netlify.toml)
6. Publish directory: `dist` (auto-filled)
7. Click **Deploy**

### Option B: Manual Deploy (if GitHub not connected)

```bash
cd frontend
npm run build
# Then drag the `dist/` folder to netlify.com/drop
```

---

## Step 3: Add Environment Variables in Netlify (5 min)

**Netlify Dashboard → Your Site → Site Configuration → Environment Variables**

### Minimum Required

| Variable | Value | Where to get |
|----------|-------|--------------|
| `VITE_GEMINI_API_KEY` | `AIza...` | https://aistudio.google.com |

### Recommended for Production

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_APP_NAME` | `Project Vidhya` | Shows in browser tab |
| `VITE_GA4_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Google Analytics (optional) |

### Payments (when ready)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_RAZORPAY_KEY_ID` | `rzp_live_...` | Indian payments |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | International payments |

After adding env vars → **Trigger a new deploy** (Deploys tab → Trigger deploy).

---

## Step 4: Custom Domain (5 min, optional)

1. Netlify → Your Site → Domain Management → Add Custom Domain
2. Add: `app.vidhya.in` (or your chosen domain)
3. Update your DNS: Add CNAME pointing to `your-site.netlify.app`
4. SSL is auto-provisioned (free, via Let's Encrypt)

---

## Step 5: Verify Everything Works (5 min)

Visit your deployed URL and check:

- [ ] Homepage loads (marketing site at `/website`)
- [ ] Login/register flow works
- [ ] Chat with AI tutor works (says "Powered by Gemini" in header)
- [ ] Student dashboard shows correctly after login with student role
- [ ] Exam Insights page loads (`/insights`)
- [ ] Math renders correctly (test with: `What is $x^2 + 2x + 1$?`)

---

## What's Already Done (no action needed)

| Feature | Status |
|---------|--------|
| React SPA + routing | ✅ Built |
| Role-based dashboards (CEO/Admin/Teacher/Student) | ✅ Built |
| AI tutor chat (Gemini/Anthropic/mock fallback) | ✅ Built |
| Math rendering (KaTeX) | ✅ Built |
| Exam Insights (8 exams, all tabs) | ✅ Built |
| Streak badges, progress bars, exam countdown | ✅ Built |
| Frugal student UI (Khanmigo-style) | ✅ Built |
| Teacher dashboard with student attention filters | ✅ Built |
| Marketing website + pricing + blog | ✅ Built |
| User auth (OAuth/OTP/Passkey/Password) | ✅ Built |
| User onboarding flow (11 steps) | ✅ Built |
| Multi-channel notifications (WA/TG/SMS/Email) | ✅ Built (needs provider keys) |
| Feedback & complaint system | ✅ Built |
| Blog/content management | ✅ Built |
| SPA routing (netlify.toml) | ✅ Built |
| Security headers | ✅ Built |
| Bundle optimization (87% smaller than original) | ✅ Built |

---

## Post-Launch: Nice-to-Haves

These can be added after you validate with first users:

| Feature | Effort | Notes |
|---------|--------|-------|
| Backend API server | Medium | Currently all frontend; add for scale |
| WhatsApp notifications | Low | Need Twilio/Gupshup API key |
| Telegram bot | Low | Need @BotFather token |
| Razorpay payments | Low | Need merchant account |
| Google Analytics | Low | Just add GA4 measurement ID |
| Custom email (via SendGrid/Resend) | Low | Need API key |
| CI/CD pipeline | Low | GitHub Actions template ready |

---

## Quick Reference: Current Tech Stack

```
Frontend:  React 18 + TypeScript + Vite + Tailwind CSS
AI:        Gemini 2.0 Flash (primary), Claude/GPT (fallback)
Math:      KaTeX (renders LaTeX beautifully)
Charts:    Recharts
Auth:      Custom (WebAuthn/OAuth/OTP/Password)
Deploy:    Netlify (configured)
Repo:      github.com/mathconcepts/vidhya-v2
```

---

## Need Help?

Ping Jarvis on Telegram. I'll be watching. 👀

*Last updated: 2026-02-19*
