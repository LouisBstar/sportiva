// Parsing du langage naturel pour le logging de repas
// Gère : "200g de riz, 2 oeufs, 100g haricots verts"

import { GENERIC_FOODS, findGenericFood, normalizeText, type GenericFood } from "./generic-foods";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FoodSource = "personal" | "generic" | "unknown";

export type ParsedItem = {
  tempId: string;
  rawText: string;       // texte original du segment
  nom: string;           // nom affiché
  quantite_g: number;
  pieceCount?: number;   // si comptage en pièces (ex: 2 oeufs)
  // Macros totales pour quantite_g
  calories: number | null;
  proteines: number | null;
  glucides: number | null;
  lipides: number | null;
  // Macros pour 100g — pour recalcul si l'utilisateur change la quantité
  cal100: number | null;
  prot100: number | null;
  carb100: number | null;
  fat100: number | null;
  // Source
  source: FoodSource;
  productId?: string;   // si produit personnel
  genericKey?: string;  // si générique
};

type UserProduct = {
  id: string;
  nom: string;
  marque: string | null;
  calories_100g: number | null;
  proteines_100g: number | null;
  glucides_100g: number | null;
  lipides_100g: number | null;
};

// ─── Chiffres en lettres ──────────────────────────────────────────────────────

const WORD_NUMBERS: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5,
  six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
};

function parseWordNumber(s: string): number {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return WORD_NUMBERS[s.toLowerCase()] ?? 1;
}

// ─── Séparation des segments ──────────────────────────────────────────────────

export function splitSegments(input: string): string[] {
  return input
    .split(/,|;|\n|\r|(?<!\d)\bet\b(?!\s+\d)|(?<!\d)\bplus\b(?!\s+\d)|\s\+\s/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

// ─── Articles à supprimer ─────────────────────────────────────────────────────

const ARTICLES_RX = /\b(de|du|des|la|le|les|d|l|un|une|au|aux|avec)\b/g;

function stripArticles(s: string): string {
  return s.replace(ARTICLES_RX, " ").replace(/\s+/g, " ").trim();
}

// ─── Extraction de quantité ───────────────────────────────────────────────────

type QuantityResult = {
  grams: number;
  remainingText: string; // texte après suppression du token quantité
};

function extractGrams(normalized: string): QuantityResult | null {
  // "200g", "200 g", "200gr", "200 gr", "200 gramme", "200 grammes"
  const rx = /(\d+(?:[.,]\d+)?)\s*(gr(?:amme?s?)?|g(?=\b|\s|$))/;
  const m = normalized.match(rx);
  if (!m) return null;
  return {
    grams: parseFloat(m[1].replace(",", ".")),
    remainingText: normalized.replace(m[0], "").trim(),
  };
}

// ─── Recherche produit personnel ──────────────────────────────────────────────

function findPersonalProduct(query: string, products: UserProduct[]): UserProduct | null {
  const qNorm = normalizeText(query);
  const qWords = qNorm.split(" ").filter((w) => w.length > 2);
  if (qWords.length === 0) return null;

  let best: { product: UserProduct; score: number } | null = null;

  for (const p of products) {
    const pNorm = normalizeText(p.nom + " " + (p.marque ?? ""));
    const pWords = pNorm.split(" ");

    // Score = nombre de mots de la requête trouvés dans le produit
    const score = qWords.filter((qw) =>
      pWords.some((pw) => pw.includes(qw) || qw.includes(pw))
    ).length;

    if (score > 0 && (!best || score > best.score)) {
      best = { product: p, score };
    }
  }

  // N'accepter que si au moins 1 mot correspond
  return best ? best.product : null;
}

// ─── Construction d'un ParsedItem ────────────────────────────────────────────

function buildItem(
  raw: string,
  tempId: string,
  nom: string,
  quantite_g: number,
  pieceCount: number | undefined,
  cal100: number | null,
  prot100: number | null,
  carb100: number | null,
  fat100: number | null,
  source: FoodSource,
  productId?: string,
  genericKey?: string
): ParsedItem {
  const ratio = quantite_g / 100;
  return {
    tempId,
    rawText: raw,
    nom,
    quantite_g,
    pieceCount,
    calories: cal100 != null ? cal100 * ratio : null,
    proteines: prot100 != null ? prot100 * ratio : null,
    glucides: carb100 != null ? carb100 * ratio : null,
    lipides: fat100 != null ? fat100 * ratio : null,
    cal100,
    prot100,
    carb100,
    fat100,
    source,
    productId,
    genericKey,
  };
}

// ─── Parsing d'un segment ─────────────────────────────────────────────────────

function parseSegment(raw: string, index: number, products: UserProduct[]): ParsedItem {
  const tempId = `item-${index}-${Date.now()}`;
  const n = normalizeText(raw);

  // ── 1. Essayer d'extraire des grammes explicites ──────────────────────────
  const gramResult = extractGrams(n);

  if (gramResult) {
    const { grams, remainingText } = gramResult;
    const foodQuery = stripArticles(remainingText);

    // Chercher d'abord en base perso
    const personal = findPersonalProduct(foodQuery, products);
    if (personal) {
      return buildItem(
        raw, tempId, personal.nom, grams, undefined,
        personal.calories_100g, personal.proteines_100g,
        personal.glucides_100g, personal.lipides_100g,
        "personal", personal.id
      );
    }

    // Chercher en générique
    const generic = findGenericFood(foodQuery);
    if (generic) {
      return buildItem(
        raw, tempId, generic.nom, grams, undefined,
        generic.calories_100g, generic.proteines_100g,
        generic.glucides_100g, generic.lipides_100g,
        "generic", undefined, generic.key
      );
    }

    // Inconnu mais quantité connue
    return buildItem(raw, tempId, raw.trim(), grams, undefined, null, null, null, null, "unknown");
  }

  // ── 2. Essayer de détecter un nombre + aliment comptable ─────────────────
  // Patterns: "2 oeufs", "une banane", "3 tranches de jambon"
  const pieceRx = /^(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s+(.+)$/;
  const pieceMatch = n.match(pieceRx);

  if (pieceMatch) {
    const count = parseWordNumber(pieceMatch[1]);
    const foodQuery = stripArticles(pieceMatch[2]);

    // Chercher un aliment avec piece_weight_g dans les génériques
    const qNorm = normalizeText(foodQuery);
    let pieceFood: GenericFood | null = null;
    for (const food of GENERIC_FOODS) {
      if (!food.piece_weight_g) continue;
      const match = food.keywords.some((kw) => {
        const kwNorm = normalizeText(kw);
        return qNorm.includes(kwNorm) || kwNorm.includes(qNorm);
      });
      if (match) { pieceFood = food; break; }
    }

    if (pieceFood) {
      const quantite_g = count * pieceFood.piece_weight_g!;
      return buildItem(
        raw, tempId, pieceFood.nom, quantite_g, count,
        pieceFood.calories_100g, pieceFood.proteines_100g,
        pieceFood.glucides_100g, pieceFood.lipides_100g,
        "generic", undefined, pieceFood.key
      );
    }

    // Essayer produit perso avec ce nom
    const personal = findPersonalProduct(foodQuery, products);
    if (personal) {
      return buildItem(
        raw, tempId, personal.nom, count * 100, count,
        personal.calories_100g, personal.proteines_100g,
        personal.glucides_100g, personal.lipides_100g,
        "personal", personal.id
      );
    }

    // Générique sans piece_weight → 100g par unité
    const generic = findGenericFood(foodQuery);
    if (generic) {
      return buildItem(
        raw, tempId, generic.nom, count * 100, count,
        generic.calories_100g, generic.proteines_100g,
        generic.glucides_100g, generic.lipides_100g,
        "generic", undefined, generic.key
      );
    }
  }

  // ── 3. Fallback : chercher le nom en entier, quantité = 100g ─────────────
  const foodQuery = stripArticles(n);

  const personal = findPersonalProduct(foodQuery, products);
  if (personal) {
    return buildItem(
      raw, tempId, personal.nom, 100, undefined,
      personal.calories_100g, personal.proteines_100g,
      personal.glucides_100g, personal.lipides_100g,
      "personal", personal.id
    );
  }

  const generic = findGenericFood(foodQuery);
  if (generic) {
    return buildItem(
      raw, tempId, generic.nom, 100, undefined,
      generic.calories_100g, generic.proteines_100g,
      generic.glucides_100g, generic.lipides_100g,
      "generic", undefined, generic.key
    );
  }

  // Totalement inconnu
  return buildItem(raw, tempId, raw.trim(), 100, undefined, null, null, null, null, "unknown");
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

export function parseInput(text: string, userProducts: UserProduct[]): ParsedItem[] {
  const segments = splitSegments(text);
  return segments
    .filter((s) => s.length > 0)
    .map((seg, i) => parseSegment(seg, i, userProducts));
}

// ─── Recalcul des macros après changement de quantité ────────────────────────

export function recalcItem(item: ParsedItem, newQty: number): ParsedItem {
  const ratio = newQty / 100;
  return {
    ...item,
    quantite_g: newQty,
    calories: item.cal100 != null ? item.cal100 * ratio : null,
    proteines: item.prot100 != null ? item.prot100 * ratio : null,
    glucides: item.carb100 != null ? item.carb100 * ratio : null,
    lipides: item.fat100 != null ? item.fat100 * ratio : null,
  };
}
