// Base générique d'aliments courants — valeurs pour 100g
// piece_weight_g : poids en grammes d'une unité (oeuf, banane, tranche...)

export type GenericFood = {
  key: string;           // identifiant unique stable
  nom: string;           // nom affiché
  keywords: string[];    // mots-clés normalisés (minuscules, sans accents)
  calories_100g: number;
  proteines_100g: number;
  glucides_100g: number;
  lipides_100g: number;
  piece_weight_g?: number; // poids d'une pièce en g
  piece_label?: string;    // "oeuf", "banane", "tranche"...
};

export const GENERIC_FOODS: GenericFood[] = [
  // ─── Féculents ────────────────────────────────────────────────────────────
  {
    key: "riz-blanc",
    nom: "Riz blanc cuit",
    keywords: ["riz", "riz blanc", "riz cuit", "riz basmati"],
    calories_100g: 130, proteines_100g: 2.7, glucides_100g: 28, lipides_100g: 0.3,
  },
  {
    key: "riz-complet",
    nom: "Riz complet cuit",
    keywords: ["riz complet", "riz brun"],
    calories_100g: 123, proteines_100g: 2.6, glucides_100g: 25.6, lipides_100g: 1,
  },
  {
    key: "pates",
    nom: "Pâtes cuites",
    keywords: ["pates", "pâtes", "spaghetti", "tagliatelle", "fusilli", "penne", "linguine", "macaroni"],
    calories_100g: 131, proteines_100g: 5, glucides_100g: 25, lipides_100g: 1.1,
  },
  {
    key: "pain-blanc",
    nom: "Pain blanc",
    keywords: ["pain", "pain blanc", "baguette", "demi-baguette"],
    calories_100g: 265, proteines_100g: 9, glucides_100g: 49, lipides_100g: 3.2,
    piece_weight_g: 30, piece_label: "tranche",
  },
  {
    key: "pain-complet",
    nom: "Pain complet",
    keywords: ["pain complet", "pain integral", "pain de seigle"],
    calories_100g: 247, proteines_100g: 13, glucides_100g: 41, lipides_100g: 3.4,
    piece_weight_g: 30, piece_label: "tranche",
  },
  {
    key: "pain-de-mie",
    nom: "Pain de mie",
    keywords: ["pain de mie", "toast", "pain mie"],
    calories_100g: 267, proteines_100g: 8, glucides_100g: 49, lipides_100g: 4,
    piece_weight_g: 30, piece_label: "tranche",
  },
  {
    key: "semoule",
    nom: "Semoule cuite",
    keywords: ["semoule", "couscous"],
    calories_100g: 178, proteines_100g: 6.5, glucides_100g: 36, lipides_100g: 0.3,
  },
  {
    key: "quinoa",
    nom: "Quinoa cuit",
    keywords: ["quinoa"],
    calories_100g: 120, proteines_100g: 4.4, glucides_100g: 21.3, lipides_100g: 1.9,
  },
  {
    key: "pomme-de-terre",
    nom: "Pomme de terre cuite",
    keywords: ["pomme de terre", "pommes de terre", "patate", "patates"],
    calories_100g: 87, proteines_100g: 1.9, glucides_100g: 20, lipides_100g: 0.1,
    piece_weight_g: 150, piece_label: "pomme de terre",
  },
  {
    key: "patate-douce",
    nom: "Patate douce cuite",
    keywords: ["patate douce", "sweet potato"],
    calories_100g: 90, proteines_100g: 2, glucides_100g: 20.7, lipides_100g: 0.1,
  },
  {
    key: "boulgour",
    nom: "Boulgour cuit",
    keywords: ["boulgour", "bulgur", "bulgour"],
    calories_100g: 83, proteines_100g: 3.1, glucides_100g: 18.6, lipides_100g: 0.2,
  },
  {
    key: "lentilles",
    nom: "Lentilles cuites",
    keywords: ["lentille", "lentilles"],
    calories_100g: 116, proteines_100g: 9, glucides_100g: 20, lipides_100g: 0.4,
  },
  {
    key: "pois-chiches",
    nom: "Pois chiches cuits",
    keywords: ["pois chiche", "pois chiches", "pois-chiches"],
    calories_100g: 164, proteines_100g: 8.9, glucides_100g: 27.4, lipides_100g: 2.6,
  },
  {
    key: "haricots-rouges",
    nom: "Haricots rouges cuits",
    keywords: ["haricot rouge", "haricots rouges"],
    calories_100g: 127, proteines_100g: 8.7, glucides_100g: 22.8, lipides_100g: 0.5,
  },

  // ─── Protéines ────────────────────────────────────────────────────────────
  {
    key: "oeuf",
    nom: "Œuf entier",
    keywords: ["oeuf", "oeufs", "oeuf entier", "oeufs entiers"],
    calories_100g: 155, proteines_100g: 13, glucides_100g: 1.1, lipides_100g: 11,
    piece_weight_g: 55, piece_label: "oeuf",
  },
  {
    key: "blanc-oeuf",
    nom: "Blanc d'œuf",
    keywords: ["blanc oeuf", "blanc d oeuf", "blancs oeufs", "blanc de oeuf"],
    calories_100g: 52, proteines_100g: 11, glucides_100g: 0.7, lipides_100g: 0.2,
    piece_weight_g: 30, piece_label: "blanc d'oeuf",
  },
  {
    key: "poulet",
    nom: "Blanc de poulet",
    keywords: ["poulet", "blanc poulet", "filet poulet", "escalope poulet", "blanc de poulet", "filet de poulet"],
    calories_100g: 165, proteines_100g: 31, glucides_100g: 0, lipides_100g: 3.6,
  },
  {
    key: "dinde",
    nom: "Dinde",
    keywords: ["dinde", "escalope dinde", "filet dinde"],
    calories_100g: 135, proteines_100g: 30, glucides_100g: 0, lipides_100g: 1,
  },
  {
    key: "boeuf-5",
    nom: "Bœuf haché 5%",
    keywords: ["boeuf", "bœuf", "steak", "viande hachee", "viande hachée", "hachis", "steak hache", "steak haché"],
    calories_100g: 137, proteines_100g: 22, glucides_100g: 0, lipides_100g: 5,
  },
  {
    key: "saumon",
    nom: "Saumon",
    keywords: ["saumon"],
    calories_100g: 208, proteines_100g: 20, glucides_100g: 0, lipides_100g: 13,
  },
  {
    key: "thon",
    nom: "Thon en boîte",
    keywords: ["thon", "thon en boite", "thon en boîte"],
    calories_100g: 116, proteines_100g: 25.5, glucides_100g: 0, lipides_100g: 1,
  },
  {
    key: "maquereau",
    nom: "Maquereau",
    keywords: ["maquereau"],
    calories_100g: 205, proteines_100g: 18.6, glucides_100g: 0, lipides_100g: 13.9,
  },
  {
    key: "crevettes",
    nom: "Crevettes cuites",
    keywords: ["crevette", "crevettes"],
    calories_100g: 99, proteines_100g: 24, glucides_100g: 0.2, lipides_100g: 0.3,
  },
  {
    key: "tofu-ferme",
    nom: "Tofu ferme",
    keywords: ["tofu", "tofu ferme"],
    calories_100g: 144, proteines_100g: 17, glucides_100g: 3, lipides_100g: 8.7,
  },
  {
    key: "tofu-soyeux",
    nom: "Tofu soyeux",
    keywords: ["tofu soyeux", "silken tofu"],
    calories_100g: 55, proteines_100g: 5, glucides_100g: 2.4, lipides_100g: 2.7,
  },
  {
    key: "tempeh",
    nom: "Tempeh",
    keywords: ["tempeh"],
    calories_100g: 192, proteines_100g: 20, glucides_100g: 7.6, lipides_100g: 11,
  },
  {
    key: "seitan",
    nom: "Seitan",
    keywords: ["seitan", "gluten de ble", "gluten de blé"],
    calories_100g: 370, proteines_100g: 75, glucides_100g: 14, lipides_100g: 1.9,
  },
  {
    key: "jambon",
    nom: "Jambon blanc",
    keywords: ["jambon", "jambon blanc", "jambon cuit"],
    calories_100g: 115, proteines_100g: 21, glucides_100g: 1, lipides_100g: 3,
    piece_weight_g: 40, piece_label: "tranche",
  },

  // ─── Produits laitiers ────────────────────────────────────────────────────
  {
    key: "lait-demi",
    nom: "Lait demi-écrémé",
    keywords: ["lait", "lait demi ecreme", "lait demi écrémé", "lait demi-ecreme"],
    calories_100g: 46, proteines_100g: 3.2, glucides_100g: 4.8, lipides_100g: 1.6,
    piece_weight_g: 250, piece_label: "verre",
  },
  {
    key: "lait-entier",
    nom: "Lait entier",
    keywords: ["lait entier"],
    calories_100g: 63, proteines_100g: 3.2, glucides_100g: 4.8, lipides_100g: 3.5,
  },
  {
    key: "yaourt",
    nom: "Yaourt nature",
    keywords: ["yaourt", "yogurt", "yaourt nature", "yoghurt"],
    calories_100g: 61, proteines_100g: 3.5, glucides_100g: 4.7, lipides_100g: 3.3,
    piece_weight_g: 125, piece_label: "yaourt",
  },
  {
    key: "fromage-blanc-0",
    nom: "Fromage blanc 0%",
    keywords: ["fromage blanc", "faisselle", "fromage blanc 0", "fromage blanc 0%"],
    calories_100g: 48, proteines_100g: 8, glucides_100g: 4, lipides_100g: 0.2,
    piece_weight_g: 100, piece_label: "pot",
  },
  {
    key: "fromage-blanc-20",
    nom: "Fromage blanc 20%",
    keywords: ["fromage blanc 20", "fromage blanc 20%"],
    calories_100g: 79, proteines_100g: 7.4, glucides_100g: 3.8, lipides_100g: 3.5,
  },
  {
    key: "comte",
    nom: "Comté",
    keywords: ["comte", "comté"],
    calories_100g: 418, proteines_100g: 27, glucides_100g: 0, lipides_100g: 34,
    piece_weight_g: 30, piece_label: "portion",
  },
  {
    key: "emmental",
    nom: "Emmental",
    keywords: ["emmental", "gruyere", "gruyère", "cheddar"],
    calories_100g: 380, proteines_100g: 28, glucides_100g: 0, lipides_100g: 29,
    piece_weight_g: 30, piece_label: "portion",
  },
  {
    key: "mozzarella",
    nom: "Mozzarella",
    keywords: ["mozzarella"],
    calories_100g: 280, proteines_100g: 22, glucides_100g: 2.2, lipides_100g: 20,
  },
  {
    key: "parmesan",
    nom: "Parmesan",
    keywords: ["parmesan"],
    calories_100g: 431, proteines_100g: 38, glucides_100g: 4, lipides_100g: 29,
  },
  {
    key: "beurre",
    nom: "Beurre",
    keywords: ["beurre"],
    calories_100g: 717, proteines_100g: 0.9, glucides_100g: 0.1, lipides_100g: 81,
    piece_weight_g: 10, piece_label: "noix",
  },
  {
    key: "creme-fraiche",
    nom: "Crème fraîche 30%",
    keywords: ["creme fraiche", "crème fraîche", "creme"],
    calories_100g: 292, proteines_100g: 2.4, glucides_100g: 3.5, lipides_100g: 30,
  },

  // ─── Légumes ──────────────────────────────────────────────────────────────
  {
    key: "haricots-verts",
    nom: "Haricots verts",
    keywords: ["haricot vert", "haricots verts"],
    calories_100g: 31, proteines_100g: 1.8, glucides_100g: 7, lipides_100g: 0.1,
  },
  {
    key: "brocoli",
    nom: "Brocoli",
    keywords: ["brocoli", "broccoli"],
    calories_100g: 34, proteines_100g: 2.8, glucides_100g: 7, lipides_100g: 0.4,
  },
  {
    key: "courgette",
    nom: "Courgette",
    keywords: ["courgette", "zucchini"],
    calories_100g: 17, proteines_100g: 1.2, glucides_100g: 3.1, lipides_100g: 0.3,
  },
  {
    key: "tomate",
    nom: "Tomate",
    keywords: ["tomate", "tomates"],
    calories_100g: 18, proteines_100g: 0.9, glucides_100g: 3.9, lipides_100g: 0.2,
    piece_weight_g: 120, piece_label: "tomate",
  },
  {
    key: "carotte",
    nom: "Carotte",
    keywords: ["carotte", "carottes"],
    calories_100g: 41, proteines_100g: 0.9, glucides_100g: 10, lipides_100g: 0.2,
    piece_weight_g: 80, piece_label: "carotte",
  },
  {
    key: "epinards",
    nom: "Épinards",
    keywords: ["epinard", "epinards", "épinard", "épinards"],
    calories_100g: 23, proteines_100g: 2.9, glucides_100g: 3.6, lipides_100g: 0.4,
  },
  {
    key: "poivron",
    nom: "Poivron",
    keywords: ["poivron", "poivrons"],
    calories_100g: 31, proteines_100g: 1, glucides_100g: 6, lipides_100g: 0.3,
  },
  {
    key: "concombre",
    nom: "Concombre",
    keywords: ["concombre"],
    calories_100g: 15, proteines_100g: 0.7, glucides_100g: 3.6, lipides_100g: 0.1,
  },
  {
    key: "salade",
    nom: "Salade verte",
    keywords: ["salade", "laitue", "roquette", "mache", "mâche"],
    calories_100g: 15, proteines_100g: 1.4, glucides_100g: 2.9, lipides_100g: 0.2,
  },
  {
    key: "champignons",
    nom: "Champignons de Paris",
    keywords: ["champignon", "champignons"],
    calories_100g: 22, proteines_100g: 3.1, glucides_100g: 3.3, lipides_100g: 0.3,
  },
  {
    key: "aubergine",
    nom: "Aubergine",
    keywords: ["aubergine"],
    calories_100g: 25, proteines_100g: 1, glucides_100g: 6, lipides_100g: 0.2,
  },
  {
    key: "chou-fleur",
    nom: "Chou-fleur",
    keywords: ["chou fleur", "chou-fleur", "choufleur"],
    calories_100g: 25, proteines_100g: 2, glucides_100g: 5, lipides_100g: 0.3,
  },
  {
    key: "oignon",
    nom: "Oignon",
    keywords: ["oignon", "oignons"],
    calories_100g: 40, proteines_100g: 1.1, glucides_100g: 9.3, lipides_100g: 0.1,
    piece_weight_g: 80, piece_label: "oignon",
  },
  {
    key: "petits-pois",
    nom: "Petits pois",
    keywords: ["petits pois", "petit pois"],
    calories_100g: 81, proteines_100g: 5.4, glucides_100g: 14.5, lipides_100g: 0.4,
  },
  {
    key: "avocat",
    nom: "Avocat",
    keywords: ["avocat"],
    calories_100g: 160, proteines_100g: 2, glucides_100g: 8.5, lipides_100g: 14.7,
    piece_weight_g: 150, piece_label: "avocat",
  },
  {
    key: "mais",
    nom: "Maïs",
    keywords: ["mais", "maïs", "maïs en boite", "mais en boite"],
    calories_100g: 86, proteines_100g: 3.3, glucides_100g: 19, lipides_100g: 1.2,
  },

  // ─── Fruits ───────────────────────────────────────────────────────────────
  {
    key: "banane",
    nom: "Banane",
    keywords: ["banane", "bananes"],
    calories_100g: 89, proteines_100g: 1.1, glucides_100g: 23, lipides_100g: 0.3,
    piece_weight_g: 120, piece_label: "banane",
  },
  {
    key: "pomme",
    nom: "Pomme",
    keywords: ["pomme", "pommes"],
    calories_100g: 52, proteines_100g: 0.3, glucides_100g: 14, lipides_100g: 0.2,
    piece_weight_g: 150, piece_label: "pomme",
  },
  {
    key: "orange",
    nom: "Orange",
    keywords: ["orange", "oranges"],
    calories_100g: 47, proteines_100g: 0.9, glucides_100g: 12, lipides_100g: 0.1,
    piece_weight_g: 150, piece_label: "orange",
  },
  {
    key: "fraises",
    nom: "Fraises",
    keywords: ["fraise", "fraises"],
    calories_100g: 32, proteines_100g: 0.7, glucides_100g: 7.7, lipides_100g: 0.3,
  },
  {
    key: "myrtilles",
    nom: "Myrtilles",
    keywords: ["myrtille", "myrtilles", "blueberry"],
    calories_100g: 57, proteines_100g: 0.7, glucides_100g: 14.5, lipides_100g: 0.3,
  },
  {
    key: "raisin",
    nom: "Raisin",
    keywords: ["raisin", "raisins"],
    calories_100g: 69, proteines_100g: 0.7, glucides_100g: 18, lipides_100g: 0.2,
  },
  {
    key: "kiwi",
    nom: "Kiwi",
    keywords: ["kiwi", "kiwis"],
    calories_100g: 61, proteines_100g: 1.1, glucides_100g: 15, lipides_100g: 0.5,
    piece_weight_g: 80, piece_label: "kiwi",
  },
  {
    key: "mangue",
    nom: "Mangue",
    keywords: ["mangue"],
    calories_100g: 60, proteines_100g: 0.8, glucides_100g: 15, lipides_100g: 0.4,
  },
  {
    key: "ananas",
    nom: "Ananas",
    keywords: ["ananas"],
    calories_100g: 50, proteines_100g: 0.5, glucides_100g: 13, lipides_100g: 0.1,
  },

  // ─── Céréales / petit-déjeuner ────────────────────────────────────────────
  {
    key: "flocons-avoine",
    nom: "Flocons d'avoine",
    keywords: ["flocon avoine", "flocons avoine", "porridge", "avoine", "oat", "oats"],
    calories_100g: 389, proteines_100g: 16.9, glucides_100g: 66, lipides_100g: 6.9,
  },
  {
    key: "granola",
    nom: "Granola",
    keywords: ["granola"],
    calories_100g: 471, proteines_100g: 10, glucides_100g: 64, lipides_100g: 20,
  },
  {
    key: "muesli",
    nom: "Muesli",
    keywords: ["muesli", "cereale", "céréale", "cereales", "céréales"],
    calories_100g: 370, proteines_100g: 10, glucides_100g: 66, lipides_100g: 6,
  },

  // ─── Matières grasses ─────────────────────────────────────────────────────
  {
    key: "huile-olive",
    nom: "Huile d'olive",
    keywords: ["huile olive", "huile d olive", "huile"],
    calories_100g: 884, proteines_100g: 0, glucides_100g: 0, lipides_100g: 100,
  },
  {
    key: "huile-coco",
    nom: "Huile de coco",
    keywords: ["huile coco", "huile de coco", "huile coconut"],
    calories_100g: 862, proteines_100g: 0, glucides_100g: 0, lipides_100g: 100,
  },
  {
    key: "amandes",
    nom: "Amandes",
    keywords: ["amande", "amandes"],
    calories_100g: 579, proteines_100g: 21, glucides_100g: 22, lipides_100g: 49.9,
  },
  {
    key: "noix",
    nom: "Noix",
    keywords: ["noix"],
    calories_100g: 654, proteines_100g: 15, glucides_100g: 14, lipides_100g: 65,
  },
  {
    key: "cacahuetes",
    nom: "Cacahuètes",
    keywords: ["cacahuete", "cacahuètes", "arachide", "peanut"],
    calories_100g: 567, proteines_100g: 26, glucides_100g: 16, lipides_100g: 49,
  },
  {
    key: "beurre-cacahuete",
    nom: "Beurre de cacahuète",
    keywords: ["beurre cacahuete", "beurre de cacahuete", "beurre de cacahuète", "peanut butter"],
    calories_100g: 588, proteines_100g: 25, glucides_100g: 20, lipides_100g: 50,
  },

  // ─── Sauces / condiments ──────────────────────────────────────────────────
  {
    key: "sauce-soja",
    nom: "Sauce soja",
    keywords: ["sauce soja", "soja", "soy sauce"],
    calories_100g: 53, proteines_100g: 8.1, glucides_100g: 4.9, lipides_100g: 0,
  },
  {
    key: "miel",
    nom: "Miel",
    keywords: ["miel"],
    calories_100g: 304, proteines_100g: 0.3, glucides_100g: 82, lipides_100g: 0,
  },
  {
    key: "sucre",
    nom: "Sucre",
    keywords: ["sucre"],
    calories_100g: 400, proteines_100g: 0, glucides_100g: 100, lipides_100g: 0,
  },
  {
    key: "confiture",
    nom: "Confiture",
    keywords: ["confiture"],
    calories_100g: 250, proteines_100g: 0.4, glucides_100g: 63, lipides_100g: 0.1,
  },
  {
    key: "ketchup",
    nom: "Ketchup",
    keywords: ["ketchup"],
    calories_100g: 112, proteines_100g: 1.2, glucides_100g: 26, lipides_100g: 0.1,
  },
  {
    key: "mayonnaise",
    nom: "Mayonnaise",
    keywords: ["mayonnaise", "mayo"],
    calories_100g: 680, proteines_100g: 1, glucides_100g: 0.6, lipides_100g: 75,
  },

  // ─── Compléments ──────────────────────────────────────────────────────────
  {
    key: "whey",
    nom: "Whey protéine",
    keywords: ["whey", "proteine", "protéine", "shake proteine", "shake protéine", "poudre proteine"],
    calories_100g: 400, proteines_100g: 80, glucides_100g: 10, lipides_100g: 5,
    // Portion standard = 30g
    piece_weight_g: 30, piece_label: "dose",
  },
  {
    key: "caseine",
    nom: "Caséine",
    keywords: ["caseine", "caséine"],
    calories_100g: 367, proteines_100g: 80, glucides_100g: 7, lipides_100g: 1.7,
    piece_weight_g: 30, piece_label: "dose",
  },
  {
    key: "creatine",
    nom: "Créatine",
    keywords: ["creatine", "créatine"],
    calories_100g: 0, proteines_100g: 0, glucides_100g: 0, lipides_100g: 0,
    piece_weight_g: 5, piece_label: "dose",
  },
];

// ─── Normalisation ────────────────────────────────────────────────────────────

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Recherche ────────────────────────────────────────────────────────────────

export function findGenericFood(query: string): GenericFood | null {
  const q = normalizeText(query);

  // Pass 1 : correspondance exacte d'un keyword
  let best: { food: GenericFood; score: number } | null = null;
  for (const food of GENERIC_FOODS) {
    for (const kw of food.keywords) {
      const kwNorm = normalizeText(kw);
      if (q.includes(kwNorm)) {
        const score = kwNorm.length;
        if (!best || score > best.score) {
          best = { food, score };
        }
      }
    }
  }
  if (best) return best.food;

  // Pass 2 : correspondance mot par mot (fallback)
  const qWords = q.split(" ").filter((w) => w.length > 2);
  let bestPartial: { food: GenericFood; score: number } | null = null;

  for (const food of GENERIC_FOODS) {
    const allKw = food.keywords.flatMap((k) => normalizeText(k).split(" "));
    const score = qWords.filter((qw) =>
      allKw.some((kw) => kw.includes(qw) || qw.includes(kw))
    ).length;
    if (score > 0 && (!bestPartial || score > bestPartial.score)) {
      bestPartial = { food, score };
    }
  }
  return bestPartial?.food ?? null;
}
