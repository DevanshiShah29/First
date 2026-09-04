import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parseContent, persistContent } from "../src/content/store";

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(process.cwd(), "src/content/data.json");
  const raw = await fs.readFile(dataPath, "utf8");
  const content = parseContent(JSON.parse(raw) as unknown);

  await prisma.$transaction(
    async (tx) => {
      await persistContent(tx, content);
    },
    { maxWait: 15_000, timeout: 60_000 },
  );

  const [projects, experience, memories, skillGroups] = await Promise.all([
    prisma.project.count(),
    prisma.experience.count(),
    prisma.memory.count(),
    prisma.skillGroup.count(),
  ]);

  console.log(
    `Seeded normalized tables from src/content/data.json → projects=${projects}, experience=${experience}, memories=${memories}, skillGroups=${skillGroups}`,
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
