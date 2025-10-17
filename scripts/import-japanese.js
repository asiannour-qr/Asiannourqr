// scripts/import-japanese.js
// Ajoute toute la gamme japonaise comme MenuItem (prixCents=0, catégorie renseignée)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const C = (category, items) => ({ category, items });

const DATA = [
    C("Makis (6 pièces)", ["Thon", "Saumon", "Saumon avocat", "Concombre cheese", "Avocat cheese"]),
    C("Californias (6 pièces)", [
        "Thon avocat", "Thon cuit avocat", "Saumon avocat", "Poulet mayonnaise",
        "Saumon braisé", "Avocat cheese", "Concombre cheese"
    ]),
    C("Sushis (2 pièces)", ["Saumon", "Thon"]),
    C("Les originaux (6 pièces)", [
        "Cheese", "Saumon fumé mozzarella", "Poulet croustillant sauce cheese",
        "Saumon avocat menthe", "Crevettes tempura avocat épicé"
    ]),
    C("Crunchs (6 pièces)", [
        "Concombre cheese", "Thon cuit avocat", "Saumon fumé concombre boursin",
        "Crevette avocat boursin", "Poulet cheddar cheddar sauce curry"
    ]),
    C("Flocons (6 pièces)", [
        "Saumon cheese", "Poulet mayonnaise", "Avocat poulet", "Crevette avocat boursin"
    ]),
    C("Frits (6 pièces)", [
        "Thon cuit avocat", "Saumon cuit avocat", "Poulet avocat cheddar sauce curry"
    ]),
    C("Saumon Roll's (6 pièces)", [
        "Cheese", "Avocat cheese", "Concombre cheese", "Saumon fumé concombre boursin"
    ]),
    C("Printemps (6 pièces)", [
        "Concombre cheese", "Saumon avocat menthe", "Poulet avocat cheese", "Thon cuit avocat"
    ]),
    C("Avocat Roll's (6 pièces)", [
        "Cheese", "Boursin", "Saumon fumé", "Crevette tempura sauce épicée"
    ]),
    C("Menus Froids", ["Asian First", "Asian Avocado", "Asian Combo", "Asian Mix", "Asian Frits", "Asian Meli Melo"]),
    C("Asian Chirashis", ["Saumon", "Thon", "Saumon avocat", "Thon saumon"]),
    C("Asian Pokes", ["Saumon avocat", "Saumon avocat cheese", "Mangue cheese avocat", "Avocat concombre cheese thon"]),
    C("Asian Extras", ["Tom Yam", "Salade dynamite"]),
    C("Sashimis & Tatakis", ["Sashimi saumon", "Sashimi thon", "Tataki saumon", "Tataki thon"]),
    C("Boxes", ["36 pièces box 2 personnes", "54 pièces box 4 personnes"]),
    C("Boissons", ["Eau minérale 50cl", "Eau pétillante 50cl", "Soft drink"]),
    C("Desserts", ["Tiramisu maison", "Tarte tatin boule de glace", "Fondant chocolat crème anglaise", "Flocon nutella banane"]),
];

async function upsertItem(name, category) {
    const existing = await prisma.menuItem.findFirst({ where: { name, category } });
    if (existing) {
        await prisma.menuItem.update({
            where: { id: existing.id },
            data: { category, available: true }
        });
        return "upd";
    }
    await prisma.menuItem.create({
        data: { name, category, priceCents: 0, available: true, position: 0 }
    });
    return "new";
}

(async () => {
    try {
        let created = 0, updated = 0;
        for (const bloc of DATA) {
            for (const name of bloc.items) {
                const r = await upsertItem(name, bloc.category);
                if (r === "new") created++; else updated++;
            }
        }
        console.log(`✅ Japon importé. Créés: ${created}, mis à jour: ${updated}. Prix = 0 (à éditer dans /admin/menu).`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
})();
