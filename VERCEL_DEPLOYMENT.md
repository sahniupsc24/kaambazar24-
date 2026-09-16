# 🚀 Kaam Bazar - Vercel Deployment Guide

Aapke project ka **Frontend (Vite + React)** ab Vercel par deploy hone ke liye poori tarah ready hai!

---

## 🛠️ Step 1: Vercel par Deploy Kaise Karein

### Method 1: Vercel Dashboard (GitHub / Git Repo)
1. **[Vercel Dashboard](https://vercel.com/dashboard)** par jayein aur **"Add New..."** -> **"Project"** select karein.
2. Apna GitHub repository (`workforce-marketplace-2`) choose karein.
3. Config Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: Select `frontend` (ya default root rehne dein, humne dono ke liye `vercel.json` set kar diya hai).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** (Neeche diya gaya section dekhein) add karein.
5. **Deploy** button par click karein.

---

### Method 2: Vercel CLI Se Deploy
Terminal mein:
```bash
cd frontend
npx vercel --prod
```

---

## 🔑 Step 2: Vercel Environment Variables Config

Vercel Project Settings -> **Environment Variables** mein ye keys add karein:

| Variable Name | Value Example | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://mvfgnixsbbbrrquckgng.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `ey...` | Supabase Public Anon Key |
| `VITE_SITE_URL` | `https://your-app.vercel.app` | Vercel Live App URL |
| `VITE_API_URL` | `https://kaam-bazar-production.up.railway.app/api` | Railway/Render Backend API URL |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_...` | Razorpay Key (Optional) |

---

## ✅ Direct Route Fix (SPA Routing)
Vercel par single page routing (React Router) handle karne ke liye `vercel.json` in place hai:
- `/jobs`, `/login`, `/register`, `/dashboard` etc. direct refresh karne par **404 error nahi aayega**.
