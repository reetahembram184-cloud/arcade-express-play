
-- ROLES
CREATE TYPE public.app_role AS ENUM ('user','developer','admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'developer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GAMES
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'arcade',
  thumbnail_url TEXT,
  instructions TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.games TO anon, authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active games public" ON public.games FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage games" ON public.games FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER games_updated BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.games (slug,name,description,category,instructions) VALUES
('car-race','Car Race','Dodge traffic on an endless scrolling highway and chase your best distance.','arcade','Use Left/Right arrows or the on-screen buttons to switch lanes and avoid enemy cars.'),
('colour-match','Colour Match','Tap the matching colour before the timer runs out. Combos multiply your score.','puzzle','Read the target colour name and tap the matching swatch. Wrong taps cost a life.'),
('bubble-shooter','Bubble Shooter','Aim and pop clusters of three or more matching bubbles.','puzzle','Aim with your mouse or finger and tap to shoot a bubble.'),
('fruit-catch','Fruit Catch','Catch falling fruit in your basket and avoid the bombs.','arcade','Drag the basket or use Left/Right arrows. Bombs end the run.'),
('brick-breaker','Brick Breaker','Bounce the ball, clear the bricks, grab power-ups across levels.','arcade','Move the paddle with your finger, mouse or arrow keys.'),
('memory-match','Memory Match','Flip cards and find every matching pair in as few moves as possible.','memory','Tap two cards to flip them. Matching pairs stay face up.'),
('space-dodge','Space Dodge','Weave your ship through an endless asteroid field.','arcade','Steer left and right to dodge falling debris.'),
('number-rush','Number Rush','Tap the numbers in ascending order as fast as you can.','puzzle','Tap 1, then 2, then 3 and so on before time runs out.'),
('tap-target','Tap the Target','Hit shrinking targets in 30 seconds for the highest accuracy.','reflex','Tap each target as soon as it appears.'),
('word-scramble','Word Scramble','Unscramble the letters to reveal the hidden word.','word','Type or tap letters to build the word. Use a hint if you get stuck.');

-- SCORES
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL DEFAULT 'Guest Player',
  score INTEGER NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.scores TO anon, authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores public read" ON public.scores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "guest score insert" ON public.scores FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "user score insert" ON public.scores FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.validate_score()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.score < 0 OR NEW.score > 1000000 THEN RAISE EXCEPTION 'Invalid score'; END IF;
  IF NEW.duration < 0 OR NEW.duration > 86400 THEN RAISE EXCEPTION 'Invalid duration'; END IF;
  NEW.player_name := left(coalesce(nullif(trim(NEW.player_name),''),'Guest Player'), 24);
  NEW.created_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER scores_validate BEFORE INSERT ON public.scores FOR EACH ROW EXECUTE FUNCTION public.validate_score();
CREATE INDEX scores_game_score_idx ON public.scores (game_id, score DESC);

-- DEVELOPERS
CREATE TABLE public.developer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_name TEXT NOT NULL,
  developer_id TEXT UNIQUE NOT NULL DEFAULT ('dev_' || encode(gen_random_bytes(6),'hex')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.developer_profiles TO authenticated;
GRANT ALL ON public.developer_profiles TO service_role;
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dev profile read" ON public.developer_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own dev profile insert" ON public.developer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own dev profile update" ON public.developer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER devprofiles_updated BEFORE UPDATE ON public.developer_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.embed_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24),'hex'),
  status TEXT NOT NULL DEFAULT 'active',
  allowed_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embed_tokens TO authenticated;
GRANT ALL ON public.embed_tokens TO service_role;
ALTER TABLE public.embed_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tokens read" ON public.embed_tokens FOR SELECT TO authenticated USING (
  developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own tokens insert" ON public.embed_tokens FOR INSERT TO authenticated WITH CHECK (
  developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "own tokens update" ON public.embed_tokens FOR UPDATE TO authenticated USING (
  developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "own tokens delete" ON public.embed_tokens FOR DELETE TO authenticated USING (
  developer_id IN (SELECT id FROM public.developer_profiles WHERE user_id = auth.uid()));

CREATE TABLE public.embed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_token_id UUID REFERENCES public.embed_tokens(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  origin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.embed_events TO authenticated;
GRANT ALL ON public.embed_events TO service_role;
ALTER TABLE public.embed_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own embed events read" ON public.embed_events FOR SELECT TO authenticated USING (
  embed_token_id IN (
    SELECT t.id FROM public.embed_tokens t
    JOIN public.developer_profiles d ON d.id = t.developer_id
    WHERE d.user_id = auth.uid()
  ) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  embed_token_id UUID REFERENCES public.embed_tokens(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  score INTEGER
);
GRANT SELECT ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions read" ON public.game_sessions FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
