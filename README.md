# 🧸 Juguetería Alegre - Frontend React + Tailwind

Aplicación web de e-commerce de juguetes construida con **React**, **Vite** y **Tailwind CSS**. Cuenta con carrito de compras funcional, búsqueda de productos, detalle de producto y formulario de contacto. Preparada para integrar **Supabase** como backend.

---

## 📋 Características

✅ **Header mejorado** con navegación, buscador funcional y contador de carrito  
✅ **Galería de productos** con grid responsivo  
✅ **Carrito lateral (drawer)** con controles +/− de cantidad  
✅ **Modal de detalle de producto** con cantidad seleccionable  
✅ **Búsqueda en tiempo real** de productos  
✅ **Formulario de contacto** con validación  
✅ **Estilos modernos** con gradientes y animaciones  
✅ **Almacenamiento local** con localStorage  
✅ **Totales calculados automáticamente** en carrito  
✅ **Rutas separadas** (`/`, `/productos`, `/contacto`, `/login`, `/admin`)  
✅ **Autenticación** con Supabase (email + password)  
✅ **Roles de usuario** (user / admin) y protección de acciones  
✅ **Panel administrador** para crear, editar y eliminar productos  

---

## 🚀 Instalación y Ejecución

### Requisitos
- **Node.js** 16+ (descargar de https://nodejs.org/)
- **npm** (viene con Node.js)

### Pasos

1. **Abre PowerShell** y navega a la carpeta del proyecto:
```powershell
cd 'C:\Diseño_Web\Diseño_Web\ProyectoSemana14\toy-store'
```

2. **Instala las dependencias** (solo la primera vez):
```powershell
npm install
```

3. **Inicia el servidor de desarrollo**:
```powershell
npm run dev
```

4. **Abre en el navegador**:
   - Copia la URL que aparece en la terminal (ej: `http://localhost:5173`)
   - Pégala en tu navegador favorito

5. **Para detener el servidor**: Presiona `Ctrl + C` en PowerShell

---

## 📂 Estructura del Proyecto

```
toy-store/
├── src/
│   ├── components/
│   │   ├── Header.jsx           # Navegación, búsqueda, carrito
│   │   ├── Body.jsx             # Listado de productos (filtrable)
│   │   ├── ProductCard.jsx       # Tarjeta de producto individual
│   │   ├── ProductDetail.jsx     # Modal de detalle con cantidad
│   │   ├── CartDrawer.jsx        # Drawer lateral del carrito
│   │   ├── Contact.jsx           # Formulario de contacto
│   │   └── Footer.jsx            # Pie de página
│   ├── lib/
│   │   ├── cart.js              # Utilidades del carrito (localStorage)
│   │   └── supabaseClient.js    # Cliente Supabase (stub)
│   ├── App.jsx                  # Componente raíz
│   ├── main.jsx                 # Punto de entrada
│   └── index.css                # Estilos globales
├── index.html                   # HTML raíz
├── vite.config.js               # Configuración de Vite
├── tailwind.config.cjs          # Configuración de Tailwind
├── postcss.config.cjs           # Configuración de PostCSS
├── package.json                 # Dependencias y scripts
└── README.md                    # Este archivo
```

---

## 🛠️ Comandos Disponibles

```powershell
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm build

# Previsualizar build
npm run preview

# Ver lista de scripts disponibles
npm run
```

---

## 🛒 Uso de la Aplicación

### 1. **Explorar Productos**
- Desplázate por la galería de productos
- Cada tarjeta muestra nombre, precio y dos botones

### 2. **Ver Detalle de Producto**
- Haz clic en **"Ver detalle"** → se abre un modal
- Usa botones **−** y **+** para cambiar cantidad
- Haz clic en **"Añadir X al carrito"** para confirmar

### 3. **Añadir al Carrito**
- Opción rápida: botón **"+ Añadir"** en tarjeta (cantidad 1)
- O desde el modal: selecciona cantidad y confirma
- El contador en el header se actualiza automáticamente

### 4. **Abrir Carrito Lateral**
- Haz clic en **🛒 Carrito** en el header
- Ve todos los items con cantidad, precio unitario y subtotal

### 5. **Controlar Cantidad en Carrito**
- Usa botones **−** (rojo) y **+** (verde) para cada item
- El total se recalcula en tiempo real
- Haz clic en **✕** para eliminar item completo

### 6. **Buscar Productos**
- Escribe en la barra de búsqueda en el header
- Los productos se filtran en tiempo real por nombre
- Limpia la búsqueda para ver todos nuevamente

### 7. **Enviar Contacto**
- Desplázate al apartado **"Contacto"**
- Completa nombre, email y mensaje
- Haz clic en **"Enviar mensaje"**
- Los mensajes se guardan localmente (localStorage)

### 8. **Limpiar Carrito**
- Haz clic en **"Vaciar carrito"** desde el drawer lateral

---

## 💾 Almacenamiento Local

Los datos se guardan en el navegador (no en servidor):

- **Carrito**: `toy_store_cart` (JSON en localStorage)
- **Contactos**: `toy_store_contacts` (JSON en localStorage)

Para borrar todos los datos: abre DevTools (F12) → Consola → `localStorage.clear()`

---

## 🔐 Autenticación y Roles (Supabase)

La aplicación ahora soporta login y registro usando **Supabase Auth**. Al registrarse se crea automáticamente un perfil con rol `user`. Puedes promover usuarios a `admin` para acceder al panel administrativo `/admin`.

### Variables de entorno
Agrega en `.env`:
```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### Tablas y SQL necesarias
Ejecuta este script en el Editor SQL de Supabase:
```sql
-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Tabla productos (si aún no existe limpia)
drop table if exists public.productos cascade;
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  nombre text not null,
  precio numeric(10,2) not null,
  imagen_url text,
  descripcion text,
  stock integer default 0,
  es_destacado boolean default false,
  categoria text,
  marca text,
  edad_minima integer,
  material text,
  es_novedad boolean default false,
  categoria_id bigint
);
alter table public.productos enable row level security;
create policy productos_public_select on public.productos for select using (true);
-- Solo administradores pueden modificar
create policy productos_admin_mod on public.productos for all using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

insert into public.productos (nombre, precio, es_destacado, categoria, stock, descripcion) values
('Osito de peluche', 15.99, true, 'Peluches', 20, 'Suave osito ideal para abrazar.'),
('Bloques de construcción', 24.50, true, 'Construcción', 15, 'Set para construir castillos y torres.'),
('Carrito de carreras', 19.00, true, 'Vehículos', 10, 'Auto veloz con diseño aerodinámico.'),
('Rompecabezas 100 piezas', 9.99, true, 'Puzzles', 30, 'Paisaje colorido para armar en familia.'),
('Muñeca articulada', 29.50, true, 'Muñecas', 8, 'Muñeca con accesorios y ropa intercambiable.');

-- Tabla perfiles para roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('user','admin')) default 'user',
  nombre text,
  apellidos text,
  ciudad text,
  telefono text,
  requested_role text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy profiles_public_select on public.profiles for select using (true);
create policy profiles_own_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_own_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_admin_all on public.profiles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Trigger opcional: crea un perfil por defecto al crear un usuario auth (si usas confirmación por email)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Promocionar un usuario a admin
Tras el registro, obtén el `id` del usuario en la consola de Supabase y ejecuta:
```sql
update public.profiles set role = 'admin' where id = '<UUID_DEL_USUARIO>';
```

### Flujo de autenticación
1. El usuario visita `/login` y se registra o inicia sesión.
2. Se crea (signUp) una fila en `profiles` con rol `user`.
3. El contexto (`AuthContext`) obtiene el rol y lo expone.
4. El header muestra botón **Admin** solo si `role === 'admin'`.
5. El carrito redirige a `/login` si intenta pagar sin sesión.
6. El panel `/admin` permite CRUD sobre productos.

### Seguridad
La modificación de productos está protegida por políticas que verifican el rol en la tabla `profiles`. Incluso si alguien intenta llamar a la API directamente, Supabase bloqueará la operación si no es administrador.

## 🔗 Próxima Integración: Supabase

### Preparación

1. **Crea una cuenta** en https://supabase.com (gratis)
2. **Crea un proyecto** nuevo
3. **Obtén las credenciales**:
   - `VITE_SUPABASE_URL` (API URL)
   - `VITE_SUPABASE_ANON_KEY` (anon key)

### Instalación

```powershell
npm install @supabase/supabase-js
```

### Configuración

1. **Crea archivo `.env`** en la raíz del proyecto (`toy-store/.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Descomenta en `src/lib/supabaseClient.js`**:
```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

3. **Reemplaza mock data en `src/components/Body.jsx`**:
```javascript
useEffect(() => {
  async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*')
    if (!error) setAllProducts(data)
  }
  loadProducts()
}, [])
```

4. **Guarda contactos en Supabase** (en `src/components/Contact.jsx`):
```javascript
await supabase.from('contacts').insert([
  { name, email, message, created_at: new Date() }
])
```

---

## 📱 Responsive Design

- ✅ **Móvil** (320px+): Stack vertical
- ✅ **Tablet** (768px+): Grid 2 columnas
- ✅ **Desktop** (1024px+): Grid 3 columnas
- ✅ Header adaptativo, carrito siempre accesible

---

## 🎨 Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18.x | Framework UI |
| Vite | 5.x | Bundler y dev server |
| Tailwind CSS | 3.x | Estilos |
| PostCSS | 8.x | Procesador CSS |
| Supabase (próximo) | - | Backend BaaS |

---

## 🐛 Solución de Problemas

### Puerto 5173 en uso
```powershell
# Vite usa otro puerto automáticamente, o mata el proceso:
Get-Process node | Stop-Process -Force
```

### Módulos no encontrados
```powershell
# Reinstala dependencias:
rm node_modules -r
rm package-lock.json
npm install
```

### Página en blanco
- Abre DevTools (F12) → **Consola**
- Busca errores de JavaScript
- Verifica que la URL sea `http://` (no `file://`)

### Carrito no guarda datos
- Abre DevTools → **Storage** → **Local Storage**
- Verifica que `toy_store_cart` exista
- Borra datos y refresca: `F5`

---

## 📝 Notas de Desarrollo

- **Estado global**: Usa `localStorage + eventos` (sin Redux/Context para simplicidad)
- **Componentes funcionales**: Todos usan hooks (useState, useEffect)
- **Estilos**: Tailwind utility-first, sin CSS custom
- **Sin dependencias pesadas**: Enfoque minimalista y performante

---

## 🚢 Desplegar a Producción

### Build
```powershell
npm run build
```

Genera carpeta `dist/` lista para producción.

### Opciones de hosting
- **Vercel**: https://vercel.com (recomendado para Vite/React)
- **Netlify**: https://netlify.com
- **GitHub Pages**: Requiere configuración adicional
- **Azure Static Web Apps**: Integración con Supabase

---

## 📧 Contacto / Soporte

Para preguntas o issues:
1. Revisa la consola del navegador (F12)
2. Verifica que Node.js esté instalado: `node -v`
3. Reinstala dependencias: `npm install`

---

## 📄 Licencia

Proyecto educativo. Libre para usar y modificar.

---

**Última actualización**: Noviembre 2025  
**Estado**: ✅ Funcional, listo para Supabase

