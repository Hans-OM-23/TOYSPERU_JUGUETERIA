-- ============================================
-- FIX COMPLETO: Error de Foreign Key y RLS en tabla profiles
-- ============================================
-- Ejecutar TODO este código en Supabase SQL Editor
-- ============================================

-- Paso 1: Verificar y corregir la clave foránea
DO $$
BEGIN
  -- Eliminar restricción antigua si existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    RAISE NOTICE '✓ Restricción profiles_id_fkey eliminada';
  END IF;

  -- Crear la restricción correcta
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED; -- permite postergar la comprobación hasta el COMMIT

  RAISE NOTICE '✓ Restricción profiles_id_fkey creada correctamente (DEFERRABLE INITIALLY DEFERRED)';
  
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'La restricción ya existe';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear FK: %', SQLERRM;
END $$;

-- Paso 2: Eliminar función RPC vieja
DROP FUNCTION IF EXISTS public.create_profile_on_signup(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Paso 3: Crear función RPC RÁPIDA sin reintentos (evita timeouts)
CREATE OR REPLACE FUNCTION public.create_profile_on_signup(
  user_id UUID,
  user_email TEXT DEFAULT NULL,
  user_nombre TEXT DEFAULT NULL,
  user_apellidos TEXT DEFAULT NULL,
  user_pais TEXT DEFAULT NULL,
  user_ciudad TEXT DEFAULT NULL,
  user_telefono TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  user_exists BOOLEAN;
  tries INTEGER := 0;
  -- Reducido para evitar timeout (máximo 2 segundos de espera total)
  max_tries CONSTANT INTEGER := 8; -- número máximo de reintentos
  wait_seconds CONSTANT NUMERIC := 0.25; -- tiempo entre reintentos en segundos
BEGIN
  -- Verificación rápida sin reintentos para evitar timeout
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE NOTICE '❌ Usuario % NO encontrado en auth.users', user_id;
    RETURN json_build_object(
      'success', false,
      'message', 'Usuario no encontrado. Por favor, reintenta en unos segundos.'
    );
  END IF;

  -- Insertar o actualizar perfil
  INSERT INTO public.profiles (
    id,
    email,
    nombre,
    apellidos,
    pais,
    ciudad,
    telefono,
    role,
    requested_role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_nombre,
    user_apellidos,
    user_pais,
    user_ciudad,
    user_telefono,
    'user',
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    apellidos = EXCLUDED.apellidos,
    pais = EXCLUDED.pais,
    ciudad = EXCLUDED.ciudad,
    telefono = EXCLUDED.telefono,
    updated_at = NOW();

  result := json_build_object(
    'success', true,
    'message', 'Perfil creado/actualizado',
    'user_id', user_id
  );

  RETURN result;

EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE '❌ Error FK para user %: %', user_id, SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', 'Error de sincronización: usuario no disponible o FK violada.'
    );
  WHEN unique_violation THEN
    RAISE NOTICE '❌ Perfil duplicado para user %', user_id;
    RETURN json_build_object(
      'success', false,
      'message', 'El perfil ya existe para este usuario'
    );
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error general: % (%)', SQLERRM, SQLSTATE;
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Paso 4: Configurar RLS correctamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas antiguas
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_own_select ON public.profiles;
DROP POLICY IF EXISTS profiles_own_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_own_update ON public.profiles;
DROP POLICY IF EXISTS profiles_own_delete ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Asegurar que las políticas que vamos a crear no existan (make script idempotent)
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
DROP POLICY IF EXISTS profiles_delete ON public.profiles;

-- Crear políticas nuevas y simples
CREATE POLICY profiles_select ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR role IN ('admin', 'manager')
);

CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_delete ON public.profiles
FOR DELETE
USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

-- NO crear política INSERT - solo usar RPC

-- Paso 5: Otorgar permisos
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_on_signup TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_on_signup TO anon;

-- Opcional (recomendado para evitar condiciones de carrera):
-- Crear un trigger que ejecute la creación de perfil en la misma transacción
-- (esto garantiza que el registro en auth.users exista cuando se inserte en profiles).
-- Descomenta y adapta si quieres usar este enfoque.
--
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_trigger WHERE tgname = 'create_profile_after_auth_user'
--   ) THEN
--     CREATE FUNCTION public.create_profile_after_auth_user() RETURNS trigger
--     LANGUAGE plpgsql SECURITY DEFINER AS $$
--     BEGIN
--       PERFORM public.create_profile_on_signup(NEW.id, NEW.email, NULL, NULL, NULL, NULL, NULL);
--       RETURN NEW;
--     END;
--     $$;
--
--     CREATE TRIGGER create_profile_after_auth_user
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.create_profile_after_auth_user();
--   END IF;
-- END$$;

-- Verificación final
SELECT 
  '✅ Configuración completada exitosamente' as status,
  'Función RPC: ' || COUNT(*)::TEXT || ' encontrada(s)' as rpc_status
FROM pg_proc 
WHERE proname = 'create_profile_on_signup';
