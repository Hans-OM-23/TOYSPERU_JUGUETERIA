# Instrucciones de Reparación - Problemas Solucionados

## Problemas Identificados y Solucionados

### 1. ✅ Montos de Pago No Se Visualizan en AdminSales (S/ 0.00)

**Problema:** En la sección "Órdenes Recientes" del AdminSales, todos los totales mostraban "S/ 0.00"

**Causa:** El código estaba buscando el campo `item.price` pero la tabla `order_items` usa `item.product_price`

**Solución:** Se han actualizado todas las referencias en `AdminSales.jsx` para usar `product_price`

**Archivos modificados:**
- `src/pages/AdminSales.jsx` - Líneas 46, 67, 267

**✓ Cambio completado automáticamente**

---

### 2. ⚠️ No Se Puede Asignar Rol Admin Desde Admin (Requiere acción en Supabase)

**Problema:** Un admin no puede crear o asignar otros usuarios con rol "admin"

**Causa:** Las políticas de Row Level Security (RLS) en Supabase estaban muy restrictivas:
```sql
-- ANTIGUA (RESTRICTIVA):
CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (auth.uid() = id)           -- Solo el usuario puede editar su propio registro
WITH CHECK (auth.uid() = id);
```

**Solución:** Actualizar las políticas RLS para permitir a admins editar otros perfiles

**Pasos a seguir en Supabase:**

1. **Abre Supabase Console** → Tu proyecto → SQL Editor
2. **Copia y ejecuta el contenido del archivo `fix-rls-admin-update.sql`**
   - O ejecuta el contenido de `supabase-fix-profiles.sql` (versión actualizada)

3. **Código a ejecutar:**

```sql
-- Eliminar política antigua
DROP POLICY IF EXISTS profiles_update ON public.profiles;

-- Crear política mejorada
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

-- Crear política INSERT
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);
```

4. **Verifica el resultado:** Deberías ver un mensaje de éxito

5. **En la aplicación:**
   - Abre AdminUsers
   - Ahora podrás:
     - ✅ Crear nuevos usuarios con rol "admin"
     - ✅ Cambiar usuarios existentes a rol "admin"

---

## Cambios en el Código Frontend

### AdminSales.jsx
Se actualizaron 3 ubicaciones donde se calculaba el total de órdenes para usar `product_price` en lugar de `price`:

- **Línea ~46:** Cálculo en el loop principal
- **Línea ~67:** Cálculo de revenue por mes
- **Línea ~267:** Cálculo en la tabla de órdenes recientes

**Antes:**
```javascript
const itemTotal = (item.price || 0) * (item.quantity || 0)
```

**Después:**
```javascript
const itemTotal = (item.product_price || 0) * (item.quantity || 0)
```

### AdminUsers.jsx
Se agregó logging mejorado para ayudar a diagnosticar problemas:

- **saveEdit():** Ahora registra en consola los intentos de cambiar roles
- **saveNewUser():** Ahora registra en consola el rol asignado al crear usuarios
- Mejor manejo de errores con `console.error()`

---

## Verificación

Después de hacer los cambios:

1. **Para verificar el monto de pago:**
   - Ve a Admin → Ventas (AdminSales)
   - Verifica que las órdenes recientes muestren montos en lugar de "S/ 0.00"

2. **Para verificar la asignación de admin:**
   - Ve a Admin → Gestión de Usuarios (AdminUsers)
   - Intenta crear un nuevo usuario con rol "Administrador"
   - O edita un usuario existente y cambia su rol a "admin"

---

## Archivos Relacionados

- `src/pages/AdminSales.jsx` - Página de resumen de ventas
- `src/pages/AdminUsers.jsx` - Gestor de usuarios
- `supabase-fix-profiles.sql` - Script SQL actualizado
- `fix-rls-admin-update.sql` - Script específico para políticas RLS

---

## Soporte

Si después de hacer estos cambios aún tienes problemas:

1. Abre la consola del navegador (F12) 
2. Ve a la pestaña "Console"
3. Intenta crear/editar un usuario admin
4. Revisa los mensajes de error en la consola (habrá logs detallados)
