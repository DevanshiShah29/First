# Devanshi Shah

Editorial portfolio: **marginalia** — a magazine spread with notes in the margins.

Light/dark. Magnetic buttons. Tilt cards. Draggable notes.

```bash
npm run dev
```

Public write-up of how this site is engineered: visit **`/craft`** on the running site (edited in the CMS Craft screen; same story as the tables below, written for visitors).

## Engineering craft

This portfolio is treated as a product. The practices below are what “good developer” means here — not a checklist for show, but constraints that keep visitors safe, content honest, and the codebase changeable.

### Security & trust

| Practice | Why it matters |
|----------|----------------|
| HttpOnly CMS sessions + `sessionVersion` revocation | Password changes invalidate old cookies; sessions aren’t sticky forever after a leak. |
| Same-origin checks on mutating CMS APIs | Session cookie alone isn’t enough for cross-site POSTs. |
| Upload path confinement + SSRF guards | Resume/AI helpers can’t escape `uploads/` or fetch private network hosts. |
| Secrets encrypted at rest; piano via same-origin proxy | Sensitive media URLs never ship in public props; encrypt fails closed without a key. |
| Magic-byte upload sniffing | We trust file *content*, not the browser’s MIME type or filename. |
| Shared Redis rate limits | Login, reset, contact, AI, and uploads stay bounded across serverless instances. |

### Honest data

| Practice | Why it matters |
|----------|----------------|
| No hardcoded Memory Jar samples | Empty CMS → empty jar UI. No fictional “memories” pretending to be yours. |
| Zod on CMS save | Incomplete payloads are rejected — no invented names/roles on bad POSTs. |
| Gated destructive seed | Production reseeds need explicit flags; existing sites aren’t silently wiped. |

### Architecture

| Practice | Why it matters |
|----------|----------------|
| `server/` / `hooks/` / `lib/` split | Node-only auth/crypto/AI stay off the client bundle path. |
| Thin AI routes + `server/ai/*` services | Prompts and Gemini calls aren’t copy-pasted across four handlers. |
| Site / Hero / Theme tables | Unrelated domains aren’t jammed into one mega-row. |
| CMS hooks (`useCmsDocument`, navigation, uploads) | AdminApp composes screens; save shortcut deps stay correct. |
| Homepage section components | About/experience/projects/skills/contact can evolve independently. |

### Performance, SEO & accessibility

| Practice | Why it matters |
|----------|----------------|
| Tagged content cache + revalidate on save | Readers aren’t paying a full DB round-trip on every hit. |
| `next/image` + safe remote fallback | Optimized where allowed; arbitrary CMS URLs don’t crash the page. |
| SSR for interactive heroes | Art can paint on the server; shared hooks own piano/tilt. |
| `robots.ts`, `sitemap.ts`, OG/Twitter metadata | Discoverable by crawlers and decent when shared. |
| Dialog focus trap (Memory Jar) | Keyboard users stay inside the reveal; focus returns on close. |
| CMS `Field` label wiring | Admin controls have real `htmlFor` / `id` / hint associations. |

### Production hygiene

| Practice | Why it matters |
|----------|----------------|
| Vercel Blob for CMS media | Serverless disks aren’t durable; uploads aren’t committed to git. |
| Tracked `.env.example` | Clones get a complete template; secrets stay ignored. |
| No SVG CMS uploads | Avoids serving attacker-controlled SVG as documents. |

## Source layout

| Path | Role |
|------|------|
| `src/server/` | Server-only (Prisma, CMS auth, crypto, rate limits, email, AI helpers) |
| `src/hooks/` | Client hooks (`useReducedMotion`, jar size, visibility) |
| `src/lib/` | Shared isomorphic utils + browser API clients (`cms-client`, `contact-client`) |
| `src/components/` | UI (public + `cms/`) |
| `src/content/` | CMS types, store, validation |
| `src/app/` | Routes + API |

## Content database (Neon + Prisma)

CMS content lives in Neon Postgres as normal tables (not one JSON blob).

| Table | What it holds |
|-------|----------------|
| `SiteSettings` | Identity, copy, contact/social links (singleton) |
| `HeroSettings` | Hero template + media (1:1 with site) |
| `ThemeSettings` | Theme tokens; dark/light palettes as JSON (1:1) |
| `SiteStat` | Hero stats |
| `Experience` | Work chapters |
| `Project` | Portfolio projects |
| `Memory` | Memory jar entries |
| `SkillGroup` / `SkillItem` | Skills & technologies |

If you still have a legacy single-table `SiteSettings`, run:

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrate-site-split.sql
npx prisma db push
```

1. Copy `.env.example` → `.env` / `.env.local` and set `DATABASE_URL` (pooled) + `DIRECT_URL` (non-pooled).
2. Push schema and seed from the checked-in JSON:

```bash
npm run db:push
npm run db:seed
npm run db:studio   # browse/edit rows
```

`db:seed` is destructive (replaces CMS tables from `data.json`). Guards:

- Skips if `SiteSettings` already exists unless `FORCE_SEED=1`
- Refuses `NODE_ENV=production` unless `ALLOW_PROD_SEED=1`

`src/content/data.json` remains as the seed source only. Do not commit real secrets or private media URLs there. 

## CMS uploads (Vercel Blob)

Production CMS uploads (hero media, skill icons, memory photos, resume) require **Vercel Blob**:

1. Vercel dashboard → Storage → Blob → create a store.
2. Copy `BLOB_READ_WRITE_TOKEN` into the host env (and `.env.local` for local blob testing).

Without the token, uploads write to `public/uploads` (**local/dev only**). Production refuses disk uploads. That folder is **gitignored** (only `.gitkeep` placeholders are tracked) — do not commit uploaded binaries or SVGs.

## Rate limits (Upstash Redis)

Login, forgot-password, and contact limits use **Upstash Redis** when configured:

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Without Redis, limits fall back to in-memory (local/dev only — not durable across serverless instances).

## Security

- Secrets (`ADMIN_PASSWORD`, `CMS_SECRET`, `DATABASE_URL`, `GEMINI_API_KEY`, `FORMSUBMIT_KEY`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `UPSTASH_REDIS_REST_*`, …) live only in env / host secret store — never in source or `NEXT_PUBLIC_*`.
- CMS session cookies are httpOnly HMAC-signed with `CMS_SECRET` and bound to a `sessionVersion` that bumps on password change/reset (old cookies stop working). Login is rate-limited.
- Sensitive media (piano YouTube URL) is encrypted at rest and served only via same-origin `GET /api/media/piano`.
- If this repo or a machine `.env` was ever shared, rotate all credentials.

## Direction

- Ivory paper + rust + pine (not purple, not SaaS blue)
- Fraunces / Outfit / Caveat
- Cursor reacts; the page is calm when you aren't touching it
