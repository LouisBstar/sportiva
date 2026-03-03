-- ─── Migration : module repas v2 ─────────────────────────────────────────────
-- À exécuter dans Supabase → SQL Editor

-- 1. Autoriser les aliments génériques (sans product_id)
ALTER TABLE meal_items ALTER COLUMN product_id DROP NOT NULL;

-- 2. Nom d'affichage pour les aliments génériques
ALTER TABLE meal_items ADD COLUMN IF NOT EXISTS nom_aliment text;

-- 3. Table des templates (repas favoris)
CREATE TABLE IF NOT EXISTS meal_templates (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom         text NOT NULL,
  type_repas  text NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON meal_templates
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Éléments des templates
CREATE TABLE IF NOT EXISTS meal_template_items (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id      uuid REFERENCES meal_templates(id) ON DELETE CASCADE NOT NULL,
  nom_aliment      text NOT NULL,
  quantite_g       numeric(10,2) NOT NULL,
  calories         numeric(10,2),
  proteines        numeric(10,2),
  glucides         numeric(10,2),
  lipides          numeric(10,2),
  product_id       uuid REFERENCES products(id) ON DELETE SET NULL,
  generic_food_key text,
  created_at       timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE meal_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON meal_template_items
  USING (
    template_id IN (
      SELECT id FROM meal_templates WHERE user_id = auth.uid()
    )
  );
