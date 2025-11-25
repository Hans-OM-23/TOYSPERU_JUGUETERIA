-- ============================================
-- SCRIPT COMPLETO SUPABASE - JUGUETERÍA ALEGRE
-- ============================================
-- Ejecuta TODO este script en el Editor SQL de Supabase
-- (puedes copiar y pegar todo de una vez)

-- ============================================
-- 0) EXTENSIONES
-- ============================================
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================
-- 1) TABLA PERFILES (AUTH) - PRIMERO
-- ============================================
-- Estructura de perfiles con datos de registro extendidos
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('user','admin')) default 'user',
  nombre text,
  apellidos text,
  ciudad text,
  telefono text,
  requested_role text, -- guarda si el usuario solicitó admin (aprobación manual)
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Políticas (limpia si existen)
drop policy if exists profiles_public_select on public.profiles;
drop policy if exists profiles_own_insert on public.profiles;
drop policy if exists profiles_own_update on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;

-- Lectura pública (puedes endurecerla más adelante si quieres)
create policy profiles_public_select
  on public.profiles for select
  using (true);

-- Insert sólo del propio usuario (id == auth.uid())
create policy profiles_own_insert
  on public.profiles for insert
  with check (auth.uid() = id);

-- Update sólo del propio usuario
create policy profiles_own_update
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Acceso total para administradores
create policy profiles_admin_all
  on public.profiles for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Trigger para autogenerar un perfil al crear un usuario (opcional pero recomendado)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Si el usuario es el admin predefinido, lo crea con rol admin
  if new.email = '75937419@continental.edu.pe' then
    insert into public.profiles (id, role)
    values (new.id, 'admin')
    on conflict (id) do update set role = 'admin';
  else
    -- Resto de usuarios con rol user
    insert into public.profiles (id, role)
    values (new.id, 'user')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2) TABLA PRODUCTOS
-- ============================================
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

-- Políticas (limpia si existen)
drop policy if exists productos_public_select on public.productos;
drop policy if exists productos_admin_mod on public.productos;

-- Lectura pública
create policy productos_public_select
  on public.productos for select
  using (true);

-- CRUD sólo admins (verifica rol en tabla profiles)
create policy productos_admin_mod
  on public.productos for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Datos iniciales (usa URLs reales de Unsplash)
insert into public.productos (nombre, precio, es_destacado, categoria, stock, descripcion, imagen_url) values
('Osito de peluche', 15.99, true, 'Peluches', 20, 'Suave osito ideal para abrazar.', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop'),
('Bloques de construcción', 24.50, true, 'Construcción', 15, 'Set para construir castillos y torres.', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop'),
('Carrito de carreras', 19.00, true, 'Vehículos', 10, 'Auto veloz con diseño aerodinámico.', 'https://images.unsplash.com/photo-1618556450991-2b705c5b5cfe?q=80&w=800&auto=format&fit=crop'),
('Rompecabezas 100 piezas', 9.99, true, 'Puzzles', 30, 'Paisaje colorido para armar en familia.', 'https://images.unsplash.com/photo-1524324463413-77b9b93f601b?q=80&w=800&auto=format&fit=crop'),
('Muñeca articulada', 29.50, true, 'Muñecas', 8, 'Muñeca con accesorios y ropa intercambiable.', 'https://images.unsplash.com/photo-1596464716121-f23c0b0b6289?q=80&w=800&auto=format&fit=crop'),
('Dinosaurio de goma', 12.99, true, 'Dinosaurios', 25, 'Tiranosaurio Rex realista y flexible.', 'https://images.unsplash.com/photo-1551993005-75c4131b6bd8?q=80&w=800&auto=format&fit=crop'),
('Set de cocina infantil', 34.99, false, 'Juguetes de rol', 12, 'Cocina completa con accesorios.', 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?q=80&w=800&auto=format&fit=crop'),
('Pelota inflable gigante', 8.50, false, 'Deportes', 40, 'Pelota de playa de 1 metro de diámetro.', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=800&auto=format&fit=crop');

-- ============================================
-- 3) TABLA ÓRDENES (CHECKOUT) - para guardar compra y datos de envío/pago
-- ============================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total numeric(10,2) not null,
  status text default 'pending', -- pending, paid, cancelled
  -- Datos de envío facturación básicos
  nombre text,
  apellidos text,
  ciudad text,
  telefono text,
  direccion text,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

-- Políticas orders
drop policy if exists orders_own_select on public.orders;
drop policy if exists orders_own_insert on public.orders;
drop policy if exists orders_own_update on public.orders;
drop policy if exists orders_admin_all on public.orders;

-- El usuario ve sus propias órdenes
create policy orders_own_select
  on public.orders for select
  using (auth.uid() = user_id);

-- El usuario crea sus propias órdenes
create policy orders_own_insert
  on public.orders for insert
  with check (auth.uid() = user_id);

-- El usuario puede actualizar su orden (opcional, por ejemplo para cancelar)
create policy orders_own_update
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admin acceso total
create policy orders_admin_all
  on public.orders for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Items de la orden
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.productos(id),
  nombre text not null,
  precio numeric(10,2) not null,
  qty integer not null check (qty > 0)
);

alter table public.order_items enable row level security;

-- Políticas order_items (align con orders)
drop policy if exists order_items_own_select on public.order_items;
drop policy if exists order_items_own_insert on public.order_items;
drop policy if exists order_items_admin_all on public.order_items;

create policy order_items_own_select
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy order_items_own_insert
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy order_items_admin_all
  on public.order_items for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- ============================================
-- 4) UTILIDADES Y VERIFICACIÓN
-- ============================================

-- Verificar tablas creadas
-- select tablename from pg_tables where schemaname='public';

-- Verificar políticas
-- select polname, polcmd from pg_policy where polrelid = 'productos'::regclass;
-- select polname, polcmd from pg_policy where polrelid = 'profiles'::regclass;

-- ============================================
-- 5) PROMOCIONAR UN USUARIO A ADMIN
-- ============================================
-- El email 75937419@continental.edu.pe se crea automáticamente como admin
-- gracias al trigger handle_new_user()

-- Para promocionar OTROS usuarios a admin manualmente:
-- IMPORTANTE: Reemplaza <UUID_DEL_USUARIO> con el UUID real de tu usuario
-- Puedes obtenerlo en: Authentication > Users > copiar UUID
-- O desde la consola del navegador:
-- const { data: { session } } = await supabase.auth.getSession()
-- console.log('Mi UUID:', session?.user?.id)

-- Descomenta y ejecuta esta línea después de obtener el UUID:
-- update public.profiles set role = 'admin' where id = '<UUID_DEL_USUARIO>';

-- Ejemplo (NO USES ESTE UUID, es de ejemplo):
-- update public.profiles set role = 'admin' where id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- O promocionar por email:
-- update public.profiles 
-- set role = 'admin' 
-- where id = (select id from auth.users where email = 'otro@correo.com');

-- ============================================
-- 6) CONSULTAS ÚTILES DE VERIFICACIÓN
-- ============================================

-- Ver todos los perfiles
-- select id, role, nombre, apellidos, requested_role from public.profiles;

-- Ver todos los productos
-- select id, nombre, precio, stock, es_destacado from public.productos;

-- Ver órdenes recientes
-- select id, user_id, total, status, created_at from public.orders order by created_at desc limit 10;

-- Contar productos por categoría
-- select categoria, count(*) from public.productos group by categoria;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Después de ejecutar:
-- 1. Registra un usuario en tu app (/login)
-- 2. Copia su UUID de Authentication > Users
-- 3. Ejecuta: update public.profiles set role = 'admin' where id = '<UUID>';
-- 4. Cierra sesión y vuelve a iniciar
-- 5. Verifica en /admin/diagnostic que todo funciona
