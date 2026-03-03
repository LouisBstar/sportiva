"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { addMealItems, type MealType } from "@/app/actions/meals";
import { saveMealTemplate } from "@/app/actions/meal-templates";
import { parseInput, recalcItem, type ParsedItem } from "@/lib/meal-parser";

// ─── Types exportés (consommés par DayView) ───────────────────────────────────

export type OptimisticItem = {
  id: string;
  quantite_g: number;
  calories: number | null;
  proteines: number | null;
  glucides: number | null;
  lipides: number | null;
  product: { nom: string } | null;
  nom_aliment: string | null;
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

type Props = {
  date: string;
  typeRepas: MealType;
  mealTypeLabel: string;
  products: UserProduct[];
  onClose: () => void;
  onSuccess: (items: OptimisticItem[]) => void;
  templateItems?: ParsedItem[]; // pré-rempli depuis un favori
};

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: ParsedItem["source"] }) {
  if (source === "personal")
    return (
      <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
        mon produit
      </span>
    );
  if (source === "generic")
    return (
      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
        générique
      </span>
    );
  return (
    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
      non reconnu
    </span>
  );
}

// ─── Ligne d'aliment éditable ─────────────────────────────────────────────────

function ItemRow({
  item,
  onUpdateQty,
  onUpdateCal,
  onDelete,
}: {
  item: ParsedItem;
  onUpdateQty: (tempId: string, qty: number) => void;
  onUpdateCal: (tempId: string, cal: number) => void;
  onDelete: (tempId: string) => void;
}) {
  const [qtyInput, setQtyInput] = useState(String(Math.round(item.quantite_g)));

  const handleQtyBlur = () => {
    const v = parseFloat(qtyInput.replace(",", "."));
    if (!isNaN(v) && v > 0) {
      onUpdateQty(item.tempId, v);
    } else {
      setQtyInput(String(Math.round(item.quantite_g)));
    }
  };

  const step10 = (delta: number) => {
    const newQty = Math.max(1, Math.round(item.quantite_g) + delta);
    onUpdateQty(item.tempId, newQty);
    setQtyInput(String(newQty));
  };

  // Sync when quantity is changed from parent
  useEffect(() => {
    setQtyInput(String(Math.round(item.quantite_g)));
  }, [item.quantite_g]);

  if (item.source === "unknown") {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">❓</span>
            <p className="text-sm font-medium text-[#1A1A2E] truncate">{item.nom}</p>
            <SourceBadge source={item.source} />
          </div>
          <button
            onClick={() => onDelete(item.tempId)}
            className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-white text-gray-400"
            aria-label="Supprimer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 flex-shrink-0">Calories :</label>
          <input
            type="number"
            min={0}
            placeholder="ex: 350"
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onUpdateCal(item.tempId, v);
            }}
            className="flex-1 px-2.5 py-1.5 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-[#1A1A2E]"
          />
          <span className="text-xs text-gray-400">kcal</span>
        </div>
      </div>
    );
  }

  const cal = item.calories != null ? Math.round(item.calories) : null;
  const pieceInfo = item.pieceCount
    ? ` (${item.pieceCount} pcs)`
    : "";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-green-500 flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A2E] truncate leading-tight">
              {item.nom}{pieceInfo}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {cal != null && (
                <span className="text-xs font-bold text-[#1A1A2E]">{cal} kcal</span>
              )}
              {item.proteines != null && (
                <span className="text-[10px] text-gray-400">P:{item.proteines.toFixed(1)}g</span>
              )}
              {item.glucides != null && (
                <span className="text-[10px] text-gray-400">G:{item.glucides.toFixed(1)}g</span>
              )}
              {item.lipides != null && (
                <span className="text-[10px] text-gray-400">L:{item.lipides.toFixed(1)}g</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(item.tempId)}
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-gray-400"
          aria-label="Supprimer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quantity control */}
      <div className="flex items-center gap-2">
        <SourceBadge source={item.source} />
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => step10(-10)}
            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            aria-label={`Quantité de ${item.nom} en grammes`}
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            onBlur={handleQtyBlur}
            className="w-16 text-center text-sm font-semibold text-[#1A1A2E] border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-xs text-gray-400">g</span>
          <button
            onClick={() => step10(10)}
            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal principale ─────────────────────────────────────────────────────────

type Step = "input" | "results";

export default function ConversationalModal({
  date,
  typeRepas,
  mealTypeLabel,
  products,
  onClose,
  onSuccess,
  templateItems,
}: Props) {
  const [step, setStep] = useState<Step>(templateItems ? "results" : "input");
  const [inputText, setInputText] = useState("");
  const [items, setItems] = useState<ParsedItem[]>(templateItems ?? []);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Favori
  const [showFavInput, setShowFavInput] = useState(false);
  const [favName, setFavName] = useState("");
  const [favSaved, setFavSaved] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === "input") textareaRef.current?.focus();
  }, [step]);

  // ── Analyse ──────────────────────────────────────────────────────────────

  const handleAnalyze = () => {
    if (!inputText.trim()) return;
    const parsed = parseInput(inputText, products);
    setItems(parsed);
    setStep("results");
    setSubmitError(null);
  };

  // ── Modifications de la liste ────────────────────────────────────────────

  const updateQty = (tempId: string, newQty: number) => {
    setItems((prev) => prev.map((it) => it.tempId === tempId ? recalcItem(it, newQty) : it));
  };

  const updateCal = (tempId: string, cal: number) => {
    setItems((prev) => prev.map((it) =>
      it.tempId === tempId ? { ...it, calories: cal, cal100: null } : it
    ));
  };

  const deleteItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  // ── Soumission ────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!items.length) return;
    setSubmitError(null);

    startTransition(async () => {
      const res = await addMealItems(
        date,
        typeRepas,
        items.map((it) => ({
          nom: it.nom,
          quantite_g: it.quantite_g,
          calories: it.calories,
          proteines: it.proteines,
          glucides: it.glucides,
          lipides: it.lipides,
          productId: it.productId,
        }))
      );

      if (res.error) {
        setSubmitError(res.error);
        return;
      }

      const optimistic: OptimisticItem[] = items.map((it, i) => ({
        id: `opt-${Date.now()}-${i}`,
        quantite_g: it.quantite_g,
        calories: it.calories,
        proteines: it.proteines,
        glucides: it.glucides,
        lipides: it.lipides,
        product: it.productId ? { nom: it.nom } : null,
        nom_aliment: it.productId ? null : it.nom,
      }));

      onSuccess(optimistic);
    });
  };

  // ── Sauvegarder comme favori ─────────────────────────────────────────────

  const handleSaveFav = () => {
    if (!favName.trim()) return;
    startTransition(async () => {
      await saveMealTemplate(favName, typeRepas, items.map((it) => ({
        nom: it.nom,
        quantite_g: it.quantite_g,
        calories: it.calories,
        proteines: it.proteines,
        glucides: it.glucides,
        lipides: it.lipides,
        productId: it.productId,
        genericKey: it.genericKey,
      })));
      setFavSaved(true);
      setShowFavInput(false);
    });
  };

  // ── Totaux ───────────────────────────────────────────────────────────────

  const totalCal = items.reduce((s, it) => s + (it.calories ?? 0), 0);
  const hasItems = items.length > 0;

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Ajouter à ${mealTypeLabel}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {step === "results" && !templateItems && (
            <button
              onClick={() => setStep("input")}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-1"
              aria-label="Retour"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-base font-bold text-[#1A1A2E]">
            {step === "input" ? `Ajouter · ${mealTypeLabel}` : mealTypeLabel}
          </h2>
        </div>
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

      {/* ── Étape 1 : saisie ── */}
      {step === "input" && (
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
              Décris ce que tu as mangé
            </label>
            <textarea
              ref={textareaRef}
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) { e.preventDefault(); handleAnalyze(); }
              }}
              placeholder={"200g de riz, 100g de haricots verts, 2 oeufs\n150g de pâtes avec du saumon\n1 banane, un yaourt nature"}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-[#1A1A2E] placeholder:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
            />
            <p className="text-[10px] text-gray-300 mt-1.5">
              Plusieurs aliments séparés par des virgules · ⌘+Entrée pour analyser
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!inputText.trim()}
            className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Analyser →
          </button>
        </div>
      )}

      {/* ── Étape 2 : résultats éditables ── */}
      {step === "results" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">Aucun aliment reconnu.</p>
                <button
                  onClick={() => setStep("input")}
                  className="mt-2 text-sm text-primary font-semibold"
                >
                  Réessayer
                </button>
              </div>
            )}

            {items.map((item) => (
              <ItemRow
                key={item.tempId}
                item={item}
                onUpdateQty={updateQty}
                onUpdateCal={updateCal}
                onDelete={deleteItem}
              />
            ))}

            {/* Sauvegarder comme favori */}
            {hasItems && !favSaved && (
              <div className="pt-1">
                {!showFavInput ? (
                  <button
                    onClick={() => { setShowFavInput(true); setFavName(""); }}
                    className="text-xs text-gray-400 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Sauvegarder comme favori
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={favName}
                      onChange={(e) => setFavName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveFav(); }}
                      placeholder="Nom du favori…"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-[#1A1A2E]"
                    />
                    <button
                      onClick={handleSaveFav}
                      disabled={!favName.trim() || isPending}
                      className="px-3 py-2 bg-primary text-white text-sm font-semibold rounded-xl disabled:opacity-40"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setShowFavInput(false)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {favSaved && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Favori sauvegardé !
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-100 space-y-3 bg-white">
            {hasItems && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{items.length} aliment{items.length > 1 ? "s" : ""}</span>
                <span className="font-bold text-[#1A1A2E]">{Math.round(totalCal)} kcal</span>
              </div>
            )}

            {submitError && (
              <p className="text-sm text-red-500 text-center">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!hasItems || isPending}
              className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {isPending ? "Logging en cours…" : "Valider et logger →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
