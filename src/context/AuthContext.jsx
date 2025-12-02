import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Simple Auth context to expose session, user, role and helpers
const AuthContext = createContext({
  session: null,
  user: null,
  role: 'guest',
  loading: true,
  signIn: async () => { },
  signUp: async () => { },
  signOut: async () => { },
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('guest')
  const [loading, setLoading] = useState(true)

  // Load current session
  useEffect(() => {
    let mounted = true
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchRole(session.user.id)
      } else {
        setLoading(false)
      }
    }
    init()
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        fetchRole(newSession.user.id)
      } else {
        setRole('guest')
      }
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function fetchRole(userId) {
    // Profiles table expected: id uuid PK references auth.users, role text default 'user'
    console.log('Cargando rol para usuario:', userId)

    // Primero intentar buscar por ID
    let { data, error } = await supabase
      .from('profiles')
      .select('role, nombre, apellidos, requested_role, email, id')
      .eq('id', userId)
      .single()

    // Si no encuentra por ID, buscar por email
    if (error && error.code === 'PGRST116') {
      console.log('No perfil encontrado por ID, buscando por email...')
      const userEmail = user?.email
      if (userEmail) {
        const { data: profileByEmail, error: emailError } = await supabase
          .from('profiles')
          .select('role, nombre, apellidos, requested_role, email, id')
          .eq('email', userEmail)
          .single()

        if (!emailError && profileByEmail) {
          console.log('Perfil encontrado por email, sincronizando datos...')

          // Si encontró por email, hacer una superposición (overwrite) de los datos
          // Copiar los datos del usuario autenticado al perfil encontrado
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                id: userId,  // Usar el ID correcto del usuario autenticado
                email: userEmail,
                role: profileByEmail.role || 'user',
                nombre: profileByEmail.nombre || null,
                apellidos: profileByEmail.apellidos || null,
                requested_role: profileByEmail.requested_role || 'user',
                updated_at: new Date().toISOString()
              })
              .eq('email', userEmail)

            if (updateError) {
              console.error('Error al sincronizar perfil:', updateError)
            } else {
              console.log('Datos sincronizados correctamente')
            }
          } catch (e) {
            console.error('Error en sincronización:', e)
          }

          data = profileByEmail
          error = null
        }
      }
    }

    if (error) {
      console.error('Error al cargar perfil:', error.message, error.code)
      console.warn('No profile found or RLS blocked, defaulting to user')
      setRole('user')
      setLoading(false)
    } else {
      const roleFromDB = data?.role || 'user'
      console.log('Profile loaded:', {
        userId: userId.substring(0, 8) + '...',
        role: roleFromDB,
        requested: data?.requested_role,
        nombre: data?.nombre
      })
      setRole(roleFromDB)
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp({ email, password, nombre, apellidos, pais, ciudad, telefono }) {
    try {
      // Paso 1: Crear usuario en auth.users
      console.log('Paso 1: Registrando usuario en auth.users con email:', email?.trim())
      const { data, error } = await supabase.auth.signUp({
        email: email?.trim(),
        password
      })

      if (error) {
        console.error('Error en auth.signUp:', error)
        throw new Error(`Error de autenticación: ${error.message}`)
      }

      if (!data.user?.id) {
        throw new Error('No se pudo obtener el ID del usuario después del registro')
      }

      const userId = data.user.id
      console.log('✓ Usuario creado en auth.users con ID:', userId.substring(0, 8) + '...')

      // Paso 2: Esperar un momento para que auth.users esté completamente sincronizado
      await new Promise(resolve => setTimeout(resolve, 1000)) // Aumentado a 1 segundo

      // Paso 3: Insertar perfil en la tabla profiles USANDO RPC con reintentos
      console.log('🚀 Paso 2: Llamando función RPC create_profile_on_signup...')

      let rpcResult = null
      let rpcError = null
      const maxRetries = 3

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Intento ${attempt}/${maxRetries}...`)
        
        const { data, error } = await supabase
          .rpc('create_profile_on_signup', {
            user_id: userId,
            user_email: email?.trim() || null,
            user_nombre: nombre?.trim() || null,
            user_apellidos: apellidos?.trim() || null,
            user_pais: pais?.trim() || null,
            user_ciudad: ciudad?.trim() || null,
            user_telefono: telefono?.toString()?.trim() || null
          })

        rpcResult = data
        rpcError = error

        if (!error && data?.success) {
          console.log(`✓ Perfil creado exitosamente en intento ${attempt}`)
          break
        }

        if (error) {
          console.warn(`⚠️ Error en intento ${attempt}:`, error.message)
          
          // Si no es el último intento, esperar antes de reintentar
          if (attempt < maxRetries) {
            const waitTime = attempt * 500 // 500ms, 1000ms, 1500ms
            console.log(`Esperando ${waitTime}ms antes del siguiente intento...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        } else if (!data?.success) {
          console.warn(`⚠️ RPC retornó error en intento ${attempt}:`, data)
          
          // Si no es el último intento, esperar antes de reintentar
          if (attempt < maxRetries) {
            const waitTime = attempt * 500
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }
      }

      if (rpcError) {
        console.error('❌ RPC falló:', {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint
        })

        // Mensaje más específico según el tipo de error
        if (rpcError.code === '23503') {
          throw new Error(
            'Error de sincronización: El usuario no se encontró en la base de datos. ' +
            'Por favor, espera unos segundos e intenta nuevamente.'
          )
        } else if (rpcError.code === '23505') {
          throw new Error('Este email ya está registrado. Por favor usa otro email.')
        } else {
          throw new Error(`Error al crear perfil: ${rpcError.message}`)
        }
      }

      if (rpcResult?.success) {
        console.log('✓ Perfil creado exitosamente:', rpcResult.message)
      } else {
        console.error('❌ RPC retornó error:', rpcResult)
        throw new Error(`Error en RPC: ${rpcResult?.message || 'Error desconocido'}`)
      }

      console.log('✅ Registro completado: usuario y perfil creados exitosamente')
      return data

    } catch (e) {
      console.error('💥 Error crítico en signUp:', {
        message: e.message,
        stack: e.stack
      })
      throw e
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setRole('guest')
  }

  const value = { session, user, role, loading, signIn, signUp, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
