"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { login, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60 active:scale-[0.98]"
    >
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(login, initialState);

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-3 shadow-md shadow-primary/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-8 h-8"
          >
            <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            <path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Sportiva</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Ton partenaire nutrition &amp; sport
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-5">
          Connexion
        </h2>

        <form action={action} className="space-y-4" noValidate>
          {state.error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
              {state.error}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="ton@email.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          <SubmitButton />
        </form>
      </div>

      <p className="text-center text-sm text-gray-500 mt-5">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="text-primary font-semibold hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
