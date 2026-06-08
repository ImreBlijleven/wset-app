-- =============================================================
-- WSET App — Supabase Security Migration
-- Uitvoeren in: Supabase Dashboard > SQL Editor
-- =============================================================

-- STAP 1: Maak de profiles tabel aan
-- (vervangt de custom users tabel voor auth-gerelateerde data)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STAP 2: RLS op profiles tabel
-- =============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Iedereen mag profielen lezen (voor username-weergave)
CREATE POLICY "Profiles zijn publiek leesbaar"
  ON public.profiles FOR SELECT
  USING (true);

-- Ingelogde gebruiker mag eigen profiel aanmaken
CREATE POLICY "Gebruiker kan eigen profiel aanmaken"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Gebruiker mag alleen eigen profiel bijwerken
CREATE POLICY "Gebruiker mag eigen profiel bijwerken"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- STAP 3: RLS op wines tabel
-- =============================================================

ALTER TABLE public.wines ENABLE ROW LEVEL SECURITY;

-- Iedereen mag wijnen lezen (community catalogus)
CREATE POLICY "Wijnen zijn publiek leesbaar"
  ON public.wines FOR SELECT
  USING (true);

-- Ingelogde gebruiker mag eigen notitie toevoegen
CREATE POLICY "Gebruiker kan eigen notitie toevoegen"
  ON public.wines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Gebruiker mag alleen eigen notitie bijwerken
CREATE POLICY "Gebruiker mag eigen notitie bijwerken"
  ON public.wines FOR UPDATE
  USING (auth.uid() = user_id);

-- Gebruiker mag alleen eigen notitie verwijderen
CREATE POLICY "Gebruiker mag eigen notitie verwijderen"
  ON public.wines FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================================
-- STAP 4: Bestaande wine-notities koppelen aan nieuwe accounts
--
-- Na het opnieuw registreren krijgt elke gebruiker een nieuw
-- UUID van Supabase Auth. Voer onderstaande queries uit om
-- bestaande notities te koppelen aan het nieuwe account.
--
-- Hoe vind je de oude UUID?
--   SELECT id, username FROM users WHERE username = 'imre';
--
-- Hoe vind je het nieuwe UUID?
--   SELECT id FROM auth.users WHERE email = 'imre@wset-app.local';
--
-- Daarna:
-- =============================================================

-- UPDATE public.wines
-- SET user_id = 'NIEUW_UUID_HIER'
-- WHERE user_id = 'OUD_UUID_HIER';


-- =============================================================
-- OPTIONEEL: Verwijder de oude users tabel na succesvolle migratie
-- Doe dit ALLEEN als alle gebruikers opnieuw geregistreerd zijn
-- en alle wine-notities zijn overgezet.
-- =============================================================

-- DROP TABLE IF EXISTS public.users;
