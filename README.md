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

`src/content/data.json` remains as the seed source only.

## Direction

- Ivory paper + rust + pine (not purple, not SaaS blue)
- Fraunces / Outfit / Caveat
- Cursor reacts; the page is calm when you aren't touching it
