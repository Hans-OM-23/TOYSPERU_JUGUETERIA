import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Simple Auth context to expose session, user, role and helpers
const AuthContext = createContext({
  session: null,
  user: null,
  role: 'guest',
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
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
    console.log('🔍 Cargando rol para usuario:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('role, nombre, apellidos, requested_role')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('❌ Error al cargar perfil:', error.message, error.code)
      console.warn('⚠️ No profile found or RLS blocked, defaulting to user')
      setRole('user')
      setLoading(false)
    } else {
      const roleFromDB = data?.role || 'user'
      console.log('✅ Profile loaded:', { 
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

  async function signUp({ email, password, nombre, apellidos, ciudad, telefono, role: requestedRole }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    const safeRole = 'user' // Nunca otorgamos admin desde el registro
    const profilePayload = {
      id: data.user?.id,
      role: safeRole,
      nombre: nombre?.trim() || null,
      apellidos: apellidos?.trim() || null,
      ciudad: ciudad?.trim() || null,
      telefono: telefono?.toString()?.trim() || null,
      requested_role: requestedRole === 'admin' ? 'admin' : 'user',
    }
    try {
      if (data.user?.id) {
        // upsert permite crear o actualizar si ya existe (por trigger)
        await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' })
      }
    } catch (e) {
      // Fallback mínimo por si políticas aún no están aplicadas
      try {
        if (data.user?.id) {
          await supabase.from('profiles').insert({ id: data.user.id, role: safeRole })
        }
      } catch {}
    }
    return data
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
