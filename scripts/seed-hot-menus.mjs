#!/usr/bin/env node

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL doit être défini pour cibler Neon.");
    process.exit(1);
  }

  const { PrismaClient } = await import("@prisma/client");
  const { seedHotMenus } = require("./import-hot-menus.js");

  const prisma = new PrismaClient();
  const startedAt = Date.now();

  try {
    const summary = await seedHotMenus(prisma);
    const totalGroups = summary.groupsCreated + summary.groupsUpdated;
    console.log(
      `✅ Menus chauds synchronisés (${summary.totalMenus} menus, ${totalGroups} groupes ; ${summary.menusCreated} créations)`
    );

    for (const menu of summary.menuSummaries) {
      const euro = (menu.priceCents / 100).toFixed(2);
      console.log(` • ${menu.name} (${euro}€)`);
      for (const group of menu.groups) {
        const categories = group.categoryFilter
          .split("|")
          .map((entry) => entry.split("::")[0].trim())
          .filter(Boolean);
        const uniqueCategories = [...new Set(categories)];
        const optionsCount = await prisma.menuItem.count({
          where: { category: { in: uniqueCategories } },
        });
        console.log(
          `   - ${group.name} : catégories ${uniqueCategories.join(", ")} | min=${group.minChoices} max=${group.maxChoices} | options=${optionsCount}`
        );
      }
    }
  } catch (error) {
    console.error("❌ seed-hot-menus échoué :", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    const elapsed = Date.now() - startedAt;
    console.log(`⏱️  Terminé en ${elapsed} ms`);
  }
}

main();
