// scripts/import-menu-grouped.js
// Import groupé depuis data/menu.grouped.json (format par familles)
// Lit MENU_FILE_PATH depuis .env (fallback: ./data/menu.grouped.json)

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function toCents(euros) {
    if (euros == null) return null;
    const n =
        typeof euros === "number"
            ? euros
            : Number(String(euros).replace(",", ".").trim());
    return Number.isFinite(n) ? Math.round(n * 100) : null;
}

function readJsonSafe(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier introuvable: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw || !raw.trim()) {
        throw new Error(`Le fichier est vide: ${filePath}`);
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        const preview = raw.slice(0, 120).replace(/\s+/g, " ");
        throw new Error(
            `JSON invalide (${filePath}): ${e.message}\nAperçu: ${preview}...`
        );
    }
}

async function main() {
    const fileFromEnv = process.env.MENU_FILE_PATH;
    const file = process.argv[2]
        ? path.resolve(process.argv[2])
        : path.resolve(process.cwd(), fileFromEnv || "data/menu.grouped.json");

    console.log("📄 Fichier menu:", file);

    const groups = readJsonSafe(file);
    if (!Array.isArray(groups)) {
        throw new Error("Le JSON racine doit être un tableau de groupes.");
    }

    let created = 0, updated = 0, skipped = 0;
    let groupOrder = 0;

    for (const group of groups) {
        const category = String(group.category || "Divers").trim();
        const defaultPriceCents = toCents(group.defaultPrice);
        const items = Array.isArray(group.items) ? group.items : [];
        const basePosition =
            typeof group.position === "number"
                ? Math.round(Number(group.position))
                : groupOrder++ * 1000;

        let pos = 1;
        for (const it of items) {
            let name, priceCents, available, position;
            let relativePos;

            if (typeof it === "string") {
                name = it.trim();
                priceCents = defaultPriceCents;
                available = true;
                relativePos = pos++;
                position = basePosition + relativePos;
            } else if (it && typeof it === "object") {
                name = String(it.name || "").trim();
                priceCents =
                    it.priceCents != null
                        ? Math.round(Number(it.priceCents))
                        : toCents(it.price != null ? it.price : group.defaultPrice);
                available = it.available != null ? Boolean(it.available) : true;
                if (typeof it.position === "number") {
                    relativePos = Math.round(Number(it.position));
                } else {
                    relativePos = pos++;
                }
                position = basePosition + relativePos;
            }

            if (!name) { skipped++; continue; }
            if (priceCents == null) {
                console.warn(`⚠️  Prix manquant pour "${name}" (cat. ${category}), ignoré.`);
                skipped++;
                continue;
            }

            const data = { name, priceCents, category, available, position };

            // ⚠️ PAS D'UNIQUE SUR name → on fait findFirst + create/update
            const existing = await prisma.menuItem.findFirst({ where: { name, category } });
            if (existing) {
                await prisma.menuItem.update({ where: { id: existing.id }, data });
                updated++;
            } else {
                await prisma.menuItem.create({ data });
                created++;
            }
        }
    }

    console.log(
        `✅ Import groupé terminé — créés: ${created}, mis à jour: ${updated}, ignorés: ${skipped}`
    );
}

main()
    .catch((e) => {
        console.error("❌ Import échoué:", e.message || e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
