# Taquinho Finance

Premium PWA finance app for a used car dealership. Feels like a mobile finance app (Credit Karma / Rocket Money style), built with Next.js 15, Supabase, and Tailwind CSS.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Copy your project URL and anon key

### 2. Environment

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. PWA Icons

Generate proper icons (replace the placeholder PNGs):

```bash
# With librsvg installed (brew install librsvg):
cd public/icons && sh generate-icons.sh
```

Or design custom icons at 192×192 and 512×512 pixels.

### 4. Run

```bash
npm install
npm run dev       # Development
npm run build     # Production build
npm start         # Production server
```

## Routes

| URL | Page |
|-----|------|
| `/login` | Login / Sign up |
| `/inicio` | Dashboard home |
| `/transacoes` | Transaction history |
| `/veiculos` | Vehicle inventory |
| `/veiculos/[id]` | Vehicle profit detail |
| `/relatorios` | Monthly reports |
| `/mais` | Settings / account |

## Key Features

- **Hero metric**: Net profit for the current month
- **Floating action button**: Add expense, sale, or vehicle purchase
- **Vehicle profit**: Per-vehicle P&L with linked expenses
- **Monthly trend chart**: Last 6 months of sales vs expenses
- **PWA**: Installable on iPhone (Add to Home Screen)
- **Portuguese UI**: All labels and formatting in pt-BR

## Design

- Colors: `#1C1C1E` (primary), `#FFCC00` (Taquinho yellow), `#30D158` (profit), `#FF453A` (expense)
- Font: Inter (variable)
- Cards: 16px radius, soft shadows
- Bottom navigation: 5 tabs with safe-area support
