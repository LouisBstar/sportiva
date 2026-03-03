"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/app/actions/products";

export default function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Supprimer ce produit de ta base d'aliments ?")) return;
    startTransition(async () => {
      await deleteProduct(id);
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-full bg-red-50 border border-red-100 text-red-500 py-3.5 rounded-2xl font-semibold text-sm active:bg-red-100 transition-colors disabled:opacity-40"
    >
      {isPending ? "Suppression…" : "Supprimer ce produit"}
    </button>
  );
}
