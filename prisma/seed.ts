import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parseContent, persistContent } from "../src/content/store";

const prisma = new PrismaClient();
const SITE_ID = "main";

/**
 * Seeds CMS tables from src/content/data.json (refuses prod/overwrite unless forced).
 * @example await main() // void
 */
async function main() {
  const isProd = process.env.NODE_ENV === "production";
  const allowProdSeed = process.env.ALLOW_PROD_SEED === "1";
  const forceSeed = process.env.FORCE_SEED === "1";

  if (isProd && !allowProdSeed) {
    console.error(
      "Refusing to seed: NODE_ENV=production.\n" +
        "This replaces all CMS content from data.json.\n" +
        "Set ALLOW_PROD_SEED=1 (and FORCE_SEED=1 if the DB is not empty) to override.",
    );
    process.exit(1);
  }

  const existing = await prisma.siteSettings.findUnique({
    where: { id: SITE_ID },
    select: { id: true },
  });
  if (existing && !forceSeed) {
    console.error(
      "Refusing to seed: site settings already exist (destructive replace).\n" +
        "Set FORCE_SEED=1 to overwrite all CMS tables from src/content/data.json.",
    );
    process.exit(1);
  }

  if (existing && forceSeed) {
    console.warn("FORCE_SEED=1 — replacing existing CMS content from data.json…");
  }

  const dataPath = path.join(process.cwd(), "src/content/data.json");
  const raw = await fs.readFile(dataPath, "utf8");
  const content = parseContent(JSON.parse(raw) as unknown);

  await prisma.$transaction(
    async (tx) => {
      await persistContent(tx, content);
    },
    { maxWait: 15_000, timeout: 60_000 },
  );

  const [projects, experience, memories, skillGroups, craftGroups] = await Promise.all([
    prisma.project.count(),
    prisma.experience.count(),
    prisma.memory.count(),
    prisma.skillGroup.count(),
    prisma.craftGroup.count(),
  ]);

  console.log(
    `Seeded normalized tables from src/content/data.json → projects=${projects}, experience=${experience}, memories=${memories}, skillGroups=${skillGroups}, craftGroups=${craftGroups}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
