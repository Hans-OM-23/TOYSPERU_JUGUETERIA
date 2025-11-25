# 🚨 GUÍA URGENTE - Ejecutar Script SQL

## ❌ ERROR ACTUAL
```
Error: Could not find the table 'public.productos' in the schema cache
```

**Causa**: No has ejecutado el script SQL en Supabase. Las tablas NO existen.

---

## ✅ SOLUCIÓN (5 minutos)

### PASO 1: Abrir Supabase
1. Ve a: https://qtpjucboyuvtugcimeig.supabase.co
2. Inicia sesión si no lo has hecho

### PASO 2: Ir al SQL Editor
1. En el menú lateral izquierdo, busca el ícono 📝 **SQL Editor**
2. Click en **SQL Editor**
3. Click en **New Query** (botón verde "+" arriba a la derecha)

### PASO 3: Copiar el Script
1. En VS Code, abre el archivo `supabase-setup.sql`
2. Presiona `Ctrl + A` (seleccionar todo)
3. Presiona `Ctrl + C` (copiar)

### PASO 4: Pegar y Ejecutar
1. En Supabase SQL Editor, **pega** el contenido completo (`Ctrl + V`)
2. Verifica que se pegó TODO (debería tener ~295 líneas)
3. Click en el botón **▶ RUN** (esquina superior derecha)

### PASO 5: Verificar
Deberías ver mensajes de éxito como:
```
Success. No rows returned
```

Ejecuta esto para confirmar:
```sql
select tablename from pg_tables where schemaname='public';
```

Debe mostrar:
- ✓ profiles
- ✓ productos
- ✓ orders
- ✓ order_items

### PASO 6: Verificar Productos
Ejecuta:
```sql
select count(*) from public.productos;
```

Debe mostrar: **8**

---

## 🔄 DESPUÉS del SQL

1. En VS Code, **reinicia el servidor**:
   ```powershell
   # Presiona Ctrl+C para detener
   npm run dev
   ```

2. Abre el navegador: http://localhost:5173/productos

3. Presiona **F12** → Console

4. Deberías ver:
   ```
   ✅ Productos cargados desde Supabase: 8 productos
   ```

---

## 📸 CAPTURAS DE AYUDA

### Así se ve el SQL Editor en Supabase:
```
┌─────────────────────────────────────────┐
│ 📝 SQL Editor                           │
│ ┌─────────────────────────────────────┐ │
│ │ + New query              ▶ RUN      │ │
│ ├─────────────────────────────────────┤ │
│ │                                     │ │
│ │ -- PEGA AQUÍ EL SCRIPT SQL         │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Donde está SQL Editor:
```
Supabase Dashboard
├── 🏠 Home
├── 📊 Table Editor
├── 📝 SQL Editor ← AQUÍ
├── 🔐 Authentication
└── ⚙️ Settings
```

---

## ⚠️ IMPORTANTE

- ✅ Ejecuta **TODO** el script de una sola vez
- ✅ NO ejecutes línea por línea
- ✅ NO modifiques el script
- ✅ Asegúrate de copiar las **295 líneas completas**

---

## 🆘 Si aún falla

Comparte:
1. Captura de Supabase SQL Editor tras ejecutar
2. Resultado de: `select tablename from pg_tables where schemaname='public';`
