import { z } from "zod";
import {
  HERO_TEMPLATES,
  SKILL_ICONS,
  type ContentData,
  type HeroTemplateId,
  type SkillIcon,
} from "./types";

const heroTemplateIds = HERO_TEMPLATES.map((t) => t.id) as [HeroTemplateId, ...HeroTemplateId[]];
const skillIconIds = [...SKILL_ICONS] as [SkillIcon, ...SkillIcon[]];

/**
 * Builds a required trimmed-string Zod schema.
 * @example nonEmpty("Name") // ZodString
 */
const nonEmpty = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

const hexColor = z
  .string()
  .trim()
  .regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color.")
  .transform((value) => {
    let hex = value.replace(/^#/, "");
    if (hex.length === 3) hex = [...hex].map((ch) => ch + ch).join("");
    return `#${hex.toUpperCase()}`;
  });

const heroMediaSchema = z.object({
  kind: z.enum(["none", "image", "video"]),
  url: z.string(),
  place: z.enum(["side", "background"]),
  side: z.enum(["left", "right"]),
});

const siteSchema = z.object({
  name: nonEmpty("Site name"),
  initials: nonEmpty("Initials").max(4),
  title: nonEmpty("Page title"),
  description: z.string(),
  heroTemplate: z.enum(heroTemplateIds),
  heroMedia: heroMediaSchema,
  pianoYoutubeUrl: z.string(),
  goodreadsUrl: z.string(),
  kicker: z.string(),
  greeting: z.string(),
  roles: z.array(z.string()),
  line: z.string(),
  about: z.string(),
  philosophyKicker: z.string(),
  philosophyTitle: z.string(),
  philosophy: z.string(),
  experienceIntro: z.string(),
  contactLine: z.string(),
  email: z.string(),
  linkedin: z.string(),
  github: z.string(),
  resume: z.string(),
  stats: z.array(
    z.object({
      value: z.number().finite().nonnegative(),
      suffix: z.string(),
      label: nonEmpty("Stat label"),
    }),
  ),
});

const experienceSchema = z.object({
  id: nonEmpty("Experience id"),
  when: z.string(),
  current: z.boolean(),
  role: nonEmpty("Experience role"),
  company: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
  stack: z.array(z.string()),
});

const projectSchema = z.object({
  id: nonEmpty("Project id"),
  name: nonEmpty("Project name"),
  blurb: z.string(),
  tags: z.array(z.string()),
  github: z.string(),
  demo: z.string(),
});

const skillItemSchema = z.object({
  name: nonEmpty("Skill name"),
  icon: z.enum(skillIconIds),
  color: z.string().optional(),
  iconUrl: z.string().optional(),
});

const skillGroupSchema = z.object({
  title: nonEmpty("Skill group title"),
  items: z.array(skillItemSchema),
});

const paletteSchema = z.object({
  background: hexColor,
  foreground: hexColor,
  card: hexColor,
  cardHover: hexColor,
  chip: hexColor,
  accentText: hexColor,
  accentHover: hexColor,
  badge: hexColor,
});

const savedThemeSchema = z.object({
  id: nonEmpty("Saved theme id"),
  name: nonEmpty("Saved theme name"),
  description: z.string().optional(),
  brandFrom: hexColor,
  brandTo: hexColor,
  dark: paletteSchema,
  light: paletteSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const themeSchema = z.object({
  defaultMode: z.enum(["light", "dark", "system"]),
  allowToggle: z.boolean(),
  brandFrom: hexColor,
  brandTo: hexColor,
  dark: paletteSchema,
  light: paletteSchema,
  activeThemeId: z.string().nullable().optional(),
  savedThemes: z.array(savedThemeSchema).optional().default([]),
});

const memorySchema = z.object({
  id: nonEmpty("Memory id"),
  title: z.string().optional(),
  note: nonEmpty("Memory note"),
  date: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  photoUrl: z.string().optional(),
  color: z.string().optional(),
});

const remOrNull = z
  .number()
  .finite()
  .positive()
  .nullable()
  .optional()
  .transform((value) => (value === undefined ? null : value));

const shelfArtifactSchema = z.object({
  id: nonEmpty("Shelf artifact id"),
  name: nonEmpty("Shelf artifact name"),
  imageUrl: z.string(),
  widthRem: z.number().finite().positive(),
  heightRem: z.number().finite().positive(),
  enabled: z.boolean(),
});

const shelfBookStackSchema = z.object({
  id: nonEmpty("Shelf stack id"),
  type: z.literal("book-stack"),
  orientation: z
    .enum(["vertical", "horizontal", "tilt-left", "tilt-right"])
    .default("vertical"),
  bookIds: z.array(nonEmpty("Shelf book id")).min(1).max(8),
});

const shelfSpacerSchema = z.object({
  id: nonEmpty("Shelf spacer id"),
  type: z.literal("spacer"),
  widthRem: z.number().finite().positive().max(24),
});

const shelfPlankItemSchema = z.discriminatedUnion("type", [
  shelfBookStackSchema,
  shelfSpacerSchema,
]);

const shelfDecorSchema = z.object({
  id: nonEmpty("Shelf decor id"),
  artifactId: nonEmpty("Shelf artifact id"),
  xPercent: z.number().finite().min(0).max(100),
  xRem: z.number().finite().min(0).max(120).nullable().optional(),
  yPercent: z.number().finite().min(0).max(100),
  widthRem: remOrNull,
  heightRem: remOrNull,
});

const shelfPlankSchema = z.object({
  id: nonEmpty("Shelf plank id"),
  items: z.array(shelfPlankItemSchema).default([]),
});

const shelfViewportLayoutSchema = z.object({
  planks: z.array(shelfPlankSchema).min(1).max(6),
  decor: z.array(shelfDecorSchema).default([]),
});

/**
 * Ensures each Goodreads bookId and artifactId appears at most once in a viewport.
 * @example uniqueIdsPerViewport({planks,decor}, ctx, "desktop")
 */
function uniqueIdsPerViewport(
  view: z.infer<typeof shelfViewportLayoutSchema>,
  ctx: z.RefinementCtx,
  viewport: "desktop" | "mobile",
) {
  const seenBooks = new Set<string>();
  for (let p = 0; p < view.planks.length; p += 1) {
    const plank = view.planks[p];
    if (!plank) continue;
    for (let i = 0; i < plank.items.length; i += 1) {
      const item = plank.items[i];
      if (!item || item.type !== "book-stack") continue;
      for (let b = 0; b < item.bookIds.length; b += 1) {
        const bookId = item.bookIds[b];
        if (!bookId) continue;
        if (seenBooks.has(bookId)) {
          ctx.addIssue({
            code: "custom",
            message: `Book ${bookId} appears more than once in ${viewport}`,
            path: [viewport, "planks", p, "items", i, "bookIds", b],
          });
        }
        seenBooks.add(bookId);
      }
    }
  }

  const seenArtifacts = new Set<string>();
  for (let d = 0; d < view.decor.length; d += 1) {
    const decor = view.decor[d];
    if (!decor) continue;
    if (seenArtifacts.has(decor.artifactId)) {
      ctx.addIssue({
        code: "custom",
        message: `Decor ${decor.artifactId} appears more than once in ${viewport}`,
        path: [viewport, "decor", d, "artifactId"],
      });
    }
    seenArtifacts.add(decor.artifactId);
  }
}
const shelfLayoutSchema = z
  .object({
    desktop: shelfViewportLayoutSchema,
    mobile: shelfViewportLayoutSchema,
  })
  .superRefine((layout, ctx) => {
    uniqueIdsPerViewport(layout.desktop, ctx, "desktop");
    uniqueIdsPerViewport(layout.mobile, ctx, "mobile");
  });

const craftItemSchema = z.object({
  title: nonEmpty("Craft item title"),
  why: z.string(),
});

const craftGroupSchema = z.object({
  title: nonEmpty("Craft group title"),
  intro: z.string(),
  items: z.array(craftItemSchema),
});

const craftSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  intro: z.string(),
  footnote: z.string(),
  groups: z.array(craftGroupSchema),
});

const contentSaveSchema = z.object({
  site: siteSchema,
  experience: z.array(experienceSchema),
  projects: z.array(projectSchema),
  skills: z.array(skillGroupSchema),
  technologies: z.array(skillGroupSchema).optional().default([]),
  theme: themeSchema,
  memories: z.array(memorySchema).optional().default([]),
  craft: craftSchema.optional().default({
    kicker: "",
    title: "",
    intro: "",
    footnote: "",
    groups: [],
  }),
  shelfArtifacts: z.array(shelfArtifactSchema).optional().default([]),
  shelfLayout: shelfLayoutSchema.optional().default({
    desktop: {
      planks: [{ id: "plank-1", items: [] }, { id: "plank-2", items: [] }],
      decor: [],
    },
    mobile: {
      planks: [{ id: "plank-1", items: [] }, { id: "plank-2", items: [] }],
      decor: [],
    },
  }),
});

export type ParseContentSaveResult =
  | { ok: true; content: ContentData }
  | { ok: false; error: string };

/**
 * Strict Zod validation for CMS saves.
 * @example parseContentForSave(payload) // {ok:true, content} | {ok:false, error}
 */
export function parseContentForSave(value: unknown): ParseContentSaveResult {
  const parsed = contentSaveSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? issue.path.join(".") : "content";
    return {
      ok: false,
      error: `${path}: ${issue?.message || "Invalid content."}`,
    };
  }
  return { ok: true, content: parsed.data };
}
