"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = {
  error: string | null;
  success?: string | null;
};

export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Tous les champs sont obligatoires." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "Confirme ton email avant de te connecter." };
    }
    return { error: "Email ou mot de passe incorrect." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Une erreur est survenue." };

  // Vérifie si le profil est complet (onboarding terminé)
  const { data: profile } = await supabase
    .from("profiles")
    .select("calories_cible")
    .eq("user_id", user.id)
    .single();

  if (profile?.calories_cible) {
    redirect("/dashboard");
  } else {
    redirect("/onboarding");
  }
}

export async function signup(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (
      error.message.includes("already registered") ||
      error.message.includes("already been registered")
    ) {
      return { error: "Un compte existe déjà avec cet email." };
    }
    return { error: "Une erreur est survenue. Réessaie." };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
