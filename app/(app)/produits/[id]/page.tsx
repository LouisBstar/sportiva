import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "../_components/DeleteButton";

export const dynamic = "force-dynamic";

const NUTRISCORE_STYLE: Record<string, string> = {
  A: "bg-[#038141] text-white",
  B: "bg-[#85BB2F] text-white",
  C: "bg-[#FECB02] text-gray-800",
  D: "bg-[#EE8100] text-white",
  E: "bg-[#E63E11] text-white",
};

const ALERTE_COLORS: Record<string, string> = {
  gras:    "bg-orange-50 border-orange-200 text-orange-700",
  sucre:   "bg-yellow-50 border-yellow-200 text-yellow-700",
  additif: "bg-red-50 border-red-200 text-red-700",
};

const SOURCE_LABEL: Record<string, string> = {
  manual:        "Saisie manuelle",
  openfoodfacts: "Open Food Facts",
  ocr:           "Photo étiquette",
};

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!product) notFound();

  const alertes: Array<{ type: string; label: string }> = product.alertes ?? [];
  const ns = product.nutri_score?.toUpperCase();
  const nsStyle = ns ? (NUTRISCORE_STYLE[ns] ?? "bg-gray-200 text-gray-600") : null;

  const nutrients = [
    { label: "Énergie", value: product.calories_100g, unit: "kcal" },
    { label: "Protéines", value: product.proteines_100g, unit: "g" },
    { label: "Glucides", value: product.glucides_100g, unit: "g" },
    { label: "Lipides", value: product.lipides_100g, unit: "g" },
    { label: "Fibres", value: product.fibres_100g, unit: "g" },
  ].filter((n) => n.value != null);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
        <Link
          href="/produits"
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-base font-bold text-[#1A1A2E] truncate">
          {product.nom}
        </h1>
      </div>

      <div className="px-4 py-4 pb-24 space-y-3">
        {/* Identity card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A2E] leading-tight">
                {product.nom}
              </h2>
              {product.marque && (
                <p className="text-sm text-gray-400 mt-0.5">{product.marque}</p>
              )}
              {product.code_barres && (
                <p className="text-xs text-gray-300 mt-1 font-mono">
                  {product.code_barres}
                </p>
              )}
            </div>
            {nsStyle && (
              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${nsStyle}`}>
                {ns}
              </span>
            )}
          </div>
        </div>

        {/* Nutritional values */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Valeurs nutritionnelles · Pour 100g
          </h3>
          <div className="space-y-0">
            {nutrients.map(({ label, value, unit }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-bold text-[#1A1A2E]">
                  {Number(value).toFixed(1)} {unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes */}
        {alertes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              Alertes
            </p>
            {alertes.map((a, i) => {
              const cls = ALERTE_COLORS[a.type] ?? "bg-gray-50 border-gray-200 text-gray-600";
              return (
                <div
                  key={i}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${cls}`}
                >
                  {a.label}
                </div>
              );
            })}
          </div>
        )}

        {/* Source */}
        <div className="text-center">
          <span className="text-xs text-gray-300">
            Source : {SOURCE_LABEL[product.source] ?? product.source}
          </span>
        </div>

        {/* Delete */}
        <DeleteButton id={product.id} />
      </div>
    </div>
  );
}
