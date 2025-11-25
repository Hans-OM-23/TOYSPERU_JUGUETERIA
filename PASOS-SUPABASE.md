# 📋 Pasos para Sincronizar Productos con Supabase

## ✅ CAMBIOS REALIZADOS

Se eliminaron **TODOS** los productos locales del código. Ahora la aplicación:
- ✅ **SOLO** carga productos desde Supabase
- ✅ Muestra error claro si no puede conectar
- ✅ Indica si la tabla está vacía
- ✅ No tiene datos de respaldo

---

## 🔧 PASOS OBLIGATORIOS (Sigue este orden)

### 1️⃣ Ejecutar Script SQL en Supabase

1. Ve a tu proyecto: https://qtpjucboyuvtugcimeig.supabase.co
2. Click en **SQL Editor** (menú lateral)
3. Abre el archivo `supabase-setup.sql` en VS Code
4. **Copia TODO** el contenido del archivo
5. Pégalo en el SQL Editor de Supabase
6. Click en **▶ Run** (esquina superior derecha)

**Verifica que se ejecutó correctamente:**
```sql
-- Ejecuta esto en el SQL Editor para verificar:
select tablename from pg_tables where schemaname='public';
```

Debe mostrar:
- ✓ profiles
- ✓ productos
- ✓ orders
- ✓ order_items

```sql
-- Verifica que hay productos:
select count(*) from public.productos;
```

Debe mostrar: **8 productos** (u otro número mayor a 0)

---

### 2️⃣ Verificar .env

Abre el archivo `.env` y confirma que tiene:

```env
VITE_SUPABASE_URL=https://qtpjucboyuvtugcimeig.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGp1Y2JveXV2dHVnY2ltZWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0OTUzNzMsImV4cCI6MjA0ODA3MTM3M30.LSXY7uqyI04raTcKZL5V3Oz-CdLqXpRzd2wWWQlHWOE
```

⚠️ **IMPORTANTE**: Si modificaste este archivo, **debes reiniciar el servidor**.

---

### 3️⃣ Reiniciar el Servidor de Desarrollo

En la terminal de VS Code:

1. **Presiona `Ctrl + C`** para detener el servidor actual
2. Ejecuta:

```powershell
npm run dev
```

3. Espera a ver:
```
➜  Local:   http://localhost:5173/
```

---

### 4️⃣ Abrir la Aplicación y Verificar

1. Ve a: http://localhost:5173
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Busca estos mensajes:

**✅ Si todo funciona:**
```
🔧 Configuración Supabase:
  url: ✓ Configurado
  key: ✓ Configurado

🔄 Cargando productos desde Supabase...
✅ Productos cargados desde Supabase: 8 productos
📦 Datos recibidos: (8) [{...}, {...}, ...]
```

**❌ Si hay error:**
```
❌ Error de Supabase: relation "public.productos" does not exist
```
→ No ejecutaste el script SQL. Vuelve al paso 1.

**⚠️ Si sale mensaje amarillo:**
```
📦 No hay productos
La tabla de productos está vacía en Supabase.
```
→ El script se ejecutó pero no insertó productos. Ejecuta nuevamente el SQL.

---

### 5️⃣ Ver los Productos

1. Ve a la página de **Productos**: http://localhost:5173/productos
2. Deberías ver los **8 productos** de la base de datos:
   - Lego Star Wars Millennium Falcon
   - Barbie Dreamhouse
   - Hot Wheels Track Builder
   - Monopoly Edición Clásica
   - Nerf Elite 2.0 Commander
   - Play-Doh Super Color Pack
   - Funko Pop! Batman
   - Jenga Classic

---

## 🧪 Verificar que TODO funciona

### Test 1: Ver productos en Supabase
```sql
select id, nombre, precio from public.productos limit 5;
```

### Test 2: Consola del navegador (F12)
Debe mostrar: `✅ Productos cargados desde Supabase: 8 productos`

### Test 3: Interfaz visual
La página `/productos` debe mostrar tarjetas con imágenes, precios y botones.

---

## ❓ Problemas Comunes

### "Error: relation productos does not exist"
**Causa**: No ejecutaste el script SQL  
**Solución**: Ve al paso 1 y ejecuta `supabase-setup.sql`

### "Error: Invalid API Key"
**Causa**: Variables de entorno mal configuradas  
**Solución**: Verifica `.env` y reinicia el servidor (paso 2 y 3)

### "No hay productos"
**Causa**: Script ejecutado pero sin INSERT  
**Solución**: Ejecuta nuevamente TODO el script SQL

### "Cannot read properties of undefined"
**Causa**: Servidor no reiniciado tras cambiar `.env`  
**Solución**: Ctrl+C y `npm run dev` nuevamente

---

## 🎯 RESUMEN RÁPIDO

```bash
# 1. Ejecuta SQL en Supabase (copia supabase-setup.sql → SQL Editor → Run)
# 2. Verifica .env tenga URL y KEY correctos
# 3. Reinicia servidor:
npm run dev

# 4. Abre navegador:
# http://localhost:5173/productos

# 5. Verifica en consola (F12):
# ✅ Productos cargados desde Supabase: 8 productos
```

---

## 📞 Necesitas ayuda?

Si después de seguir TODOS los pasos aún no funciona, comparte:
1. Captura de pantalla de la consola del navegador (F12)
2. Resultado de este SQL en Supabase:
   ```sql
   select count(*) from public.productos;
   ```
