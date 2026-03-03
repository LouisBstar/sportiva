"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { removeMealItem, type MealType } from "@/app/actions/meals";
import ConversationalModal, { type OptimisticItem } from "./ConversationalModal";
import FavoriteTemplates, { type MealTemplate } from "./FavoriteTemplates";
import type { ParsedItem } from "@/lib/meal-parser";

// ─── Types ────────────────────────────────────────────────────────────────────

type MealItem = {
  id: string;
  quantite_g: number;
  calories: number | null;
  proteines: number | null;
  glucides: number | null;
  lipides: number | null;
  product: { nom: string } | null;
  nom_aliment: string | null;
};

type Meal = {
  id: string;
  type_repas: MealType;
  items: MealItem[];
};

type Product = {
  id: string;
  nom: string;
  marque: string | null;
  calories_100g: number | null;
  proteines_100g: number | null;
  glucides_100g: number | null;
  lipides_100g: number | null;
};

type DayNutrition = {
  total_calories: number;
  total_proteines: number;
  total_glucides: number;
  total_lipides: number;
};

type Profile = {
  calories_cible: number | null;
  proteines_cible_g: number | null;
  glucides_cible_g: number | null;
  lipides_cible_g: number | null;
};

type Props = {
  date: string;
  meals: Meal[];
  products: Product[];
  nutrition: DayNutrition;
  profile: Profile | null;
  templates: MealTemplate[];
};

// ─── Config sections repas ────────────────────────────────────────────────────

const MEAL_CONFIG: { type: MealType; label: string; emoji: string }[] = [
  { type: "petit-dejeuner", label: "Petit-déjeuner", emoji: "🌅" },
  { type: "dejeuner",       label: "Déjeuner",       emoji: "☀️" },
  { type: "collation",      label: "Collation",      emoji: "🍎" },
  { type: "diner",          label: "Dîner",          emoji: "🌙" },
];

// ─── Bouton supprimer aliment ─────────────────────────────────────────────────

function RemoveItemButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await removeMealItem(id);
          onDone();
        })
      }
      disabled={isPending}
      className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-400 disabled:opacity-40"
      aria-label="Supprimer"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ─── Section repas ────────────────────────────────────────────────────────────

function MealSection({
  config,
  meal,
  onRefresh,
  onOpenModal,
}: {
  config: (typeof MEAL_CONFIG)[number];
  meal: Meal | undefined;
  onRefresh: () => void;
  onOpenModal: () => void;
}) {
  const items = meal?.items ?? [];
  const totalCal = items.reduce((s, i) => s + (i.calories ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{config.emoji}</span>
          <span className="text-sm font-bold text-[#1A1A2E]">{config.label}</span>
          {items.length > 0 && (
            <span className="text-xs text-gray-400">{Math.round(totalCal)} kcal</span>
          )}
        </div>
        <button
          onClick={onOpenModal}
          className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg leading-none"
          aria-label={`Ajouter à ${config.label}`}
        >
          +
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-gray-300">Rien de logué · touche + pour ajouter</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((item) => {
            const nom = item.product?.nom ?? item.nom_aliment ?? "—";
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A2E] truncate">{nom}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {item.quantite_g}g
                    {item.proteines != null && (
                      <> · P {Number(item.proteines).toFixed(1)}g</>
                    )}
                    {item.glucides != null && (
                      <> · G {Number(item.glucides).toFixed(1)}g</>
                    )}
                    {item.lipides != null && (
                      <> · L {Number(item.lipides).toFixed(1)}g</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.calories != null && (
                    <span className="text-sm font-bold text-[#1A1A2E]">
                      {Math.round(Number(item.calories))} kcal
                    </span>
                  )}
                  {!item.id.startsWith("opt-") && (
                    <RemoveItemButton id={item.id} onDone={onRefresh} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Barre de progression ─────────────────────────────────────────────────────

function ProgressBar({
  value,
  max,
  color = "bg-primary",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── DayView ──────────────────────────────────────────────────────────────────

export default function DayView({
  date,
  meals,
  products,
  nutrition,
  profile,
  templates,
}: Props) {
  const router = useRouter();

  // État du modal : null = fermé, sinon { typeRepas, templateItems? }
  const [modalState, setModalState] = useState<{
    typeRepas: MealType;
    templateItems?: ParsedItem[];
  } | null>(null);

  // ── Optimistic state ─────────────────────────────────────────────────────
  const [optimisticMeals, addOptimisticItems] = useOptimistic(
    meals,
    (
      prev: Meal[],
      { mealType, items }: { mealType: MealType; items: OptimisticItem[] }
    ) => {
      const existing = prev.find((m) => m.type_repas === mealType);
      const newItems: MealItem[] = items.map((it) => ({
        id: it.id,
        quantite_g: it.quantite_g,
        calories: it.calories,
        proteines: it.proteines,
        glucides: it.glucides,
        lipides: it.lipides,
        product: it.product,
        nom_aliment: it.nom_aliment,
      }));
      if (existing) {
        return prev.map((m) =>
          m.type_repas === mealType
            ? { ...m, items: [...m.items, ...newItems] }
            : m
        );
      }
      return [
        ...prev,
        { id: `opt-meal-${Date.now()}`, type_repas: mealType, items: newItems },
      ];
    }
  );

  const handleAddItems = (mealType: MealType, optimisticItems: OptimisticItem[]) => {
    addOptimisticItems({ mealType, items: optimisticItems });
    setModalState(null);
    router.refresh();
  };

  const refresh = () => router.refresh();

  // ── Totaux nutritionnels ─────────────────────────────────────────────────
  const optCal  = optimisticMeals.reduce((s, m) => s + m.items.reduce((a, i) => a + (i.calories  ?? 0), 0), 0);
  const optProt = optimisticMeals.reduce((s, m) => s + m.items.reduce((a, i) => a + (i.proteines ?? 0), 0), 0);
  const optCarb = optimisticMeals.reduce((s, m) => s + m.items.reduce((a, i) => a + (i.glucides  ?? 0), 0), 0);
  const optFat  = optimisticMeals.reduce((s, m) => s + m.items.reduce((a, i) => a + (i.lipides   ?? 0), 0), 0);

  const serverCal  = Number(nutrition.total_calories);
  const serverProt = Number(nutrition.total_proteines);
  const serverCarb = Number(nutrition.total_glucides);
  const serverFat  = Number(nutrition.total_lipides);

  const cal  = Math.round(Math.max(optCal,  serverCal));
  const prot = Math.max(optProt, serverProt);
  const carb = Math.max(optCarb, serverCarb);
  const fat  = Math.max(optFat,  serverFat);

  const mealByType = Object.fromEntries(
    optimisticMeals.map((m) => [m.type_repas, m])
  ) as Record<MealType, Meal | undefined>;

  const calCible  = profile?.calories_cible    ?? 2000;
  const protCible = profile?.proteines_cible_g ?? 150;
  const carbCible = profile?.glucides_cible_g  ?? 200;
  const fatCible  = profile?.lipides_cible_g   ?? 70;

  const activeConfig = modalState
    ? MEAL_CONFIG.find((c) => c.type === modalState.typeRepas)!
    : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-[#1A1A2E]">Repas du jour</h1>
      </div>

      <div className="px-4 py-4 pb-28 space-y-3">
        {/* Résumé du jour */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{cal}</p>
              <p className="text-xs text-gray-400">kcal consommées</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-500">
                {calCible - cal > 0
                  ? `${calCible - cal} restantes`
                  : "Objectif atteint 🎉"}
              </p>
              <p className="text-xs text-gray-300">/ {calCible} kcal</p>
            </div>
          </div>

          <ProgressBar
            value={cal}
            max={calCible}
            color={cal > calCible ? "bg-orange-400" : "bg-primary"}
          />

          {/* Macros */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "Protéines", value: prot, target: protCible, color: "bg-red-400" },
              { label: "Glucides",  value: carb, target: carbCible, color: "bg-yellow-400" },
              { label: "Lipides",   value: fat,  target: fatCible,  color: "bg-orange-400" },
            ].map(({ label, value, target, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>{label}</span>
                  <span>{value.toFixed(0)}g</span>
                </div>
                <ProgressBar value={value} max={target} color={color} />
                <p className="text-[10px] text-gray-300 text-right">/ {target}g</p>
              </div>
            ))}
          </div>
        </div>

        {/* Favoris */}
        <FavoriteTemplates
          templates={templates}
          onUseTemplate={(typeRepas, templateItems) =>
            setModalState({ typeRepas, templateItems })
          }
        />

        {/* Sections repas */}
        {MEAL_CONFIG.map((config) => (
          <MealSection
            key={config.type}
            config={config}
            meal={mealByType[config.type]}
            onRefresh={refresh}
            onOpenModal={() => setModalState({ typeRepas: config.type })}
          />
        ))}
      </div>

      {/* Modal conversationnel */}
      {modalState && activeConfig && (
        <ConversationalModal
          date={date}
          typeRepas={modalState.typeRepas}
          mealTypeLabel={activeConfig.label}
          products={products}
          onClose={() => setModalState(null)}
          onSuccess={(items) => handleAddItems(modalState.typeRepas, items)}
          templateItems={modalState.templateItems}
        />
      )}
    </div>
  );
}
