# SecurePilot

AI-powered security policy generator for small and medium businesses.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env.local
```
Fill in your keys:
- **Supabase**: Create a project at [supabase.com](https://supabase.com), copy the URL and anon key from Project Settings → API
- **Anthropic**: Get your API key at [console.anthropic.com](https://console.anthropic.com)

### 3. Set up the database
In your Supabase project, go to **SQL Editor** and run the contents of `supabase-schema.sql`.
This file is idempotent — re-run it any time after pulling changes to apply new tables/columns (e.g. policy versioning).

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL)
- **Anthropic Claude** (Policy generation)
- **jsPDF** / **jspdf-autotable** (PDF export)
