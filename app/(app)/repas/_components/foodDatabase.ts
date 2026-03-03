// Generic food database for conversational mode parsing
// Values are per 100g

export type GenericFood = {
  keywords: string[];      // lowercase keywords to match against
  nom: string;             // display name
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
};

export const GENERIC_FOODS: GenericFood[] = [
  // ─── Céréales & pain ──────────────────────────────────────────
  { keywords: ["pain", "baguette", "tranche pain"],            nom: "Pain blanc",           calories: 265, proteines: 9,   glucides: 50, lipides: 2   },
  { keywords: ["pain complet", "pain integral"],               nom: "Pain complet",          calories: 247, proteines: 8.5, glucides: 46, lipides: 1.5 },
  { keywords: ["riz", "riz cuit", "riz blanc"],                nom: "Riz cuit",              calories: 130, proteines: 2.6, glucides: 28, lipides: 0.3 },
  { keywords: ["pates", "pâtes", "spaghetti", "tagliatelle"],  nom: "Pâtes cuites",          calories: 158, proteines: 5.5, glucides: 30, lipides: 1   },
  { keywords: ["avoine", "flocon", "porridge", "muesli"],      nom: "Flocons d'avoine",      calories: 370, proteines: 13,  glucides: 60, lipides: 7   },
  { keywords: ["granola", "cereale", "céréale"],               nom: "Céréales",              calories: 380, proteines: 8,   glucides: 70, lipides: 8   },
  { keywords: ["quinoa"],                                      nom: "Quinoa cuit",           calories: 120, proteines: 4.4, glucides: 21, lipides: 1.9 },
  { keywords: ["boulgour", "bulgur"],                          nom: "Boulgour cuit",         calories: 112, proteines: 3.8, glucides: 23, lipides: 0.7 },
  { keywords: ["toast", "pain de mie"],                        nom: "Pain de mie",           calories: 265, proteines: 8,   glucides: 50, lipides: 3.5 },
  { keywords: ["biscottes", "craquelin", "crackers"],          nom: "Biscottes",             calories: 380, proteines: 10,  glucides: 70, lipides: 7   },

  // ─── Viandes ──────────────────────────────────────────────────
  { keywords: ["poulet", "blanc poulet", "escalope", "filet poulet"], nom: "Blanc de poulet",  calories: 110, proteines: 23,  glucides: 0,  lipides: 2   },
  { keywords: ["boeuf", "bœuf", "steak", "viande hachee", "hachis"], nom: "Steak de bœuf",    calories: 200, proteines: 21,  glucides: 0,  lipides: 13  },
  { keywords: ["jambon", "jambon blanc"],                      nom: "Jambon blanc",          calories: 115, proteines: 17,  glucides: 1,  lipides: 4.5 },
  { keywords: ["lardons", "bacon"],                            nom: "Lardons",               calories: 330, proteines: 15,  glucides: 1,  lipides: 30  },
  { keywords: ["saumon"],                                      nom: "Saumon",                calories: 200, proteines: 20,  glucides: 0,  lipides: 13  },
  { keywords: ["thon", "thon en boite"],                       nom: "Thon en boîte",         calories: 128, proteines: 29,  glucides: 0,  lipides: 1.5 },
  { keywords: ["crevette"],                                    nom: "Crevettes cuites",      calories: 98,  proteines: 21,  glucides: 0,  lipides: 1.5 },
  { keywords: ["dinde", "escalope dinde"],                     nom: "Dinde",                 calories: 104, proteines: 22,  glucides: 0,  lipides: 1.5 },
  { keywords: ["porc", "cote de porc"],                        nom: "Côte de porc",          calories: 215, proteines: 20,  glucides: 0,  lipides: 15  },
  { keywords: ["chorizo", "saucisson", "charcuterie"],         nom: "Charcuterie",           calories: 420, proteines: 22,  glucides: 2,  lipides: 37  },

  // ─── Produits laitiers & œufs ─────────────────────────────────
  { keywords: ["oeuf", "œuf", "oeufs"],                        nom: "Œuf entier",            calories: 143, proteines: 13,  glucides: 0.6, lipides: 10 },
  { keywords: ["yaourt", "yogurt", "yaourt nature"],           nom: "Yaourt nature",         calories: 58,  proteines: 4,   glucides: 7,  lipides: 1.5 },
  { keywords: ["fromage blanc", "faisselle"],                  nom: "Fromage blanc 0%",      calories: 46,  proteines: 8,   glucides: 4,  lipides: 0.1 },
  { keywords: ["lait", "lait demi-ecreme", "lait demi écrémé"],nom: "Lait demi-écrémé",     calories: 46,  proteines: 3.2, glucides: 4.7, lipides: 1.5},
  { keywords: ["fromage", "gruyere", "emmental", "cheddar"],   nom: "Fromage (gruyère)",     calories: 413, proteines: 27,  glucides: 0.3, lipides: 33 },
  { keywords: ["mozzarella"],                                  nom: "Mozzarella",            calories: 280, proteines: 18,  glucides: 2.5, lipides: 22 },
  { keywords: ["beurre"],                                      nom: "Beurre",                calories: 750, proteines: 0.6, glucides: 0.5, lipides: 83 },
  { keywords: ["creme", "crème fraiche"],                      nom: "Crème fraîche 30%",     calories: 300, proteines: 2,   glucides: 3,  lipides: 30  },
  { keywords: ["skyr"],                                        nom: "Skyr nature",           calories: 57,  proteines: 11,  glucides: 4,  lipides: 0.2 },

  // ─── Légumes ──────────────────────────────────────────────────
  { keywords: ["tomate"],                                      nom: "Tomate",                calories: 18,  proteines: 0.9, glucides: 3.5, lipides: 0.2 },
  { keywords: ["salade", "laitue", "roquette", "mache"],       nom: "Salade verte",          calories: 13,  proteines: 1.3, glucides: 1.2, lipides: 0.2 },
  { keywords: ["courgette"],                                   nom: "Courgette",             calories: 17,  proteines: 1.2, glucides: 2.7, lipides: 0.3 },
  { keywords: ["carotte"],                                     nom: "Carotte",               calories: 41,  proteines: 0.9, glucides: 9,  lipides: 0.2  },
  { keywords: ["poivron"],                                     nom: "Poivron",               calories: 27,  proteines: 1,   glucides: 5.5, lipides: 0.3 },
  { keywords: ["brocoli"],                                     nom: "Brocoli",               calories: 34,  proteines: 3,   glucides: 5,  lipides: 0.4  },
  { keywords: ["epinard", "épinard"],                          nom: "Épinards",              calories: 23,  proteines: 2.9, glucides: 2.5, lipides: 0.5 },
  { keywords: ["champignon"],                                  nom: "Champignon de Paris",   calories: 22,  proteines: 3.1, glucides: 2,  lipides: 0.3  },
  { keywords: ["avocat"],                                      nom: "Avocat",                calories: 160, proteines: 2,   glucides: 1.5, lipides: 15  },
  { keywords: ["haricot vert"],                                nom: "Haricots verts",        calories: 31,  proteines: 1.8, glucides: 5.5, lipides: 0.2 },
  { keywords: ["pois chiche", "pois chiches"],                 nom: "Pois chiches cuits",    calories: 160, proteines: 8.9, glucides: 27, lipides: 2.6 },
  { keywords: ["lentille"],                                    nom: "Lentilles cuites",      calories: 116, proteines: 9,   glucides: 20, lipides: 0.4 },

  // ─── Fruits ───────────────────────────────────────────────────
  { keywords: ["pomme"],                                       nom: "Pomme",                 calories: 52,  proteines: 0.3, glucides: 13, lipides: 0.2  },
  { keywords: ["banane"],                                      nom: "Banane",                calories: 89,  proteines: 1.1, glucides: 22, lipides: 0.3  },
  { keywords: ["orange"],                                      nom: "Orange",                calories: 47,  proteines: 0.9, glucides: 11, lipides: 0.1  },
  { keywords: ["raisin"],                                      nom: "Raisin",                calories: 67,  proteines: 0.6, glucides: 17, lipides: 0.2  },
  { keywords: ["fraise"],                                      nom: "Fraises",               calories: 32,  proteines: 0.7, glucides: 7.5, lipides: 0.3 },
  { keywords: ["myrtille", "baie"],                            nom: "Myrtilles",             calories: 57,  proteines: 0.7, glucides: 14, lipides: 0.3  },

  // ─── Matières grasses & sauces ────────────────────────────────
  { keywords: ["huile", "huile olive"],                        nom: "Huile d'olive",         calories: 900, proteines: 0,   glucides: 0,  lipides: 100  },
  { keywords: ["mayonnaise"],                                  nom: "Mayonnaise",            calories: 720, proteines: 1.5, glucides: 3,  lipides: 78   },
  { keywords: ["ketchup"],                                     nom: "Ketchup",               calories: 100, proteines: 1.4, glucides: 23, lipides: 0.4  },
  { keywords: ["vinaigrette"],                                 nom: "Vinaigrette",           calories: 400, proteines: 0.5, glucides: 5,  lipides: 43   },

  // ─── Collations & snacks ──────────────────────────────────────
  { keywords: ["amande"],                                      nom: "Amandes",               calories: 579, proteines: 21,  glucides: 22, lipides: 50   },
  { keywords: ["noix", "noix de cajou"],                       nom: "Noix de cajou",         calories: 553, proteines: 18,  glucides: 30, lipides: 44   },
  { keywords: ["chocolat", "chocolat noir"],                   nom: "Chocolat noir",         calories: 540, proteines: 5,   glucides: 60, lipides: 32   },
  { keywords: ["proteine", "whey", "shake proteine"],          nom: "Whey protéine",         calories: 380, proteines: 75,  glucides: 7,  lipides: 5    },
];

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Try to match text to a generic food.
 * Returns the best match or null.
 */
export function matchGenericFood(text: string): GenericFood | null {
  const q = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let best: { food: GenericFood; score: number } | null = null;

  for (const food of GENERIC_FOODS) {
    for (const kw of food.keywords) {
      const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (q.includes(kwNorm)) {
        const score = kwNorm.length; // longer keyword = more specific = better
        if (!best || score > best.score) {
          best = { food, score };
        }
      }
    }
  }
  return best?.food ?? null;
}

/**
 * Extract a quantity in grams from a natural language string.
 * Examples: "200g de riz", "1 tranche de jambon", "un bol de riz"
 */
export function extractQuantity(text: string): number {
  const t = text.toLowerCase();

  // Explicit grams: "200g", "200 g", "200 grammes"
  const gramsMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:g(?:rammes?)?)\b/);
  if (gramsMatch) return Math.round(parseFloat(gramsMatch[1].replace(",", ".")));

  // Portions naturelles
  if (/\b(?:un|une|1)\s+(?:bol|assiette|grand bol)\b/.test(t)) return 200;
  if (/\b(?:une?|1)\s+(?:petite?\s+)?(?:assiette|portion)\b/.test(t)) return 150;
  if (/\b(?:un|une|1)\s+(?:verre)\b/.test(t)) return 200;
  if (/\b(?:une?|1)\s+(?:tranche|slice)\b/.test(t)) return 30;
  if (/\b(?:une?|1)\s+(?:cuillere|cuillère|c\.s\.|cs)\b/.test(t)) return 15;
  if (/\b(?:deux|2)\s+(?:tranches?|oeufs?|œufs?)\b/.test(t)) return 60;
  if (/\b(?:trois|3)\s+(?:tranches?|oeufs?|œufs?)\b/.test(t)) return 90;

  // Un/une + food without quantity → default 100g
  return 100;
}
