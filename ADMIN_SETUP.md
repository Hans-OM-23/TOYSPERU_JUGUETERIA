# Guía completa: Registrar y verificar administrador

## Problema común
Cambiar `role` a `'admin'` directamente en Supabase no surte efecto porque:
1. El frontend **carga el rol solo al iniciar sesión**, no cuando cambias la BD.
2. La sesión sigue activa con el rol antiguo cacheado.

## ✅ Solución paso a paso

### Opción A: Registrar nuevo usuario y promocionar

1. **Registrar usuario normalmente**
   - Ve a `/login` en tu app
   - Haz clic en "Crear cuenta"
   - Completa: nombre, apellidos, ciudad, teléfono, email, password
   - Rol: puedes elegir "Administrador (solicitar)" pero se creará como `user` igual (por seguridad)
   - Haz clic en "Registrarme"

2. **Copiar el UUID del usuario**
   - Opción 1: Ve a Supabase → Authentication → Users → copia el UUID
   - Opción 2: En la consola del navegador (F12):
     ```javascript
     const { data: { session } } = await supabase.auth.getSession()
     console.log('Mi UUID:', session?.user?.id)
     ```

3. **Promocionar en Supabase SQL Editor**
   Ejecuta (reemplaza `<UUID>`):
   ```sql
   update public.profiles 
   set role = 'admin' 
   where id = '<UUID_DEL_USUARIO>';
   ```

4. **Cerrar sesión y volver a iniciar**
   - En la app, haz clic en "Salir"
   - Inicia sesión nuevamente con el mismo email/password
   - Ahora el header debe mostrar "Admin" y enlace al panel

### Opción B: Promocionar usuario existente

Si ya tienes un usuario registrado como `user`:

1. **Obtén tu UUID** (igual que arriba)

2. **Actualiza en SQL**:
   ```sql
   update public.profiles 
   set role = 'admin' 
   where id = '<UUID>';
   ```

3. **Cierra sesión y vuelve a iniciar**

## 🔍 Verificar que funciona

### 1. Verificar en consola del navegador

Tras iniciar sesión como admin, abre DevTools (F12) → Consola y ejecuta:

```javascript
// Ver rol actual
const { data: { session } } = await supabase.auth.getSession()
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single()
console.log('Perfil:', profile)
```

Debe mostrar `role: "admin"`.

### 2. Usar la página de diagnóstico

- Ve a `/admin/diagnostic` en tu app
- Haz clic en "🔍 Ejecutar diagnóstico"
- Verifica:
  - ✅ Sesión autenticada
  - ✅ Perfil con `role: "admin"`
  - ✅ Todos los permisos CRUD sobre productos

### 3. Probar CRUD de productos

- Ve a `/admin`
- Intenta:
  - **Crear** producto → clic en "+ Nuevo", completa y guarda
  - **Editar** producto → clic en "Editar", cambia precio y guarda
  - **Eliminar** producto → clic en "Eliminar", confirma

Si alguna acción falla, verás el error en:
- Modal (mensaje rojo)
- Consola del navegador (con emoji ❌)

## 🛠️ Solución de problemas

### El rol sigue siendo "user" después del UPDATE

**Causa**: La sesión está cacheada.

**Solución**:
1. Cierra sesión en la app ("Salir")
2. Cierra la pestaña del navegador (por si hay cache)
3. Abre nueva pestaña → `/login` → inicia sesión

### Error "permission denied" al crear/editar producto

**Causa**: Las políticas RLS no están aplicadas o el rol no es admin.

**Solución**:
1. Ve a `/admin/diagnostic` y verifica el rol
2. Si rol es correcto pero permisos fallan, revisa SQL:
   ```sql
   -- Verifica que exista la política
   select polname, polcmd from pg_policy where polrelid = 'productos'::regclass;
   ```
3. Re-ejecuta el script SQL completo (el que te proporcioné antes)

### El perfil no existe (error 42P01 o "not found")

**Causa**: El trigger `handle_new_user` no se ejecutó.

**Solución**:
```sql
-- Crear manualmente el perfil
insert into public.profiles (id, role) 
values ('<UUID_DEL_USUARIO>', 'admin')
on conflict (id) do update set role = 'admin';
```

### La página /admin dice "Acceso restringido"

**Comprobaciones**:
1. ¿El rol en el header dice "admin"? Si no, reinicia sesión.
2. ¿La consola del navegador muestra el log "✅ Profile loaded: { role: 'admin' }"?
3. Usa `/admin/diagnostic` para ver qué está pasando.

## 📝 Checklist de configuración completa

- [ ] Ejecutado el script SQL completo (tablas, RLS, trigger)
- [ ] Variables `.env` configuradas (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Usuario registrado en la app
- [ ] UUID del usuario copiado
- [ ] SQL `update profiles set role='admin'` ejecutado
- [ ] Cerrar sesión y volver a iniciar
- [ ] Header muestra enlace "Admin"
- [ ] `/admin` accesible sin "Acceso restringido"
- [ ] Diagnóstico en `/admin/diagnostic` muestra todos los permisos ✓
- [ ] Crear, editar y eliminar productos funciona sin errores

## 🎯 Consejo final

Para evitar problemas:
- **Siempre reinicia sesión** después de cambiar el rol en la BD.
- **Usa el diagnóstico** antes de intentar modificar productos.
- **Revisa la consola del navegador** (F12) si algo falla: los logs con emoji te dirán exactamente qué está mal.

---

¿Necesitas ayuda? Revisa:
1. Consola del navegador (errores de Supabase)
2. Logs de Supabase (sección "Logs" → filtro "rest" y "auth")
3. `/admin/diagnostic` en la app
