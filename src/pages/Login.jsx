import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const PAISES_LATAM = [
  'Argentina',
  'Bolivia',
  'Brasil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'Guatemala',
  'Guyana',
  'Haití',
  'Honduras',
  'Jamaica',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Puerto Rico',
  'República Dominicana',
  'Surinam',
  'Uruguay',
  'Venezuela'
]

export default function LoginPage() {
  const { signIn, signUp, user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  // Para registro: parte local y dominio seleccionado
  const [emailLocal, setEmailLocal] = useState('')
  const [emailDomain, setEmailDomain] = useState('gmail.com')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [pais, setPais] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [telefono, setTelefono] = useState('')
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
        const composedEmail = `${emailLocal.trim()}@${emailDomain}`.toLowerCase()
        if (!emailLocal.trim()) {
          setError('Ingresa tu nombre de usuario en el email (ejemplo: juan.perez o tu.nombre)')
          return
        }
        // Validar que el email local no sea solo números (excepto para @continental.edu.pe que usa IDs)
        if (/^\d+$/.test(emailLocal.trim()) && emailDomain !== 'continental.edu.pe') {
          setError('El email no puede ser solo números. Usa tu nombre o usuario (ejemplo: juan.perez)')
          return
        }
        if (!nombre.trim() || !apellidos.trim() || !pais.trim() || !ciudad.trim() || !telefono.trim()) {
          setError('Por favor completa nombre, apellidos, país, ciudad y teléfono.')
          return
        }
        await signUp({ email: composedEmail, password, nombre, apellidos, pais, ciudad, telefono })
        setStatus('Registro exitoso. Revisa tu correo si se requiere confirmación.')
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
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Apellidos</label>
                <input
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">País</label>
                <select
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                >
                  <option value="">Selecciona un país</option>
                  {PAISES_LATAM.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Ciudad</label>
                <input
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                />
              </div>
            </div>
          )}
          {isRegister ? (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
              <div className="flex gap-2">
                <input
                  id="email-local"
                  type="text"
                  placeholder={emailDomain === 'continental.edu.pe' ? 'ID (ej: 75937419)' : 'nombre.apellido'}
                  value={emailLocal}
                  onChange={(e) => {
                    const val = e.target.value
                    // Si el usuario pega un correo completo, partirlo
                    if (val.includes('@')) {
                      const [local, domain] = val.split('@')
                      setEmailLocal(local)
                      if (['gmail.com', 'continental.edu.pe', 'outlook.com'].includes(domain)) {
                        setEmailDomain(domain)
                      }
                    } else {
                      setEmailLocal(val)
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  required
                />
                <div className="min-w-[12rem]">
                  <select
                    id="email-domain"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="gmail.com">@gmail.com</option>
                    <option value="continental.edu.pe">@continental.edu.pe</option>
                    <option value="outlook.com">@outlook.com</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email: <span className="font-semibold">{emailLocal || (emailDomain === 'continental.edu.pe' ? 'ID' : 'nombre.apellido')}@{emailDomain}</span>
                {/^\d+$/.test(emailLocal) && emailDomain !== 'continental.edu.pe' && <span className="text-red-600 ml-2">⚠️ No uses solo números</span>}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
