-- ============================================
-- FIX: Permitir que ADMINS actualicen perfiles de otros usuarios
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- Paso 1: Eliminar política de UPDATE antigua
DROP POLICY IF EXISTS profiles_update ON public.profiles;

-- Paso 2: Crear política de UPDATE mejorada que permita a admins actualizar
CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id 
  OR auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.uid() = id 
  OR auth.jwt() ->> 'role' = 'admin'
);

-- Paso 3: Crear política INSERT para permitir a admins crear usuarios
CREATE POLICY profiles_insert ON public.profiles
FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- Verificación
SELECT 'Política de UPDATE actualizada. Admins pueden editar otros perfiles.' as status;
