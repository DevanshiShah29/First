import { Prisma, type PrismaClient } from "@prisma/client";
import {
  publishStatusOf,
  type ExperienceItem,
  type MemoryItem,
  type ProjectItem,
  type ShelfArtifactItem,
  type SkillGroup,
  type CraftGroup,
} from "./types";

const SITE_ID = "main";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Inserts or updates rows by id and deletes ids missing from `values`, in one statement.
 * One statement is one round trip; a delete followed by an insert is several.
 * @example await upsertReplacing(db, Prisma.sql`...`) // void
 */
async function upsertReplacing(db: DbClient, statement: Prisma.Sql) {
  await db.$executeRaw(statement);
}

/**
 * Replaces site stats in one statement.
 * @example await replaceSiteStats(db, stats) // void
 */
export async function replaceSiteStats(
  db: DbClient,
  stats: { value: number; suffix: string; label: string }[],
) {
  if (stats.length === 0) {
    await db.siteStat.deleteMany({ where: { siteId: SITE_ID } });
    return;
  }
  const values = Prisma.join(
    stats.map(
      (stat, i) =>
        Prisma.sql`(${crypto.randomUUID()}::text, ${SITE_ID}::text, ${i}::int, ${Math.round(stat.value)}::int, ${stat.suffix}::text, ${stat.label}::text)`,
    ),
  );
  await upsertReplacing(
    db,
    Prisma.sql`
      WITH removed AS (
        DELETE FROM "SiteStat" WHERE "siteId" = ${SITE_ID}
      )
      INSERT INTO "SiteStat" ("id", "siteId", "sortOrder", "value", "suffix", "label")
      SELECT "id", "siteId", "sortOrder", "value", "suffix", "label"
      FROM (VALUES ${values}) AS v("id", "siteId", "sortOrder", "value", "suffix", "label")
    `,
  );
}

/**
 * Replaces experience rows in one statement.
 * @example await replaceExperience(db, items) // void
 */
export async function replaceExperience(db: DbClient, rows: ExperienceItem[]) {
  if (rows.length === 0) {
    await db.experience.deleteMany();
    return;
  }
  const values = Prisma.join(
    rows.map(
      (item, i) =>
        Prisma.sql`(${item.id}::text, ${i}::int, ${item.when}::text, ${item.current}::boolean, ${item.role}::text, ${item.company}::text, ${item.summary}::text, ${item.bullets}::text[], ${item.stack}::text[], ${publishStatusOf(item.status)}::text)`,
    ),
  );
  await upsertReplacing(
    db,
    Prisma.sql`
      WITH incoming AS (
        SELECT * FROM (VALUES ${values}) AS v(
          "id", "sortOrder", "when", "current", "role", "company", "summary", "bullets", "stack", "status"
        )
      ),
      removed AS (
        DELETE FROM "Experience" AS e
        WHERE e."id" NOT IN (SELECT "id" FROM incoming)
      )
      INSERT INTO "Experience" (
        "id", "sortOrder", "when", "current", "role", "company", "summary", "bullets", "stack", "status", "updatedAt"
      )
      SELECT "id", "sortOrder", "when", "current", "role", "company", "summary", "bullets", "stack", "status", NOW()
      FROM incoming
      ON CONFLICT ("id") DO UPDATE SET
        "sortOrder" = EXCLUDED."sortOrder",
        "when" = EXCLUDED."when",
        "current" = EXCLUDED."current",
        "role" = EXCLUDED."role",
        "company" = EXCLUDED."company",
        "summary" = EXCLUDED."summary",
        "bullets" = EXCLUDED."bullets",
        "stack" = EXCLUDED."stack",
        "status" = EXCLUDED."status",
        "updatedAt" = NOW()
    `,
  );
}

/**
 * Replaces project rows in one statement.
 * @example await replaceProjects(db, items) // void
 */
export async function replaceProjects(db: DbClient, rows: ProjectItem[]) {
  if (rows.length === 0) {
    await db.project.deleteMany();
    return;
  }
  const values = Prisma.join(
    rows.map(
      (item, i) =>
        Prisma.sql`(${item.id}::text, ${i}::int, ${item.name}::text, ${item.blurb}::text, ${item.tags}::text[], ${item.github}::text, ${item.demo}::text, ${publishStatusOf(item.status)}::text)`,
    ),
  );
  await upsertReplacing(
    db,
    Prisma.sql`
      WITH incoming AS (
        SELECT * FROM (VALUES ${values}) AS v(
          "id", "sortOrder", "name", "blurb", "tags", "github", "demo", "status"
        )
      ),
      removed AS (
        DELETE FROM "Project" AS e
        WHERE e."id" NOT IN (SELECT "id" FROM incoming)
      )
      INSERT INTO "Project" (
        "id", "sortOrder", "name", "blurb", "tags", "github", "demo", "status", "updatedAt"
      )
      SELECT "id", "sortOrder", "name", "blurb", "tags", "github", "demo", "status", NOW()
      FROM incoming
      ON CONFLICT ("id") DO UPDATE SET
        "sortOrder" = EXCLUDED."sortOrder",
        "name" = EXCLUDED."name",
        "blurb" = EXCLUDED."blurb",
        "tags" = EXCLUDED."tags",
        "github" = EXCLUDED."github",
        "demo" = EXCLUDED."demo",
        "status" = EXCLUDED."status",
        "updatedAt" = NOW()
    `,
  );
}

/**
 * Replaces memory rows in one statement.
 * @example await replaceMemories(db, items) // void
 */
export async function replaceMemories(db: DbClient, rows: MemoryItem[]) {
  if (rows.length === 0) {
    await db.memory.deleteMany();
    return;
  }
  const values = Prisma.join(
    rows.map(
      (item, i) =>
        Prisma.sql`(${item.id}::text, ${i}::int, ${item.title ?? ""}::text, ${item.note}::text, ${item.date ?? ""}::text, ${item.category ?? ""}::text, ${item.icon ?? ""}::text, ${item.photoUrl ?? ""}::text, ${item.color ?? ""}::text, ${publishStatusOf(item.status)}::text)`,
    ),
  );
  await upsertReplacing(
    db,
    Prisma.sql`
      WITH incoming AS (
        SELECT * FROM (VALUES ${values}) AS v(
          "id", "sortOrder", "title", "note", "date", "category", "icon", "photoUrl", "color", "status"
        )
      ),
      removed AS (
        DELETE FROM "Memory" AS e
        WHERE e."id" NOT IN (SELECT "id" FROM incoming)
      )
      INSERT INTO "Memory" (
        "id", "sortOrder", "title", "note", "date", "category", "icon", "photoUrl", "color", "status", "updatedAt"
      )
      SELECT
        "id", "sortOrder", "title", "note", "date", "category", "icon", "photoUrl", "color", "status", NOW()
      FROM incoming
      ON CONFLICT ("id") DO UPDATE SET
        "sortOrder" = EXCLUDED."sortOrder",
        "title" = EXCLUDED."title",
        "note" = EXCLUDED."note",
        "date" = EXCLUDED."date",
        "category" = EXCLUDED."category",
        "icon" = EXCLUDED."icon",
        "photoUrl" = EXCLUDED."photoUrl",
        "color" = EXCLUDED."color",
        "status" = EXCLUDED."status",
        "updatedAt" = NOW()
    `,
  );
}

/**
 * Replaces shelf ornament rows in one statement.
 * @example await replaceShelfArtifacts(db, items) // void
 */
export async function replaceShelfArtifacts(db: DbClient, rows: ShelfArtifactItem[]) {
  if (rows.length === 0) {
    await db.shelfArtifact.deleteMany();
    return;
  }
  const values = Prisma.join(
    rows.map(
      (item, i) =>
        Prisma.sql`(${item.id}::text, ${i}::int, ${item.name}::text, ${item.imageUrl}::text, ${item.widthRem}::float8, ${item.heightRem}::float8, ${item.enabled}::boolean, ${publishStatusOf(item.status)}::text)`,
    ),
  );
  await upsertReplacing(
    db,
    Prisma.sql`
      WITH incoming AS (
        SELECT * FROM (VALUES ${values}) AS v(
          "id", "sortOrder", "name", "imageUrl", "widthRem", "heightRem", "enabled", "status"
        )
      ),
      removed AS (
        DELETE FROM "ShelfArtifact" AS e
        WHERE e."id" NOT IN (SELECT "id" FROM incoming)
      )
      INSERT INTO "ShelfArtifact" (
        "id", "sortOrder", "name", "imageUrl", "widthRem", "heightRem", "enabled", "status",
        "xPercent", "yPercent", "mobileXPercent", "mobileYPercent", "mobileWidthRem", "mobileHeightRem",
        "updatedAt"
      )
      SELECT
        "id", "sortOrder", "name", "imageUrl", "widthRem", "heightRem", "enabled", "status",
        NULL, NULL, NULL, NULL, NULL, NULL,
        NOW()
      FROM incoming
      ON CONFLICT ("id") DO UPDATE SET
        "sortOrder" = EXCLUDED."sortOrder",
        "name" = EXCLUDED."name",
        "imageUrl" = EXCLUDED."imageUrl",
        "widthRem" = EXCLUDED."widthRem",
        "heightRem" = EXCLUDED."heightRem",
        "enabled" = EXCLUDED."enabled",
        "status" = EXCLUDED."status",
        "xPercent" = NULL,
        "yPercent" = NULL,
        "mobileXPercent" = NULL,
        "mobileYPercent" = NULL,
        "mobileWidthRem" = NULL,
        "mobileHeightRem" = NULL,
        "updatedAt" = NOW()
    `,
  );
}

type SkillWriteGroup = {
  id: string;
  kind: "skills" | "technologies";
  title: string;
  sortOrder: number;
  status: string;
  items: SkillGroup["items"];
};

/**
 * Replaces skill and technology groups in one statement.
 * Group ids are not part of the CMS document, so each save mints new ids.
 * @example await replaceSkillGroups(db, skills, technologies) // void
 */
export async function replaceSkillGroups(
  db: DbClient,
  skills: SkillGroup[],
  technologies: SkillGroup[],
) {
  const groups: SkillWriteGroup[] = [
    { kind: "skills" as const, groups: skills },
    { kind: "technologies" as const, groups: technologies },
  ].flatMap((bundle) =>
    bundle.groups.map((group, sortOrder) => ({
      id: crypto.randomUUID(),
      kind: bundle.kind,
      title: group.title,
      sortOrder,
      status: publishStatusOf(group.status),
      items: group.items,
    })),
  );
  if (groups.length === 0) {
    await db.skillGroup.deleteMany();
    return;
  }
  const groupValues = Prisma.join(
    groups.map(
      (group) =>
        Prisma.sql`(${group.id}::text, ${group.kind}::text, ${group.title}::text, ${group.sortOrder}::int, ${group.status}::text)`,
    ),
  );
  const items = groups.flatMap((group) =>
    group.items.map((item, sortOrder) => ({
      id: crypto.randomUUID(),
      groupId: group.id,
      sortOrder,
      name: item.name,
      icon: item.icon,
      color: item.color ?? null,
      iconUrl: item.iconUrl ?? null,
      status: publishStatusOf(item.status),
    })),
  );
  if (items.length === 0) {
    await upsertReplacing(
      db,
      Prisma.sql`
        WITH removed_items AS (
          DELETE FROM "SkillItem"
        ),
        removed_groups AS (
          DELETE FROM "SkillGroup"
        )
        INSERT INTO "SkillGroup" ("id", "kind", "title", "sortOrder", "status", "updatedAt")
        SELECT "id", "kind", "title", "sortOrder", "status", NOW()
        FROM (VALUES ${groupValues}) AS v("id", "kind", "title", "sortOrder", "status")
      `,
    );
    return;
  }
  const itemValues = Prisma.join(
    items.map(
      (item) =>
        Prisma.sql`(${item.id}::text, ${item.groupId}::text, ${item.sortOrder}::int, ${item.name}::text, ${item.icon}::text, ${item.color}::text, ${item.iconUrl}::text, ${item.status}::text)`,
    ),
  );
  await upsertReplacing(
    db,
    Prisma.sql`
      WITH removed_items AS (
        DELETE FROM "SkillItem"
      ),
      removed_groups AS (
        DELETE FROM "SkillGroup"
      ),
      inserted_groups AS (
        INSERT INTO "SkillGroup" ("id", "kind", "title", "sortOrder", "status", "updatedAt")
        SELECT "id", "kind", "title", "sortOrder", "status", NOW()
        FROM (VALUES ${groupValues}) AS v("id", "kind", "title", "sortOrder", "status")
        RETURNING "id"
      )
      INSERT INTO "SkillItem" ("id", "groupId", "sortOrder", "name", "icon", "color", "iconUrl", "status")
      SELECT "id", "groupId", "sortOrder", "name", "icon", "color", "iconUrl", "status"
      FROM (VALUES ${itemValues}) AS v(
        "id", "groupId", "sortOrder", "name", "icon", "color", "iconUrl", "status"
      )
      -- Reference the group insert so it runs in this statement, before the item rows.
      WHERE (SELECT COUNT(*) FROM inserted_groups) >= 0
    `,
  );
}

/**
 * Replaces craft groups in one statement. Requires the craft settings row to exist.
 * @example await replaceCraftGroups(db, groups) // void
 */
export async function replaceCraftGroups(db: DbClient, groupsIn: CraftGroup[]) {
  const groups = groupsIn.map((group, sortOrder) => ({
    id: crypto.randomUUID(),
    sortOrder,
    title: group.title,
    intro: group.intro,
    status: publishStatusOf(group.status),
    items: group.items,
  }));
  if (groups.length === 0) {
    await db.craftGroup.deleteMany();
    return;
  }
  const groupValues = Prisma.join(
    groups.map(
      (group) =>
        Prisma.sql`(${group.id}::text, ${SITE_ID}::text, ${group.sortOrder}::int, ${group.title}::text, ${group.intro}::text, ${group.status}::text)`,
    ),
  );
  const items = groups.flatMap((group) =>
    group.items.map((item, sortOrder) => ({
      id: crypto.randomUUID(),
      groupId: group.id,
      sortOrder,
      title: item.title,
      why: item.why,
      status: publishStatusOf(item.status),
    })),
  );
  if (items.length === 0) {
    await upsertReplacing(
      db,
      Prisma.sql`
        WITH removed_items AS (
          DELETE FROM "CraftItem"
        ),
        removed_groups AS (
          DELETE FROM "CraftGroup"
        )
        INSERT INTO "CraftGroup" ("id", "craftId", "sortOrder", "title", "intro", "status", "updatedAt")
        SELECT "id", "craftId", "sortOrder", "title", "intro", "status", NOW()
        FROM (VALUES ${groupValues}) AS v("id", "craftId", "sortOrder", "title", "intro", "status")
      `,
    );
    return;
  }
  const itemValues = Prisma.join(
    items.map(
      (item) =>
        Prisma.sql`(${item.id}::text, ${item.groupId}::text, ${item.sortOrder}::int, ${item.title}::text, ${item.why}::text, ${item.status}::text)`,
    ),
  );
  await upsertReplacing(
    db,
    Prisma.sql`
      WITH removed_items AS (
        DELETE FROM "CraftItem"
      ),
      removed_groups AS (
        DELETE FROM "CraftGroup"
      ),
      inserted_groups AS (
        INSERT INTO "CraftGroup" ("id", "craftId", "sortOrder", "title", "intro", "status", "updatedAt")
        SELECT "id", "craftId", "sortOrder", "title", "intro", "status", NOW()
        FROM (VALUES ${groupValues}) AS v("id", "craftId", "sortOrder", "title", "intro", "status")
        RETURNING "id"
      )
      INSERT INTO "CraftItem" ("id", "groupId", "sortOrder", "title", "why", "status")
      SELECT "id", "groupId", "sortOrder", "title", "why", "status"
      FROM (VALUES ${itemValues}) AS v("id", "groupId", "sortOrder", "title", "why", "status")
      -- Reference the group insert so it runs in this statement, before the item rows.
      WHERE (SELECT COUNT(*) FROM inserted_groups) >= 0
    `,
  );
}
