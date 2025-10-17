// data/products.ts
// Carte ASIAN NOUR — structure produit pour l'appli
// Tous les prix sont en centimes d’euro.

type Variant = { id: string; name: string; price?: number };
type Item = { id: string; name: string; price?: number; variants?: Variant[]; description?: string };
type Category = { id: string; name: string; items: Item[] };

const categories: Category[] = [
  // =======================
  // CHAUD - ENTRÉES / YAKIS / ACCOMP.
  // =======================
  {
    id: "entrees",
    name: "ENTRÉES (5,50 €)",
    items: [
      { id: "ent-nems-poulet", name: "3 Nems poulets", price: 550 },
      { id: "ent-nems-crevettes", name: "3 Nems crevettes", price: 550 },
      { id: "ent-crevettes-tempura", name: "3 Crevettes tempura", price: 550 },
      { id: "ent-gyoza-legumes", name: "4 Gyoza légumes", price: 550 },
      { id: "ent-croustys-saumon", name: "3 Croustys saumon", price: 550 },
      { id: "ent-poulets-dynamites", name: "6 Poulets dynamites", price: 550 },
    ],
  },
  {
    id: "yakitoris",
    name: "YAKITORIS (2 pièces) (5,50 €)",
    items: [
      { id: "yak-boeuf-fromage", name: "Bœuf Fromage", price: 550 },
      { id: "yak-poulet", name: "Poulet", price: 550 },
      { id: "yak-saumon", name: "Saumon", price: 550 },
      { id: "yak-boulettes-boeuf", name: "Boulettes de bœuf", price: 550 },
      { id: "yak-crousty-fromage", name: "Crousty fromage", price: 550 },
    ],
  },
  {
    id: "accompagnements",
    name: "ACCOMPAGNEMENTS",
    items: [
      { id: "acc-soupe-miso", name: "Soupe miso", price: 350 },
      { id: "acc-salade-choux", name: "Salade de choux", price: 350 },
      { id: "acc-riz-nature", name: "Riz nature", price: 350 },
      { id: "acc-riz-vinaigre", name: "Riz vinaigré", price: 350 },
    ],
  },

  // =======================
  // CHAUD - PLATS
  // =======================
  {
    id: "plats-starter",
    name: "PLATS STARTER (7,90 €)",
    items: [
      { id: "starter-nouilles-legumes", name: "NOUILLES SAUTÉES LÉGUMES", price: 790 },
      { id: "starter-kao-pad-legumes", name: "KAO PAD THAÏ LÉGUMES", price: 790 },
      { id: "starter-riz-cantonais", name: "RIZ CANTONNAIS", price: 790 },
    ],
  },
  {
    id: "plats-silver",
    name: "PLATS SILVER (9,90 €)",
    items: [
      {
        id: "silver-nouilles-sautees",
        name: "NOUILLES SAUTÉES",
        variants: [
          { id: "silver-nouilles-poulet", name: "Poulet", price: 990 },
          { id: "silver-nouilles-boeuf", name: "Bœuf", price: 990 },
          { id: "silver-nouilles-crevettes", name: "Crevettes", price: 990 },
        ],
      },
      {
        id: "silver-kao-pad-thai",
        name: "KAO PAD THAÏ",
        variants: [
          { id: "silver-kpthai-poulet", name: "Poulet", price: 990 },
          { id: "silver-kpthai-boeuf", name: "Bœuf", price: 990 },
          { id: "silver-kpthai-crevettes", name: "Crevettes", price: 990 },
        ],
      },
      { id: "silver-poulet-croustillant", name: "POULET CROUSTILLANT (servi avec riz nature)", price: 990 },
    ],
  },
  {
    id: "plats-gold",
    name: "PLATS GOLD (12,90 €)",
    items: [
      {
        id: "gold-spicy",
        name: "SPICY",
        variants: [
          { id: "gold-spicy-poulet", name: "Poulet", price: 1290 },
          { id: "gold-spicy-boeuf", name: "Bœuf", price: 1290 },
          { id: "gold-spicy-crevettes", name: "Crevettes", price: 1290 },
        ],
      },
      {
        id: "gold-bobun",
        name: "BOBUN",
        variants: [
          { id: "gold-bobun-poulet", name: "Poulet", price: 1290 },
          { id: "gold-bobun-boeuf", name: "Bœuf", price: 1290 },
          { id: "gold-bobun-crevettes", name: "Crevettes", price: 1290 },
        ],
      },
      {
        id: "gold-udon",
        name: "UDON",
        variants: [
          { id: "gold-udon-poulet", name: "Poulet", price: 1290 },
          { id: "gold-udon-boeuf", name: "Bœuf", price: 1290 },
          { id: "gold-udon-crevettes", name: "Crevettes", price: 1290 },
        ],
      },
      { id: "gold-spicy-peanuts-poulet", name: "SPICY PEANUTS POULET", price: 1290 },
      { id: "gold-poulet-curry", name: "POULET CURRY", price: 1290 },
      { id: "gold-boeuf-loc-lac", name: "BŒUF LOC LAC", price: 1290 },
      {
        id: "gold-pad-thai-crousty",
        name: "PAD THAÏ CROUSTY ENTRÉES",
        description: "Nouilles plates, demi poulet croustillant, soja, cacahuète, ciboulette, citron",
        price: 1290,
      },
      {
        id: "gold-kao-pad-thai-crousty",
        name: "KAO PAD THAÏ CROUSTY",
        description: "Riz thaï, demi poulet croustillant, soja, cacahuète, ciboulette, citron",
        price: 1290,
      },
    ],
  },

  // =======================
  // FROID - SUSHI / ROLLS / etc.
  // =======================
  {
    id: "makis",
    name: "MAKIS",
    items: [
      { id: "maki-thon", name: "Thon", price: 510 },
      { id: "maki-saumon", name: "Saumon", price: 500 },
      { id: "maki-saumon-avocat", name: "Saumon Avocat", price: 520 },
      { id: "maki-concombre-cheese", name: "Concombre cheese", price: 480 },
      { id: "maki-avocat-cheese", name: "Avocat Cheese", price: 490 },
    ],
  },
  {
    id: "flocons",
    name: "FLOCONS",
    items: [
      { id: "floc-saumon-cheese", name: "Saumon cheese", price: 490 },
      { id: "floc-poulet-mayo", name: "Poulet mayonnaise", price: 570 },
      { id: "floc-thon-cuit-avocat", name: "Thon cuit avocat", price: 500 },
      { id: "floc-avocat-cheese", name: "Avocat Cheese", price: 440 },
      { id: "floc-crevettes-avocat-boursin", name: "Crevettes avocat Boursin", price: 560 },
    ],
  },
  {
    id: "crunch",
    name: "CRUNCH",
    items: [
      { id: "crunch-concombre-cheese", name: "Concombre cheese", price: 530 },
      { id: "crunch-thon-cuit-avocat", name: "Thon cuit avocat", price: 560 },
      { id: "crunch-crevettes-tempura", name: "Crevettes tempura", price: 630 },
      { id: "crunch-saumon-fume-boursin", name: "Saumon fumé Boursin", price: 570 },
      { id: "crunch-poulet-boursin", name: "Poulet Boursin", price: 640 },
    ],
  },
  {
    id: "saumon-rolls",
    name: "SAUMON ROLL’S",
    items: [
      { id: "sroll-cheese", name: "Cheese", price: 650 },
      { id: "sroll-avocat-cheese", name: "Avocat cheese", price: 680 },
      { id: "sroll-concombre-cheese", name: "Concombre Cheese", price: 670 },
      { id: "sroll-thon-cuit-avocat", name: "Thon cuit avocat", price: 690 },
      { id: "sroll-saumon-fume-concombre-boursin", name: "Saumon fumé concombre Boursin", price: 690 },
      { id: "sroll-braise-tempura-avocat", name: "Braisé Tempura avocat", price: 700 },
      { id: "sroll-braise-avocat-cheese-shichimi", name: "Braisé avocat cheese shichimi", price: 700 },
    ],
  },
  {
    id: "frits",
    name: "FRITS",
    items: [
      { id: "frit-saumon", name: "Saumon", price: 680 },
      { id: "frit-thon-cuit-avocat", name: "Thon cuit avocat", price: 700 },
      { id: "frit-avocat-cheese-miel", name: "Avocat Cheese miel", price: 700 },
      { id: "frit-saumon-avocado-boursin", name: "Saumon avocado Boursin", price: 730 },
      { id: "frit-poulet-avocat-cheddar-curry", name: "Poulet avocat cheddar sauce curry", price: 790 },
    ],
  },
  {
    id: "californias",
    name: "CALIFORNIAS",
    items: [
      { id: "cali-saumon-avocat", name: "Saumon avocat", price: 540 },
      { id: "cali-thon-cuit-avocat", name: "Thon cuit avocat", price: 540 },
      { id: "cali-concombre-cheese", name: "Concombre cheese", price: 520 },
      { id: "cali-saumon-fume-cheese", name: "Saumon fumé cheese", price: 560 },
      { id: "cali-poulet-mayonnaise", name: "Poulet Mayonnaise", price: 600 },
    ],
  },
  {
    id: "sushis",
    name: "SUSHIS (à la pièce)",
    items: [
      { id: "sushi-saumon", name: "Saumon", price: 400 },
      { id: "sushi-saumon-avocat", name: "Saumon Avocat", price: 420 },
      { id: "sushi-thon", name: "Thon", price: 440 },
      { id: "sushi-saumon-braise", name: "Saumon Braisé", price: 440 },
    ],
  },
  {
    id: "originaux",
    name: "Les Originaux",
    items: [
      { id: "ori-chevres", name: "Chèvres (chèvre frais, miel, roquette, noix concassées)", price: 720 },
      { id: "ori-mangos", name: "Mangos (crevettes tempura, mangue, sauce épicée, sésame)", price: 720 },
      { id: "ori-latinos", name: "Latinos (poulet mariné, cheddar, poivrons, oignons frits, sauce piquante)", price: 720 },
      { id: "ori-cesars", name: "Césars (poulet marinés, roquette, sauce césar, parmesan, pavot)", price: 720 },
      { id: "ori-futomaki", name: "Futomaki (saumon, avocat, cheese, sauce sucrée)", price: 720 },
    ],
  },
  {
    id: "printemps",
    name: "PRINTEMPS",
    items: [
      { id: "pri-concombre-cheese", name: "Concombre cheese", price: 590 },
      { id: "pri-thon-cuit-avocat", name: "Thon cuit avocat", price: 600 },
      { id: "pri-saumon-avocat-menthe", name: "Saumon Avocat menthe", price: 610 },
      { id: "pri-saumon-fume-avocat-boursin", name: "Saumon fumé avocat Boursin", price: 730 },
      { id: "pri-poulet-chevre-frais", name: "Poulet chèvre frais", price: 620 },
    ],
  },
  {
    id: "avocat-rolls",
    name: "AVOCAT ROLL’S",
    items: [
      { id: "ar-cheese", name: "Cheese", price: 640 },
      { id: "ar-burrata", name: "Burrata", price: 720 },
      { id: "ar-saumon-fume-cheese", name: "Saumon fumé cheese", price: 720 },
      { id: "ar-saumon-concombre-mayo", name: "Saumon concombre mayonnaise", price: 680 },
      { id: "ar-crevette-tempura-epice", name: "Crevette tempura sauce épicée", price: 780 },
    ],
  },

  // =======================
  // MENUS FROIDS (sets)
  // =======================
  {
    id: "menus-froids",
    name: "MENUS FROIDS",
    items: [
      { id: "mf-asian-first-1290", name: "ASIAN FIRST : 6 Californias saumon avocat + 3 Sushis Saumon + 1 Boisson", price: 1290 },
      { id: "mf-asian-combo-1590", name: "ASIAN COMBO : 6 Crunch thon cuit avocat + 6 Avocat roll’s Burrata + 6 Frits Avocat cheese miel + 1 Boisson", price: 1590 },
      { id: "mf-asian-meli-1890", name: "ASIAN MÉLI MÉLO : 6 Saumon roll’s cheese + 6 California saumon avocat + 6 Printemps thon cuit avocat + 1 Boisson", price: 1890 },
      { id: "mf-asian-avocado-1990", name: "ASIAN AVOCADO : 6 Crunch thon cuit avocat + 6 Avocat roll’s Burrata + 6 Frits Avocat cheese miel + 1 Boisson", price: 1990 },
      { id: "mf-asian-mix-2190", name: "ASIAN MIX : 6 California saumon avocat + 6 Saumon roll’s cheese + 2 Yakitoris Bœuf fromage + 1 Yakitori Boulettes de bœuf + 1 Yakitori poulet + 1 Boisson", price: 2190 },
      { id: "mf-asian-first-2290", name: "ASIAN FIRST : 6 Frits avocat cheese miel + 6 Frits saumon avocat Boursin + 6 Frits poulet avocat cheddar sauce curry + 1 Boisson", price: 2290 },
    ],
  },
  {
    id: "chirachis",
    name: "ASIAN CHIRACHIS",
    items: [
      { id: "ch-saumon", name: "Chirachi saumon", price: 1590 },
      { id: "ch-thon-saumon", name: "Chirachi Thon Saumon", price: 1690 },
      { id: "ch-thon", name: "Chirachi Thon", price: 1590 },
      { id: "ch-saumon-avocat", name: "Chirachi Saumon Avocat", price: 1690 },
    ],
  },
  {
    id: "pokes",
    name: "ASIAN POKES",
    items: [
      { id: "poke-saumon-avocat-mangue", name: "Poke Saumon, Avocat, mangue, cheese, concombre", price: 1690 },
      { id: "poke-tempura-kid", name: "Poke 3 tempura crevettes, avocat, roquette, chèvre frais", price: 1690 },
    ],
  },
  {
    id: "extras",
    name: "ASIAN EXTRA",
    items: [
      { id: "extra-salade-dynamite", name: "Salade dynamite (Poulet dynamite, salade, tomate, carottes, concombres, oignons, soja)", price: 890 },
    ],
  },

  // =======================
  // SASHIMIS & TATAKIS (variantes)
  // =======================
  {
    id: "sashimi-tataki",
    name: "SASHIMIS ET TATAKIS",
    items: [
      {
        id: "sashimi-saumon",
        name: "Sashimi Saumon",
        variants: [
          { id: "sashimi-saumon-5", name: "5 pcs", price: 670 },
          { id: "sashimi-saumon-12", name: "12 pcs", price: 1210 },
        ],
      },
      {
        id: "sashimi-thon",
        name: "Sashimi Thon",
        variants: [
          { id: "sashimi-thon-5", name: "5 pcs", price: 710 },
          { id: "sashimi-thon-12", name: "12 pcs", price: 1310 },
        ],
      },
      {
        id: "tataki-saumon",
        name: "Tatakis Saumon",
        variants: [
          { id: "tataki-saumon-5", name: "5 pcs", price: 710 },
          { id: "tataki-saumon-12", name: "12 pcs", price: 1270 },
        ],
      },
      {
        id: "tataki-thon",
        name: "Tatakis Thon",
        variants: [
          { id: "tataki-thon-5", name: "5 pcs", price: 770 },
          { id: "tataki-thon-12", name: "12 pcs", price: 1370 },
        ],
      },
    ],
  },

  // =======================
  // BOX
  // =======================
  {
    id: "box",
    name: "BOX",
    items: [
      { id: "box-36p", name: "36 PIÈCES BOX 2 PERSONNES", price: 3890, description: "6 makis saumon, 4 sushis saumon, 2 sushis thon, 6 flocons saumon cheese, 6 crunch thon cuit avocat, 6 saumon roll’s cheese, 6 californias poulet mayonnaise" },
      { id: "box-54p", name: "54 PIÈCES BOX 4 PERSONNES", price: 5990, description: "6 sushis saumon, 4 sushis thon, 2 sushis saumon avocat, 6 flocons avocat cheese, 6 saumon Roll’s cheese, 6 Californias thon cuit avocat, 6 Crunch saumon fumé Boursin, 6 printemps saumon avocat menthe, 6 Makis concombre cheese, 6 frits avocat cheese miel" },
    ],
  },

  // =======================
  // DESSERTS
  // =======================
  {
    id: "desserts",
    name: "DESSERTS",
    items: [
      { id: "des-tiramisu", name: "Tiramisu fait maison", price: 470 },
      { id: "des-tarte-tatin", name: "Tarte Tatin avec boule de glace vanille", price: 450 },
      { id: "des-fondant-choco", name: "Fondant au chocolat et sa crème Anglaise", price: 450 },
      // Prix non précisé dans la carte fournie → laissé vide (s'affichera “—”)
      { id: "des-flocons-nutella", name: "Flocons Nutella banane (Riz sucré au lait de coco)" },
    ],
  },
];

const menu = { categories };

export default menu;
export type { Category, Item, Variant };