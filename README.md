# Wedding guest management

A bilingual (Khmer / English) app for managing wedding guests and gifts (ចំណងដៃ): guest list, money and item gifts in USD or KHR, a live gift display screen, CSV export, and CSV/XLSX import.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/samraichchan-7736s-projects/v0-wedding-guest-management)

## Stack

- Next.js 16 (App Router, Turbopack) and React 19
- Tailwind CSS 4 with Radix UI primitives, light and dark themes
- MongoDB via Mongoose 9
- NextAuth 4 (email and password)

## Environment variables

| Name | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Secret used to sign session tokens |
| `NEXTAUTH_URL` | Public URL of the app (Vercel sets this automatically in most setups) |

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm lint
pnpm typecheck
pnpm build
```

## Translations

All UI text lives in `lib/i18n.ts`. The Khmer dictionary is typed against the English one, so a missing translation fails the type check.
