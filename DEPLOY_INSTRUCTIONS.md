# 🚀 Instrucciones para Deploy en Vercel

## 📋 Pasos para subir a GitHub

1. **Completar autenticación de Git** (si no lo has hecho):
   ```bash
   git push origin main
   ```
   - Se abrirá una ventana del navegador para autenticarte
   - Autoriza el acceso a GitHub
   - Espera a que se complete el push

2. **Verificar que el push fue exitoso**:
   ```bash
   git status
   ```
   - Debería mostrar: "Your branch is up to date with 'origin/main'"

## 🌐 Deploy en Vercel

### Opción A: Deploy desde la interfaz web

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Click en "Add New Project"
4. Importa tu repositorio `ToysPeru-Jugeteria`
5. **IMPORTANTE**: Configura las variables de entorno:
   - `VITE_SUPABASE_URL` = `https://rdpbtwjuwmparbdtqoli.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcGJ0d2p1d21wYXJiZHRxb2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjIxNjMsImV4cCI6MjA3OTU5ODE2M30.w62RK311sJF1X-7SIaiKgj12g36ZYczgDU_bJ6WNSTQ`
6. Click en "Deploy"
7. ¡Listo! Tu sitio estará en línea en unos minutos

### Opción B: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy a producción
vercel --prod
```

## ⚙️ Variables de Entorno en Vercel

**IMPORTANTE**: Asegúrate de agregar estas variables en Vercel:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://rdpbtwjuwmparbdtqoli.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## 🔧 Configuración de Supabase (OBLIGATORIO)

Antes de usar la aplicación, ejecuta este SQL en Supabase:

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a "SQL Editor"
3. Copia y pega todo el contenido de `supabase-fix-profiles.sql`
4. Ejecuta el script
5. Verifica que aparezca: "✅ Configuración completada exitosamente"

## 📝 Notas

- El archivo `.env` NO está en GitHub (correcto)
- Usa `.env.example` como referencia para configurar variables locales
- Cada push a la rama `main` disparará un nuevo deploy automático en Vercel

## 🐛 Solución de Problemas

### Error: "Missing environment variables"
- Verifica que agregaste las variables en Vercel
- Redeploy el proyecto después de agregar las variables

### Error al crear perfil
- Asegúrate de haber ejecutado `supabase-fix-profiles.sql` en Supabase
- Verifica que la función RPC `create_profile_on_signup` exista

### Build falla en Vercel
- Verifica que `package.json` tenga todos los scripts necesarios
- Revisa los logs de build en Vercel para más detalles
