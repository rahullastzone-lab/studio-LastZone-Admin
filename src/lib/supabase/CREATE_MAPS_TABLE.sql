-- CREATE MAPS TABLE AND SEED DATA (FIXED TYPE)

-- 1. Create 'maps' table
-- Note: schema.sql says games.id is uuid, but live DB error says it's text. We use text to match live DB.
CREATE TABLE IF NOT EXISTS public.maps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id text REFERENCES public.games(id) ON DELETE CASCADE,
    name text NOT NULL,
    image_url text, -- Can be null initially
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow read access to everyone (authenticated and anon)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Select Maps' AND tablename = 'maps') THEN
        create policy "Allow Select Maps" on public.maps for select using ( true );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Manage Maps' AND tablename = 'maps') THEN
         create policy "Allow Manage Maps" on public.maps for all using ( auth.role() = 'authenticated' ) with check ( auth.role() = 'authenticated' );
    END IF;
END $$;

-- 4. Seed Data (Idempotent)
DO $$
DECLARE
    bgmi_id text;
    ff_id text;
    cod_id text;
BEGIN
    -- Get Game IDs (Assuming games exist, if not, they won't be inserted)
    -- Select as text
    SELECT id::text INTO bgmi_id FROM public.games WHERE name = 'BGMI' LIMIT 1;
    SELECT id::text INTO ff_id FROM public.games WHERE name = 'FreeFire' LIMIT 1;
    SELECT id::text INTO cod_id FROM public.games WHERE name = 'COD Mobile' LIMIT 1;

    -- BGMI Maps
    IF bgmi_id IS NOT NULL THEN
        -- Check if map exists before inserting to avoid constraint violations if script is run multiple times
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = bgmi_id AND name = 'Erangel') THEN
            INSERT INTO public.maps (game_id, name) VALUES (bgmi_id, 'Erangel');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = bgmi_id AND name = 'Livik') THEN
             INSERT INTO public.maps (game_id, name) VALUES (bgmi_id, 'Livik');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = bgmi_id AND name = 'Miramar') THEN
             INSERT INTO public.maps (game_id, name) VALUES (bgmi_id, 'Miramar');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = bgmi_id AND name = 'Sanhok') THEN
             INSERT INTO public.maps (game_id, name) VALUES (bgmi_id, 'Sanhok');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = bgmi_id AND name = 'TDM') THEN
             INSERT INTO public.maps (game_id, name) VALUES (bgmi_id, 'TDM');
        END IF;
    END IF;

    -- FreeFire Maps
    IF ff_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = ff_id AND name = 'Bermuda') THEN
            INSERT INTO public.maps (game_id, name) VALUES (ff_id, 'Bermuda');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = ff_id AND name = 'Purgatory') THEN
            INSERT INTO public.maps (game_id, name) VALUES (ff_id, 'Purgatory');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = ff_id AND name = 'Kalahari') THEN
            INSERT INTO public.maps (game_id, name) VALUES (ff_id, 'Kalahari');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = ff_id AND name = 'Alpine') THEN
            INSERT INTO public.maps (game_id, name) VALUES (ff_id, 'Alpine');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = ff_id AND name = 'Nexterra') THEN
            INSERT INTO public.maps (game_id, name) VALUES (ff_id, 'Nexterra');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = ff_id AND name = 'Bermuda Remastered') THEN
            INSERT INTO public.maps (game_id, name) VALUES (ff_id, 'Bermuda Remastered');
        END IF;
    END IF;

    -- COD Mobile Maps
    IF cod_id IS NOT NULL THEN
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Isolated') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Isolated');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Blackout') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Blackout');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Alcatraz') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Alcatraz');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Nuketown') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Nuketown');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Crash') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Crash');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Crossfire') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Crossfire');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Standoff') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Standoff');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Raid') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Raid');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Summit') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Summit');
        END IF;
         IF NOT EXISTS (SELECT 1 FROM public.maps WHERE game_id = cod_id AND name = 'Firing Range') THEN
            INSERT INTO public.maps (game_id, name) VALUES (cod_id, 'Firing Range');
        END IF;
    END IF;

END $$;

-- 5. Force Schema Refresh
NOTIFY pgrst, 'reload schema';
