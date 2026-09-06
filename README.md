# Devanshi Shah

Editorial portfolio: **marginalia** — a magazine spread with notes in the margins.

Light/dark. Magnetic buttons. Tilt cards. Draggable notes.

```bash
npm run dev
```

## Content database (Neon + Prisma)

CMS content lives in Neon Postgres as normal tables (not one JSON blob).

| Table | What it holds |
|-------|----------------|
| `SiteSettings` | Site copy, hero, links, theme colors (singleton) |
| `SiteStat` | Hero stats |
| `Experience` | Work chapters |
| `Project` | Portfolio projects |
| `Memory` | Memory jar entries |
| `SkillGroup` / `SkillItem` | Skills & technologies |

1. Copy `.env.example` → `.env` / `.env.local` and set `DATABASE_URL` (pooled) + `DIRECT_URL` (non-pooled).
2. Push schema and seed from the checked-in JSON:

```bash
npm run db:push
npm run db:seed
npm run db:studio   # browse/edit rows
```

`src/content/data.json` remains as the seed source only. Do not commit real secrets or private media URLs there 

## Security

- Secrets (`ADMIN_PASSWORD`, `CMS_SECRET`, `DATABASE_URL`, `GEMINI_API_KEY`, `FORMSUBMIT_KEY`, `RESEND_API_KEY`, …) live only in env / host secret store — never in source or `NEXT_PUBLIC_*`.
- CMS session cookies are httpOnly HMAC-signed with `CMS_SECRET`. Login is rate-limited.
- Sensitive media (piano YouTube URL) is encrypted at rest and served only via same-origin `GET /api/media/piano`.
- If this repo or a machine `.env` was ever shared, rotate all credentials.

## Direction

- Ivory paper + rust + pine (not purple, not SaaS blue)
- Fraunces / Outfit / Caveat
- Cursor reacts; the page is calm when you aren't touching it
