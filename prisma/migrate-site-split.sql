-- Split SiteSettings mega-row into HeroSettings + ThemeSettings.
-- Safe to re-run: uses ON CONFLICT DO UPDATE / IF EXISTS guards.

CREATE TABLE IF NOT EXISTS "HeroSettings" (
  "siteId" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "mediaKind" TEXT NOT NULL,
  "mediaUrl" TEXT NOT NULL DEFAULT '',
  "mediaPlace" TEXT NOT NULL,
  "mediaSide" TEXT NOT NULL,
  CONSTRAINT "HeroSettings_pkey" PRIMARY KEY ("siteId")
);

CREATE TABLE IF NOT EXISTS "ThemeSettings" (
  "siteId" TEXT NOT NULL,
  "defaultMode" TEXT NOT NULL,
  "allowToggle" BOOLEAN NOT NULL,
  "brandFrom" TEXT NOT NULL,
  "brandTo" TEXT NOT NULL,
  "dark" JSONB NOT NULL,
  "light" JSONB NOT NULL,
  CONSTRAINT "ThemeSettings_pkey" PRIMARY KEY ("siteId")
);

-- Copy hero + theme from legacy SiteSettings columns when present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SiteSettings' AND column_name = 'heroTemplate'
  ) THEN
    INSERT INTO "HeroSettings" ("siteId", "template", "mediaKind", "mediaUrl", "mediaPlace", "mediaSide")
    SELECT
      "id",
      "heroTemplate",
      "heroMediaKind",
      COALESCE("heroMediaUrl", ''),
      "heroMediaPlace",
      "heroMediaSide"
    FROM "SiteSettings"
    ON CONFLICT ("siteId") DO UPDATE SET
      "template" = EXCLUDED."template",
      "mediaKind" = EXCLUDED."mediaKind",
      "mediaUrl" = EXCLUDED."mediaUrl",
      "mediaPlace" = EXCLUDED."mediaPlace",
      "mediaSide" = EXCLUDED."mediaSide";

    INSERT INTO "ThemeSettings" ("siteId", "defaultMode", "allowToggle", "brandFrom", "brandTo", "dark", "light")
    SELECT
      "id",
      "themeDefaultMode",
      "themeAllowToggle",
      "themeBrandFrom",
      "themeBrandTo",
      jsonb_build_object(
        'background', "darkBackground",
        'foreground', "darkForeground",
        'card', "darkCard",
        'cardHover', "darkCardHover",
        'chip', "darkChip",
        'accentText', "darkAccentText",
        'accentHover', "darkAccentHover",
        'badge', "darkBadge"
      ),
      jsonb_build_object(
        'background', "lightBackground",
        'foreground', "lightForeground",
        'card', "lightCard",
        'cardHover', "lightCardHover",
        'chip', "lightChip",
        'accentText', "lightAccentText",
        'accentHover', "lightAccentHover",
        'badge', "lightBadge"
      )
    FROM "SiteSettings"
    ON CONFLICT ("siteId") DO UPDATE SET
      "defaultMode" = EXCLUDED."defaultMode",
      "allowToggle" = EXCLUDED."allowToggle",
      "brandFrom" = EXCLUDED."brandFrom",
      "brandTo" = EXCLUDED."brandTo",
      "dark" = EXCLUDED."dark",
      "light" = EXCLUDED."light";
  END IF;
END $$;

-- Drop legacy columns from SiteSettings (no-op if already removed).
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "heroTemplate";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "heroMediaKind";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "heroMediaUrl";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "heroMediaPlace";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "heroMediaSide";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "themeDefaultMode";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "themeAllowToggle";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "themeBrandFrom";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "themeBrandTo";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "darkBackground";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "darkForeground";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "darkCard";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "darkCardHover";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "darkChip";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "darkAccentText";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "darkAccentHover";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "darkBadge";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "lightBackground";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "lightForeground";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "lightCard";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "lightCardHover";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "lightChip";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "lightAccentText";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "lightAccentHover";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "lightBadge";

-- FK from child tables to SiteSettings (ignore if already present).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HeroSettings_siteId_fkey'
  ) THEN
    ALTER TABLE "HeroSettings"
      ADD CONSTRAINT "HeroSettings_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "SiteSettings"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ThemeSettings_siteId_fkey'
  ) THEN
    ALTER TABLE "ThemeSettings"
      ADD CONSTRAINT "ThemeSettings_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "SiteSettings"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
