# Tanveer Traders — Rice & Sugar Wholesale & Retail

A lightweight, high-performance, and secure wholesale and retail ecommerce web application for **Tanveer Traders**, located in Khushab, Punjab, Pakistan.

Website: `https://tanveertraders.pk/`  
WhatsApp: `03271639095` (International format: `+923271639095`)  
Products: Basmati Rice, Non-Basmati Rice, and Refined Sugar (Wholesale 50 kg bags & Retail packs).

---

## 1. Architecture Overview

- **Public Frontend:** Clean semantic HTML5, CSS3, and Vanilla JavaScript. No heavy frontend framework runtime, ensuring instant page loads and zero layout shift.
- **Backend:** Node.js Express server running REST API endpoints with server-side input validation, rate-limiting, and authentication.
- **Database & Auth:** Supabase PostgreSQL with strict Row Level Security (RLS) policies. Includes an automated in-memory/resilient local data store fallback for instantaneous local preview before Supabase credentials are configured.
- **Handoff Mechanism:** Automated WhatsApp link generation (`https://wa.me/923271639095?text=...`) compiling itemized quotes, customer details, and sample rates.
- **Admin Area:** Private dashboard (`/admin`) and login (`/admin/login`) for managing product variants, active status, rates, order enquiry logs, and store settings.

---

## 2. Page & Directory Structure

```
tanveer-traders/
├── index.html                  # Public Page 1: Homepage & Brand Showcase
├── products.html               # Public Page 2: Products Catalog & Order Builder
├── assets/
│   ├── css/
│   │   └── styles.css          # Design system stylesheet
│   ├── js/
│   │   ├── main.js             # Navigation & layout interactions
│   │   ├── products.js         # Catalog fetching & category filtering
│   │   ├── order.js            # Order builder & WhatsApp handoff
│   │   └── admin.js            # Admin authentication & dashboard logic
│   └── images/
│       ├── logo.svg            # Tanveer Traders SVG brand logo
│       ├── hero-rice-sugar.jpg # Hero photographic banner
│       ├── product-basmati-rice.jpg
│       ├── product-refined-sugar.jpg
│       ├── rice-placeholder.svg
│       └── sugar-placeholder.svg
├── admin/
│   ├── login.html              # Admin login page
│   └── index.html              # Admin management dashboard
├── api/
│   ├── index.js                # Serverless unified entry point
│   ├── products.js             # Public products GET endpoints
│   ├── orders.js               # Order validation & creation endpoint
│   └── admin/
│       ├── products.js         # Admin CRUD endpoints
│       ├── orders.js           # Admin order status endpoints
│       └── settings.js         # Admin store settings endpoints
├── database/
│   ├── schema.sql              # PostgreSQL table definitions
│   ├── rls-policies.sql        # Supabase Row Level Security rules
│   └── seed-sample-data.sql    # Initial product variants & settings
├── lib/
│   ├── supabase.js             # Supabase client with local fallback
│   ├── auth.js                 # Authentication & JWT session handling
│   └── validation.js           # Input validation & sanitization
├── favicon.svg                 # Website favicon
├── robots.txt                  # Search engine crawl instructions
├── sitemap.xml                 # XML sitemap for public pages
├── vercel.json                 # Vercel deployment configuration
├── server.ts                   # Express full-stack dev and production server
├── .env.example                # Sample environment variables
└── README.md                   # Complete documentation
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Local server port | `3000` |
| `APP_URL` | Application root URL | `http://localhost:3000` |
| `SUPABASE_URL` | Supabase project API URL | Optional for preview |
| `SUPABASE_ANON_KEY` | Supabase anonymous public key | Optional for preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase privileged service-role key (server-side only) | Optional for preview |
| `ADMIN_EMAIL` | Administrator login email | `admin@tanveertraders.com` |
| `ADMIN_INITIAL_PASSWORD` | Administrator initial password | `ChangeThisSecurePassword123!` |
| `ADMIN_JWT_SECRET` | Secret key for signing admin session tokens | Random string (min 32 chars) |

---

## 4. Local Installation & Setup

### Step 1: Install Dependencies
Ensure Node.js LTS (v18+ or v20+) is installed.
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

- **Home:** `http://localhost:3000/`
- **Products & Orders:** `http://localhost:3000/products.html`
- **Admin Login:** `http://localhost:3000/admin/login`
- **Admin Dashboard:** `http://localhost:3000/admin`

---

## 5. Supabase Setup Guide

1. Log into [Supabase](https://supabase.com) and create a new project.
2. Go to the **SQL Editor** in the Supabase dashboard.
3. Run the scripts in the following order:
   - Paste and execute `database/schema.sql`
   - Paste and execute `database/rls-policies.sql`
   - Paste and execute `database/seed-sample-data.sql`
4. Go to **Authentication -> Users** and click **Add User -> Create User** with:
   - Email: `admin@tanveertraders.com`
   - Password: Your strong administrator password
5. Copy your project URL and service role key from **Project Settings -> API** and paste them into your `.env` or Vercel environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 6. GitHub & Vercel Deployment

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit for Tanveer Traders website"
git branch -M main
git remote add origin https://github.com/<your-username>/tanveer-traders.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Log into [Vercel](https://vercel.com) and click **Add New -> Project**.
2. Import the `tanveer-traders` repository.
3. Under **Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_INITIAL_PASSWORD`
   - `ADMIN_JWT_SECRET`
4. Click **Deploy**. Vercel will build and publish your static assets and serverless API endpoints using `vercel.json`.

---

## 7. Security Best Practices

- Service-role keys and administrative passwords are kept strictly server-side and never exposed to the client bundle.
- Row Level Security (RLS) restricts public access to read-only on active products.
- Order enquiries are validated and sanitized on the backend; prices submitted by the browser are never trusted directly.
- Strict HTTP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`) are applied.
