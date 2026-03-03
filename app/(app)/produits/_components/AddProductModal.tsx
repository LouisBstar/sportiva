"use client";

import { useState, useTransition } from "react";
import BarcodeScanner from "./BarcodeScanner";
import { saveProduct } from "@/app/actions/products";

// ─── Types ────────────────────────────────────────────────────────────────────

type Alerte = { type: string; label: string };

type OFFProduct = {
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  nutriscore_grade?: string;
  additives_tags?: string[];
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
  };
};

type ScanPhase =
  | { status: "scanning" }
  | { status: "fetching" }
  | { status: "found"; product: OFFProduct; barcode: string; alertes: Alerte[] }
  | { status: "not_found"; barcode: string }
  | { status: "error" };

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTROVERSIAL = new Set([
  "en:e102","en:e104","en:e110","en:e122","en:e124","en:e129", // Southampton 6
  "en:e211","en:e212","en:e213",           // Benzoates
  "en:e320","en:e321",                     // BHA/BHT
  "en:e249","en:e250","en:e251","en:e252", // Nitrites/nitrates
  "en:e951","en:e952","en:e954",           // Aspartame/saccharine/sulphame
  "en:e171",                               // Dioxyde de titane
  "en:e407",                               // Carraghénane
  "en:e621",                               // Glutamate MSG
]);

const NUTRISCORE_STYLE: Record<string, string> = {
  A: "bg-[#038141] text-white",
  B: "bg-[#85BB2F] text-white",
  C: "bg-[#FECB02] text-gray-800",
  D: "bg-[#EE8100] text-white",
  E: "bg-[#E63E11] text-white",
};

const ALERTE_STYLE: Record<string, { chip: string; label: string }> = {
  gras:    { chip: "bg-orange-100 text-orange-600", label: "Gras" },
  sucre:   { chip: "bg-yellow-100 text-yellow-600", label: "Sucré" },
  additif: { chip: "bg-red-100 text-red-600",       label: "Additifs" },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

async function fetchFromOFF(barcode: string): Promise<OFFProduct | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,image_front_url,nutriments,nutriscore_grade,additives_tags&lc=fr`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1) return null;
    return json.product as OFFProduct;
  } catch {
    return null;
  }
}

function computeAlertes(product: OFFProduct, forManual = false): Alerte[] {
  const alertes: Alerte[] = [];
  const fat = product.nutriments?.fat_100g ?? 0;
  const sugars = product.nutriments?.sugars_100g ?? 0;

  if (fat > 20) alertes.push({ type: "gras", label: "Riche en graisses (>20g/100g)" });
  if (!forManual && sugars > 15) alertes.push({ type: "sucre", label: "Riche en sucres (>15g/100g)" });
  if (!forManual && product.additives_tags?.some((a) => CONTROVERSIAL.has(a))) {
    alertes.push({ type: "additif", label: "Additifs controversés" });
  }
  return alertes;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function NutriScoreBadge({ grade }: { grade?: string | null }) {
  if (!grade) return null;
  const g = grade.toUpperCase();
  const cls = NUTRISCORE_STYLE[g] ?? "bg-gray-200 text-gray-600";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${cls}`}>
      {g}
    </span>
  );
}

function AlerteChip({ type }: { type: string }) {
  const s = ALERTE_STYLE[type];
  if (!s) return null;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.chip}`}>
      {s.label}
    </span>
  );
}

function NutrientRow({ label, value, unit = "g" }: { label: string; value?: number | null; unit?: string }) {
  if (value == null) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-[#1A1A2E]">{value} {unit}</span>
    </div>
  );
}

// ─── Scan Tab ─────────────────────────────────────────────────────────────────

function ScanContent({
  onSuccess,
  onSwitchManual,
}: {
  onSuccess: () => void;
  onSwitchManual: () => void;
}) {
  const [phase, setPhase] = useState<ScanPhase>({ status: "scanning" });
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState("");

  const handleScan = async (barcode: string) => {
    setPhase({ status: "fetching" });
    const product = await fetchFromOFF(barcode);
    if (product) {
      const alertes = computeAlertes(product);
      setPhase({ status: "found", product, barcode, alertes });
    } else {
      setPhase({ status: "not_found", barcode });
    }
  };

  const handleSave = () => {
    if (phase.status !== "found") return;
    setSaveError("");
    const { product, barcode, alertes } = phase;
    const n = product.nutriments ?? {};

    startTransition(async () => {
      const result = await saveProduct({
        nom: product.product_name || "Produit scanné",
        marque: product.brands || undefined,
        codeBarre: barcode,
        calories100g: n["energy-kcal_100g"] ?? 0,
        proteines100g: n.proteins_100g ?? 0,
        glucides100g: n.carbohydrates_100g ?? 0,
        lipides100g: n.fat_100g ?? 0,
        fibres100g: n.fiber_100g,
        nutriScore: product.nutriscore_grade,
        alertes,
        source: "openfoodfacts",
      });
      if (result.error) setSaveError(result.error);
      else onSuccess();
    });
  };

  const handleRescan = () => setPhase({ status: "scanning" });

  return (
    <div className="p-4 space-y-4">
      {/* Scanning */}
      {phase.status === "scanning" && (
        <BarcodeScanner onScan={handleScan} />
      )}

      {/* Fetching */}
      {phase.status === "fetching" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Recherche du produit…</p>
        </div>
      )}

      {/* Found */}
      {phase.status === "found" && (
        <div className="space-y-4">
          {/* Product card */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
            <div className="flex items-start gap-3">
              {phase.product.image_front_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={phase.product.image_front_url}
                  alt={phase.product.product_name ?? ""}
                  className="w-16 h-16 object-contain rounded-xl bg-white border border-gray-100 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1A1A2E] leading-tight">
                  {phase.product.product_name || "Produit inconnu"}
                </p>
                {phase.product.brands && (
                  <p className="text-xs text-gray-400 mt-0.5">{phase.product.brands}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <NutriScoreBadge grade={phase.product.nutriscore_grade} />
                  {phase.alertes.map((a) => (
                    <AlerteChip key={a.type} type={a.type} />
                  ))}
                </div>
              </div>
            </div>

            {/* Nutritional values */}
            <div className="bg-white rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Pour 100g
              </p>
              <NutrientRow label="Énergie" value={phase.product.nutriments?.["energy-kcal_100g"]} unit="kcal" />
              <NutrientRow label="Protéines" value={phase.product.nutriments?.proteins_100g} />
              <NutrientRow label="Glucides" value={phase.product.nutriments?.carbohydrates_100g} />
              <NutrientRow label="Lipides" value={phase.product.nutriments?.fat_100g} />
              {phase.product.nutriments?.fiber_100g != null && (
                <NutrientRow label="Fibres" value={phase.product.nutriments?.fiber_100g} />
              )}
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-red-500 text-center">{saveError}</p>
          )}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm shadow-md shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {isPending ? "Enregistrement…" : "Ajouter à mes produits"}
          </button>
          <button
            onClick={handleRescan}
            className="w-full text-sm text-gray-400 py-2"
          >
            Scanner un autre produit
          </button>
        </div>
      )}

      {/* Not found */}
      {phase.status === "not_found" && (
        <div className="text-center py-8 px-4 space-y-4">
          <div className="text-4xl">🔍</div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A2E]">Produit non trouvé</p>
            <p className="text-xs text-gray-400 mt-1">
              Code : {phase.barcode}
            </p>
          </div>
          <button
            onClick={onSwitchManual}
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm shadow-md shadow-primary/30"
          >
            Saisie manuelle
          </button>
          <button onClick={handleRescan} className="w-full text-sm text-gray-400 py-2">
            Réessayer
          </button>
        </div>
      )}

      {/* Error */}
      {phase.status === "error" && (
        <div className="text-center py-8">
          <p className="text-sm text-red-500">Une erreur est survenue</p>
          <button onClick={handleRescan} className="mt-3 text-sm text-primary font-semibold">
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Manual Tab ───────────────────────────────────────────────────────────────

function ManualContent({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    nom: "",
    marque: "",
    calories: "",
    proteines: "",
    glucides: "",
    lipides: "",
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    setError("");
    if (!form.nom.trim()) { setError("Le nom est obligatoire"); return; }
    if (!form.calories) { setError("Les calories sont obligatoires"); return; }

    const lipides = Number(form.lipides) || 0;
    const alertes: Alerte[] = [];
    if (lipides > 20) alertes.push({ type: "gras", label: "Riche en graisses (>20g/100g)" });

    startTransition(async () => {
      const result = await saveProduct({
        nom: form.nom.trim(),
        marque: form.marque.trim() || undefined,
        calories100g: Number(form.calories),
        proteines100g: Number(form.proteines) || 0,
        glucides100g: Number(form.glucides) || 0,
        lipides100g: lipides,
        alertes,
        source: "manual",
      });
      if (result.error) setError(result.error);
      else onSuccess();
    });
  };

  const fieldStyle =
    "w-full py-3 px-4 rounded-xl border border-gray-200 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium";

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Nom <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="ex : Granola maison"
            value={form.nom}
            onChange={set("nom")}
            className={fieldStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Marque <span className="text-gray-300">(optionnel)</span>
          </label>
          <input
            type="text"
            placeholder="ex : Bjorg"
            value={form.marque}
            onChange={set("marque")}
            className={fieldStyle}
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-2">
          Valeurs nutritionnelles pour 100g
        </p>
        {[
          { key: "calories", label: "Calories", unit: "kcal", required: true },
          { key: "proteines", label: "Protéines", unit: "g" },
          { key: "glucides", label: "Glucides", unit: "g" },
          { key: "lipides", label: "Lipides", unit: "g" },
        ].map(({ key, label, unit, required }) => (
          <div
            key={key}
            className="flex items-center px-4 py-2.5 border-t border-gray-100"
          >
            <label className="flex-1 text-sm text-[#1A1A2E] font-medium">
              {label}
              {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form[key as keyof typeof form]}
                onChange={set(key as keyof typeof form)}
                className="w-20 text-right py-1.5 px-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-[#1A1A2E] font-semibold"
              />
              <span className="text-xs text-gray-400 w-6">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm shadow-md shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-70"
      >
        {isPending ? "Enregistrement…" : "Enregistrer le produit"}
      </button>
    </div>
  );
}

// ─── Photo Tab ────────────────────────────────────────────────────────────────

function PhotoContent() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">
        📸
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1A1A2E]">Bientôt disponible</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Photographie ton étiquette nutritionnelle et on s&apos;occupe du reste.
        </p>
      </div>
      <button
        disabled
        className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-semibold text-sm cursor-not-allowed"
      >
        Scanner une étiquette (v1.1)
      </button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

type Tab = "scan" | "manuel" | "photo";

interface AddProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("scan");

  const TABS: { key: Tab; label: string }[] = [
    { key: "scan", label: "Scanner" },
    { key: "manuel", label: "Manuel" },
    { key: "photo", label: "Photo" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-[#1A1A2E]">Ajouter un produit</h2>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === key
                ? "text-primary"
                : "text-gray-400"
            }`}
          >
            {label}
            {activeTab === key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "scan" && (
          <ScanContent
            onSuccess={onSuccess}
            onSwitchManual={() => setActiveTab("manuel")}
          />
        )}
        {activeTab === "manuel" && <ManualContent onSuccess={onSuccess} />}
        {activeTab === "photo" && <PhotoContent />}
      </div>
    </div>
  );
}
