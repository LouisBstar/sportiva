"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddProductModal from "./AddProductModal";
import { useDebounce } from "@/hooks/useDebounce";

type Alerte = { type: string; label: string };

type Product = {
  id: string;
  nom: string;
  marque: string | null;
  calories_100g: number | null;
  nutri_score: string | null;
  alertes: Alerte[] | null;
};

// ─── Small helpers ────────────────────────────────────────────────────────────

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

function NutriScoreBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const g = grade.toUpperCase();
  const cls = NUTRISCORE_STYLE[g] ?? "bg-gray-200 text-gray-600";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cls}`}>
      {g}
    </span>
  );
}

// ─── ProductList ──────────────────────────────────────────────────────────────

export default function ProductList({ products }: { products: Product[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const filtered = debouncedSearch.trim()
    ? products.filter((p) => {
        const q = debouncedSearch.toLowerCase();
        return (
          p.nom.toLowerCase().includes(q) ||
          (p.marque?.toLowerCase().includes(q) ?? false)
        );
      })
    : products;

  const handleSuccess = () => {
    setShowModal(false);
    router.refresh();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-3">Mes produits</h1>
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="search"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 text-[#1A1A2E]"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 pb-28 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            {search ? (
              <>
                <p className="text-sm text-gray-400">Aucun résultat pour « {debouncedSearch} »</p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-sm text-primary font-semibold"
                >
                  Effacer la recherche
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">🥫</div>
                <p className="text-sm font-semibold text-[#1A1A2E]">
                  Aucun produit enregistré
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Scanne un code-barres ou saisis manuellement
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-md shadow-primary/30"
                >
                  + Ajouter un produit
                </button>
              </>
            )}
          </div>
        ) : (
          filtered.map((product) => {
            const alertes = product.alertes ?? [];
            return (
              <Link
                key={product.id}
                href={`/produits/${product.id}`}
                className="flex items-center bg-white rounded-2xl border border-gray-100 p-4 gap-3 active:bg-gray-50 transition-colors"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                    {product.nom}
                  </p>
                  {product.marque && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {product.marque}
                    </p>
                  )}
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <NutriScoreBadge grade={product.nutri_score} />
                    {alertes.map((a) => {
                      const s = ALERTE_STYLE[a.type];
                      return s ? (
                        <span
                          key={a.type}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.chip}`}
                        >
                          {s.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Calories + chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {product.calories_100g != null && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1A1A2E]">
                        {Math.round(Number(product.calories_100g))}
                      </p>
                      <p className="text-[10px] text-gray-400">kcal/100g</p>
                    </div>
                  )}
                  <svg
                    className="w-4 h-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* FAB */}
      {filtered.length > 0 && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-2xl font-light active:scale-95 transition-transform"
          aria-label="Ajouter un produit"
        >
          +
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
