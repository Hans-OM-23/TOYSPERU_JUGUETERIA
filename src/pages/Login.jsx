import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { signIn, signUp, user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [telefono, setTelefono] = useState('')
  const [selRole, setSelRole] = useState('user')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  if (user && !loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-elevated p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Ya estás autenticado</h2>
          <p className="text-gray-600 mb-6">Rol: <span className="font-semibold">{role}</span></p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold"
          >Ir al inicio</button>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setStatus('')
    try {
      if (isRegister) {
        if (!nombre.trim() || !apellidos.trim() || !ciudad.trim() || !telefono.trim()) {
          setError('Por favor completa nombre, apellidos, ciudad y teléfono.')
          return
        }
        await signUp({ email, password, nombre, apellidos, ciudad, telefono, role: selRole })
        setStatus(selRole === 'admin'
          ? 'Registro exitoso. Se solicitó rol Administrador (requiere aprobación). Revisa tu correo si se requiere confirmación.'
          : 'Registro exitoso. Revisa tu correo si se requiere confirmación.')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Apellidos</label>
                <input
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Ciudad</label>
                <input
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1">Rol</label>
                <select
                  value={selRole}
                  onChange={(e) => setSelRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador (solicitar)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Nota: por seguridad, las cuentas nuevas se crean con rol "Usuario". El rol administrador requiere aprobación.</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}
          {status && <div className="text-green-600 text-sm font-semibold">{status}</div>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg"
          >{isRegister ? 'Registrarme' : 'Ingresar'}</button>
        </form>
        <div className="text-center text-sm">
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button
            onClick={() => setIsRegister(r => !r)}
            className="text-indigo-600 font-semibold hover:underline"
          >{isRegister ? 'Inicia sesión' : 'Crear una cuenta'}</button>
        </div>
      </div>
    </div>
  )
}
