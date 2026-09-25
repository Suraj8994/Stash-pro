# Remix DistriTrack

Distributor field coverage and sales workforce management web application powered by **Vite + React 19 + TypeScript + Tailwind CSS v4 + Supabase Postgres/Auth/Realtime**.

Designed for field operations managers and sales representatives to track outlet visit cycles, monitor delayed accounts, execute GPS-verified check-ins, dispatch reminder alerts, and maintain store coverage.

---

## Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4 (Slate & Emerald/Amber/Rose/Sky status palette).
- **Backend / DB / Auth:** Supabase PostgreSQL, Row Level Security, Supabase Auth mapped to quick Rep Codes (`100`, `101`, `102`, etc.), and Realtime subscriptions.
- **Hosting / CI/CD:** Netlify with automatic rebuilds on GitHub push (`netlify.toml`).

---

## 1. Local Development Setup

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd remix-distritrack
   npm install
   ```

2. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase project URL and anon public key:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```
   *(Note: If environment variables are omitted or not yet provisioned, Remix DistriTrack automatically runs in a connected interactive Demo Mode seeded with full FMCG outlets and rep profiles so you can explore immediately).*

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Supabase Setup (Database & Realtime)

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In your Supabase dashboard, navigate to the **SQL Editor**.
3. Copy and run the contents of [`schema.sql`](./schema.sql) to create the `profiles`, `areas`, and `activity_notifications` tables, RLS policies, and RPC functions.
4. Run [`seed.sql`](./seed.sql) to populate sample distributor outlets, sales reps, and initial activity logs.
5. **Enable Realtime:**
   - Go to **Database** -> **Replication** (or **Publication** in newer dashboards).
   - Toggle **Realtime** to ON for both:
     - `areas`
     - `activity_notifications`
6. Go to **Project Settings** -> **API** and copy:
   - **Project URL**
   - **anon / public key**

---

## 3. GitHub & Netlify Deployment

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: Initial Remix DistriTrack build"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Log in to [Netlify](https://www.netlify.com).
   - Click **Add new site** -> **Import an existing project** -> **GitHub**.
   - Select your `remix-distritrack` repository.
   - Build settings will auto-detect from `netlify.toml`:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`

3. **Add Netlify Environment Variables:**
   - Under **Site settings** -> **Environment variables**, add:
     - `VITE_SUPABASE_URL` = `<Your Supabase URL>`
     - `VITE_SUPABASE_ANON_KEY` = `<Your Supabase Anon Key>`
   - Trigger the deploy! Every push to `main` will automatically build and publish.

---

## Rep Code Authentication & Roles

- **Admin Account:** Rep Code `100` (Vikram Malhotra - Operations HQ)
  - Master Key for unlocking reps & emergency password resets: `admin123`
- **Sales Rep Accounts:**
  - `101` — Rahul Sharma (*North Sector FMCG*)
  - `102` — Priya Patel (*Central Downtown Market*)
  - `103` — Amit Kumar (*Industrial Corridor South*)
  - `104` — Sara Khan (*Suburban East Mall Hub*)

*Default password for initial seed accounts: `distritrack123` (or set custom password upon first login).*
