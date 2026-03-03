# Sportiva — Contexte Projet

## Description
Sportiva est une PWA de tracking nutritionnel et sportif, minimaliste et intelligente.
Interface 100% en français, design mobile-first.

## Stack technique
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Vercel (déploiement)
- Open Food Facts API (nutrition, scan code-barres)
- Strava API (import activités sportives)

## Conventions de code
- Langue du code : anglais (noms de variables, fonctions, composants)
- Langue de l'interface : français (tous les textes visibles par l'utilisateur)
- Composants React : functional components avec hooks
- Fichiers : kebab-case pour les fichiers, PascalCase pour les composants
- Utiliser les Server Actions de Next.js pour les mutations
- Supabase client : lib/supabase/client.ts (côté client) et lib/supabase/server.ts (côté serveur)
- Toujours utiliser RLS : chaque requête est filtrée par user_id

## Architecture des pages
- /login — Connexion
- /signup — Inscription
- /onboarding — Wizard 4 étapes (profil, objectif identitaire, composition corporelle, récapitulatif)
- /dashboard — Vue jour/semaine avec bilan calorique, macros, assiette éducative, score antifragile
- /repas — Logging des repas (mode rapide + conversationnel)
- /sport — Activités (Strava sync + saisie manuelle)
- /produits — Base d'aliments personnelle (scan code-barres, saisie manuelle)
- /profil — Paramètres, objectifs, composition corporelle, connexion Strava

## Principes clés
- Antifragilité : rater un jour ne casse rien, objectif mesuré à la semaine (seuil 80%)
- Objectifs identitaires : l'utilisateur choisit qui il veut devenir, pas juste des kilos
- TDEE via Mifflin-St Jeor, macros adaptatives selon objectif
- Planchers : protéines min 1.6g/kg, lipides min 0.8g/kg
- Logger un repas doit prendre moins de 30 secondes
- JAMAIS de message culpabilisant

## Couleurs
- Primaire : #1A73E8 (bleu)
- Accent : #34A853 (vert)
- Warning : #E65100 (orange)
- Fond : #FFFFFF
- Texte : #1A1A2E
