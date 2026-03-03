"use client";

import { useTransition } from "react";
import { deleteMealTemplate } from "@/app/actions/meal-templates";
import type { MealType } from "@/app/actions/meals";
import type { ParsedItem } from "@/lib/meal-parser";

export type TemplateItem = {
  id: string;
  nom_aliment: string;
  quantite_g: number;
  calories: number | null;
  proteines: number | null;
  glucides: number | null;
  lipides: number | null;
  product_id: string | null;
  generic_food_key: string | null;
};

export type MealTemplate = {
  id: string;
  nom: string;
  type_repas: MealType;
  meal_template_items: TemplateItem[];
};

type Props = {
  templates: MealTemplate[];
  onUseTemplate: (typeRepas: MealType, items: ParsedItem[]) => void;
};

const MEAL_EMOJI: Record<MealType, string> = {
  "petit-dejeuner": "🌅",
  dejeuner: "☀️",
  collation: "🍎",
  diner: "🌙",
};

function templateItemToParsed(item: TemplateItem, index: number): ParsedItem {
  const ratio = item.quantite_g > 0 ? item.quantite_g / 100 : 1;
  return {
    tempId: `tpl-${index}-${Date.now()}`,
    rawText: item.nom_aliment,
    nom: item.nom_aliment,
    quantite_g: item.quantite_g,
    calories: item.calories,
    proteines: item.proteines,
    glucides: item.glucides,
    lipides: item.lipides,
    cal100: item.calories != null ? item.calories / ratio : null,
    prot100: item.proteines != null ? item.proteines / ratio : null,
    carb100: item.glucides != null ? item.glucides / ratio : null,
    fat100: item.lipides != null ? item.lipides / ratio : null,
    source: item.product_id ? "personal" : item.generic_food_key ? "generic" : "unknown",
    productId: item.product_id ?? undefined,
    genericKey: item.generic_food_key ?? undefined,
  };
}

function TemplateCard({
  template,
  onUse,
}: {
  template: MealTemplate;
  onUse: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const totalCal = template.meal_template_items.reduce(
    (s, it) => s + (it.calories ?? 0),
    0
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await deleteMealTemplate(template.id);
    });
  };

  return (
    <button
      onClick={onUse}
      disabled={isPending}
      className="flex-shrink-0 flex flex-col gap-1 bg-white border border-gray-100 rounded-2xl px-3.5 py-3 min-w-[130px] max-w-[160px] text-left active:bg-gray-50 transition-colors relative group"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-base">{MEAL_EMOJI[template.type_repas]}</span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-opacity"
          aria-label="Supprimer le favori"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="text-xs font-semibold text-[#1A1A2E] leading-tight line-clamp-2">
        {template.nom}
      </p>
      <p className="text-[11px] text-gray-400">
        {Math.round(totalCal)} kcal · {template.meal_template_items.length} aliment{template.meal_template_items.length > 1 ? "s" : ""}
      </p>
    </button>
  );
}

export default function FavoriteTemplates({ templates, onUseTemplate }: Props) {
  if (!templates.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Mes favoris
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={() =>
              onUseTemplate(
                template.type_repas,
                template.meal_template_items.map(templateItemToParsed)
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
