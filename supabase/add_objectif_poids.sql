-- ============================================================
-- Migration : objectif_poids + motivations
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Renommer objectif_identitaire → objectif_poids
ALTER TABLE public.profiles
  RENAME COLUMN objectif_identitaire TO objectif_poids;

-- 2. Ajouter la colonne motivations (tableau de strings)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS motivations text[] DEFAULT '{}';
