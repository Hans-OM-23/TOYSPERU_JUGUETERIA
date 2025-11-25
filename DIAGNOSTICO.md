# 🔧 DIAGNÓSTICO RÁPIDO - Problemas de Supabase

## Problema 1: Productos no sincronizados
**Síntomas**: Los productos no se cargan desde Supabase

**Causas posibles**:
1. ❌ Script SQL no ejecutado en Supabase
2. ❌ Tabla `productos` vacía o no existe
3. ❌ Variables de entorno mal configuradas
4. ❌ Dev server no reiniciado tras cambiar `.env`

**Solución**:
1. Ejecuta el script SQL completo en Supabase (supabase-setup.sql)
2. Verifica que se insertaron productos:
   ```sql
   select count(*) from public.productos;
   ```
3. Reinicia el dev server:
   ```powershell
   # Presiona Ctrl+C para detener
   cmd /c "npm run dev"
   ```
4. Abre consola del navegador (F12) y busca logs:
   - ✅ "Productos cargados: 8 productos"
   - ❌ "Error de Supabase: ..."

## Problema 2: Rol admin no funciona
**Síntomas**: Usuario no tiene permisos de admin

**Causas posibles**:
1. ❌ Script SQL no ejecutado (falta trigger)
2. ❌ Usuario registrado ANTES de ejecutar el script
3. ❌ No se reinició sesión después de cambiar rol
4. ❌ Políticas RLS mal aplicadas

**Solución**:
1. Ejecuta el script SQL completo
2. Si ya existe el usuario, promociónalo manualmente:
   ```sql
   update public.profiles 
   set role = 'admin' 
   where id = (
     select id from auth.users 
     where email = '75937419@continental.edu.pe'
   );
   ```
3. **IMPORTANTE**: Cierra sesión y vuelve a iniciar
4. Verifica en consola (F12):
   - Busca: "✅ Profile loaded: { role: 'admin' }"

## Verificación completa

### 1. Verifica .env
Archivo: `d:\ProyectoSemana14\.env`
```
VITE_SUPABASE_URL=https://qtpjucboyuvtugcimeig.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (tu key)
```

### 2. Verifica SQL ejecutado
En Supabase SQL Editor:
```sql
-- Ver tablas
select tablename from pg_tables where schemaname='public';
-- Debe mostrar: profiles, productos, orders, order_items

-- Ver productos
select id, nombre, precio from public.productos limit 5;
-- Debe mostrar al menos 8 productos

-- Ver perfiles
select id, role, nombre from public.profiles;
-- Debe mostrar tu usuario
```

### 3. Reinicia dev server
```powershell
# En terminal powershell
cmd /c "npm run dev"
```

### 4. Abre la app y revisa consola
1. Ve a http://localhost:5173
2. Abre DevTools (F12) → Console
3. Busca estos logs:
   ```
   🔧 Configuración Supabase:
     url: ✓ Configurado
     key: ✓ Configurado
   
   🔄 Cargando productos desde Supabase...
   ✅ Productos cargados: 8 productos
   
   🔍 Cargando rol para usuario: abc123...
   ✅ Profile loaded: { role: 'admin', ... }
   ```

### 5. Prueba diagnóstico en la app
1. Inicia sesión con `75937419@continental.edu.pe`
2. Ve a `/admin/diagnostic`
3. Clic "🔍 Ejecutar diagnóstico"
4. Verifica que TODO salga en verde ✓

## Checklist de solución

- [ ] Archivo `.env` existe con URL y KEY correctas
- [ ] Script SQL ejecutado en Supabase
- [ ] Tabla `productos` tiene datos (select count(*) ≥ 8)
- [ ] Tabla `profiles` existe
- [ ] Dev server reiniciado después de cambiar .env
- [ ] Usuario `75937419@continental.edu.pe` registrado
- [ ] Rol actualizado a 'admin' en BD
- [ ] Sesión cerrada y reiniciada
- [ ] Consola del navegador muestra logs ✅
- [ ] `/admin/diagnostic` muestra permisos en verde

## Si persiste el error

Comparte captura de:
1. Consola del navegador (F12) → pestaña Console
2. Resultado de `/admin/diagnostic`
3. Resultado SQL: `select * from public.profiles;`
