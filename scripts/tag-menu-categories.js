// scripts/tag-menu-categories.js
// Re-catégorise les plats Starter / Silver / Gold + Entrées / Yakitoris / Accompagnements

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const IN = (s) => (name) => name.toLowerCase().includes(s.toLowerCase());

async function main() {
    let updates = 0;

    // Entrées
    updates += await tagExact([
        "3 Nems poulet", "3 Nems crevettes", "3 Crevettes tempura", "4 Gyoza légumes",
        "3 Crousty saumon", "6 Poulets dynamites"
    ], "Entrées");

    // Yakitoris
    updates += await tagExact([
        "Boeuf fromage", "Poulet", "Saumon", "Boulettes de boeuf", "Crousty fromage"
    ], "Yakitoris (2 pièces)");

    // Accompagnements
    updates += await tagExact(["Soupe miso", "Salade de choux", "Riz nature", "Riz vinaigré"], "Accompagnements");

    // Starter (7,90)
    updates += await tagExact([
        "Nouilles sautées légumes", "Kao pad thaï légumes", "Riz cantonnais"
    ], "Plats Starter");

    // Silver (9,90)
    updates += await tagByContains([
        IN("nouilles sautées poulet"), IN("nouilles sautées boeuf"), IN("nouilles sautées bœuf"),
        IN("nouilles sautées crevettes"),
        IN("kao pad thaï poulet"), IN("kao pad thai poulet"),
        IN("kao pad thaï boeuf"), IN("kao pad thai boeuf"),
        IN("kao pad thaï crevettes"), IN("kao pad thai crevettes"),
        IN("poulet croustillant")
    ], "Plats Silver");

    // Gold (12,90)
    updates += await tagByContains([
        IN("spicy"), IN("spicy peanuts poulet"),
        IN("bobun"), IN("udon"), IN("poulet curry"), IN("boeuf loc lac"),
        IN("pad thaï crousty"), IN("kao pad thaï crousty")
    ], "Plats Gold");

    console.log(`✅ Catégories mises à jour: ${updates} items modifiés`);
}

async function tagExact(names, category) {
    let n = 0;
    for (const name of names) {
        const it = await prisma.menuItem.findFirst({ where: { name } });
        if (it) { await prisma.menuItem.update({ where: { id: it.id }, data: { category } }); n++; }
    }
    return n;
}

async function tagByContains(matchers, category) {
    const all = await prisma.menuItem.findMany();
    let n = 0;
    for (const it of all) {
        if (matchers.some(fn => fn(it.name))) {
            await prisma.menuItem.update({ where: { id: it.id }, data: { category } });
            n++;
        }
    }
    return n;
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());