"use client";

import { useState, useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { deleteAccount } from "@/app/actions/profil";

type Props = { email: string };

export default function CompteSection({ email }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeleteAccount() {
    startTransition(async () => {
      const res = await deleteAccount();
      if (res?.error) {
        setDeleteError(res.error);
      }
      // On success, the server action redirects to /login
    });
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Compte
        </h2>

        {/* Email */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#1A1A2E] break-all">
            {email}
          </p>
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full bg-gray-50 border border-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-sm transition-colors active:bg-gray-100 mb-2"
          >
            Se déconnecter
          </button>
        </form>

        {/* Delete account */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full text-red-400 py-2.5 rounded-xl text-sm font-medium transition-colors active:bg-red-50"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteModal(false);
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#1A1A2E]">
                Supprimer le compte ?
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                Toutes tes données seront définitivement supprimées. Cette action est irréversible.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-4 text-center">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isPending}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
              >
                {isPending ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
