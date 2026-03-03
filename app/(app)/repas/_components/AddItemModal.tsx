"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { getOrCreateMeal, addMealItem, type MealType } from "@/app/actions/meals";
import { matchGenericFood, extractQuantity, type GenericFood } from "./foodDatabase";
import { useDebounce } from "@/hooks/useDebounce";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  nom: string;
  marque: string | null;
  calories_100g: number | null;
  proteines_100g: number | null;
  glucides_100g: number | null;
  lipides_100g: number | null;
};

type ConvResult = {
  nom: string;
  quantiteG: number;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  productId?: string;
  genericFood?: GenericFood;
};

// Shared with DayView for optimistic updates
export type OptimisticItem = {
  id: string;
  quantite_g: number;
  calories: number | null;
  proteines: number | null;
  glucides: number | null;
  lipides: number | null;
  product: { nom: string } | null;
};

type Props = {
  date: string;
  typeRepas: MealType;
  mealTypeLabel: string;
  products: Product[];
  onClose: () => void;
  onSuccess: (item: OptimisticItem) => void;
};

// ─── Quick quantities ─────────────────────────────────────────────────────────

const QUICK_QTY = [50, 100, 150, 200];

// ─── Macro mini display ───────────────────────────────────────────────────────

function MacroRow({
  cal,
  prot,
  carb,
  fat,
}: {
  cal: number;
  prot: number;
  carb: number;
  fat: number;
}) {
  return (
    <div className="flex gap-3 text-xs text-center">
      <div className="flex-1">
        <p className="font-bold text-[#1A1A2E]">{Math.round(cal)}</p>
        <p className="text-gray-400">kcal</p>
      </div>
      <div className="flex-1">
        <p className="font-bold text-[#1A1A2E]">{prot.toFixed(1)}g</p>
        <p className="text-gray-400">prot.</p>
      </div>
      <div className="flex-1">
        <p className="font-bold text-[#1A1A2E]">{carb.toFixed(1)}g</p>
        <p className="text-gray-400">gluc.</p>
      </div>
      <div className="flex-1">
        <p className="font-bold text-[#1A1A2E]">{fat.toFixed(1)}g</p>
        <p className="text-gray-400">lip.</p>
      </div>
    </div>
  );
}

// ─── Mode Rapide ──────────────────────────────────────────────────────────────

function ModeRapide({
  products,
  date,
  typeRepas,
  onSuccess,
}: {
  products: Product[];
  date: string;
  typeRepas: MealType;
  onSuccess: (item: OptimisticItem) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantite, setQuantite] = useState(100);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const debouncedSearch = useDebounce(search, 200);

  const filtered = debouncedSearch.trim()
    ? products.filter((p) => {
        const q = debouncedSearch.toLowerCase();
        return (
          p.nom.toLowerCase().includes(q) ||
          (p.marque?.toLowerCase().includes(q) ?? false)
        );
      })
    : products;

  const ratio = quantite / 100;
  const cal  = selected ? (selected.calories_100g  ?? 0) * ratio : 0;
  const prot = selected ? (selected.proteines_100g  ?? 0) * ratio : 0;
  const carb = selected ? (selected.glucides_100g   ?? 0) * ratio : 0;
  const fat  = selected ? (selected.lipides_100g    ?? 0) * ratio : 0;

  const handleAdd = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const mealRes = await getOrCreateMeal(date, typeRepas);
      if ("error" in mealRes) { setError(mealRes.error); return; }

      const res = await addMealItem({
        mealId: mealRes.id,
        productId: selected.id,
        quantiteG: quantite,
        calories100g: selected.calories_100g,
        proteines100g: selected.proteines_100g,
        glucides100g: selected.glucides_100g,
        lipides100g: selected.lipides_100g,
      });
      if (res.error) { setError(res.error); return; }

      onSuccess({
        id: `opt-${Date.now()}`,
        quantite_g: quantite,
        calories: cal,
        proteines: prot,
        glucides: carb,
        lipides: fat,
        product: { nom: selected.nom },
      });
    });
  };

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        {/* Back to search */}
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-gray-500 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <p className="font-semibold text-[#1A1A2E]">{selected.nom}</p>
          {selected.marque && (
            <p className="text-xs text-gray-400 mt-0.5">{selected.marque}</p>
          )}
        </div>

        {/* Quantity */}
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
          Quantité (g)
        </label>
        <div className="flex gap-2 mb-3">
          {QUICK_QTY.map((q) => (
            <button
              key={q}
              onClick={() => setQuantite(q)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                quantite === q
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {q}g
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          max={5000}
          aria-label="Quantité personnalisée en grammes"
          value={quantite}
          onChange={(e) => setQuantite(Math.max(1, Number(e.target.value)))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-center font-bold text-[#1A1A2E] mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {/* Preview macros */}
        <div className="bg-blue-50 rounded-2xl p-3 mb-4">
          <MacroRow cal={cal} prot={prot} carb={carb} fat={fat} />
        </div>

        {error && <p className="text-sm text-red-500 mb-3 text-center">{error}</p>}

        <button
          onClick={handleAdd}
          disabled={isPending}
          className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {isPending ? "Ajout en cours…" : `Ajouter ${quantite}g`}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          aria-label="Rechercher un aliment"
          placeholder="Rechercher un aliment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 text-[#1A1A2E]"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">
              {debouncedSearch ? `Aucun résultat pour « ${debouncedSearch} »` : "Ta base d'aliments est vide"}
            </p>
            {!debouncedSearch && (
              <p className="text-xs text-gray-300 mt-1">
                Ajoute des produits dans l&apos;onglet Produits
              </p>
            )}
          </div>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="w-full flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 text-left active:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1A1A2E] truncate">{p.nom}</p>
                {p.marque && (
                  <p className="text-xs text-gray-400 truncate">{p.marque}</p>
                )}
              </div>
              {p.calories_100g != null && (
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-bold text-[#1A1A2E]">
                    {Math.round(p.calories_100g)}
                  </p>
                  <p className="text-[10px] text-gray-400">kcal/100g</p>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Mode Conversationnel ─────────────────────────────────────────────────────

function ModeConversationnel({
  products,
  date,
  typeRepas,
  onSuccess,
}: {
  products: Product[];
  date: string;
  typeRepas: MealType;
  onSuccess: (item: OptimisticItem) => void;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ConvResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const parse = () => {
    if (!text.trim()) return;
    setIsParsing(true);
    setResult(null);
    setError(null);

    const q = text.trim();
    const quantiteG = extractQuantity(q);

    const qLower = q.toLowerCase();
    const personalMatch = products.find((p) =>
      p.nom.toLowerCase().includes(qLower) ||
      qLower.includes(p.nom.toLowerCase().split(" ")[0])
    );

    if (personalMatch) {
      const ratio = quantiteG / 100;
      setResult({
        nom: personalMatch.nom,
        quantiteG,
        calories:  (personalMatch.calories_100g  ?? 0) * ratio,
        proteines: (personalMatch.proteines_100g  ?? 0) * ratio,
        glucides:  (personalMatch.glucides_100g   ?? 0) * ratio,
        lipides:   (personalMatch.lipides_100g    ?? 0) * ratio,
        productId: personalMatch.id,
      });
      setIsParsing(false);
      return;
    }

    const generic = matchGenericFood(q);
    if (generic) {
      const ratio = quantiteG / 100;
      setResult({
        nom:       generic.nom,
        quantiteG,
        calories:  generic.calories  * ratio,
        proteines: generic.proteines * ratio,
        glucides:  generic.glucides  * ratio,
        lipides:   generic.lipides   * ratio,
        genericFood: generic,
      });
    } else {
      setError("Aliment non reconnu. Essaie d'être plus précis ou utilise le mode rapide.");
    }
    setIsParsing(false);
  };

  const handleAdd = () => {
    if (!result) return;
    setError(null);

    if (!result.productId) {
      setError("Cet aliment n'est pas dans ta base personnelle. Ajoute-le d'abord dans l'onglet Produits, ou utilise le mode rapide.");
      return;
    }

    startTransition(async () => {
      const mealRes = await getOrCreateMeal(date, typeRepas);
      if ("error" in mealRes) { setError(mealRes.error); return; }

      const personal = products.find((p) => p.id === result.productId)!;
      const res = await addMealItem({
        mealId:       mealRes.id,
        productId:    result.productId!,
        quantiteG:    result.quantiteG,
        calories100g:  personal.calories_100g,
        proteines100g: personal.proteines_100g,
        glucides100g:  personal.glucides_100g,
        lipides100g:   personal.lipides_100g,
      });
      if (res.error) { setError(res.error); return; }

      onSuccess({
        id:         `opt-${Date.now()}`,
        quantite_g: result.quantiteG,
        calories:   result.calories,
        proteines:  result.proteines,
        glucides:   result.glucides,
        lipides:    result.lipides,
        product:    { nom: result.nom },
      });
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
          Décris ton repas
        </label>
        <textarea
          ref={textareaRef}
          rows={3}
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); setError(null); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); parse(); }
          }}
          placeholder={"Ex : 200g de riz avec du poulet\nEx : une assiette de pâtes\nEx : 2 œufs brouillés"}
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-[#1A1A2E] placeholder:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[10px] text-gray-300 mt-1.5">
          Appuie sur Entrée ou sur Analyser pour reconnaître l&apos;aliment
        </p>
      </div>

      {!result && (
        <button
          onClick={parse}
          disabled={!text.trim() || isParsing}
          className="w-full bg-gray-100 text-[#1A1A2E] py-3 rounded-2xl font-semibold text-sm disabled:opacity-40 active:bg-gray-200 transition-colors"
        >
          {isParsing ? "Analyse en cours…" : "Analyser"}
        </button>
      )}

      {result && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-[#1A1A2E]">{result.nom}</p>
              <p className="text-xs text-gray-400 mt-0.5">{result.quantiteG}g</p>
            </div>
            <button
              onClick={() => { setResult(null); setError(null); }}
              className="text-xs text-gray-400 underline"
            >
              Corriger
            </button>
          </div>
          <MacroRow
            cal={result.calories}
            prot={result.proteines}
            carb={result.glucides}
            fat={result.lipides}
          />
          {!result.productId && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
              Estimation basée sur des valeurs moyennes. Pour des données précises, ajoute ce produit dans ta base.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {result && result.productId && (
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {isPending ? "Ajout en cours…" : `Ajouter ${result.quantiteG}g de ${result.nom}`}
        </button>
      )}

      {result && !result.productId && (
        <button
          disabled
          className="w-full bg-gray-200 text-gray-500 py-3.5 rounded-2xl font-semibold text-sm cursor-not-allowed"
        >
          Produit non disponible — ajoute-le dans Produits
        </button>
      )}
    </div>
  );
}

// ─── Modal principale ─────────────────────────────────────────────────────────

type Tab = "rapide" | "conv";

export default function AddItemModal({
  date,
  typeRepas,
  mealTypeLabel,
  products,
  onClose,
  onSuccess,
}: Props) {
  const [tab, setTab] = useState<Tab>("rapide");

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Ajouter un aliment — ${mealTypeLabel}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <h2 className="text-base font-bold text-[#1A1A2E]">
          Ajouter · {mealTypeLabel}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3 border-b border-gray-100 bg-gray-50">
        {(["rapide", "conv"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-white shadow-sm text-[#1A1A2E]"
                : "text-gray-400"
            }`}
          >
            {t === "rapide" ? "Mode rapide" : "Conversationnel"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "rapide" ? (
          <ModeRapide
            products={products}
            date={date}
            typeRepas={typeRepas}
            onSuccess={onSuccess}
          />
        ) : (
          <ModeConversationnel
            products={products}
            date={date}
            typeRepas={typeRepas}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}
