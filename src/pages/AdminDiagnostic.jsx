import React, { useState } from 'react'
import { checkAdminPermissions, printDiagnostic } from '../utils/adminDiagnostic'
import { useAuth } from '../context/AuthContext'

export default function AdminDiagnosticPage() {
  const { user, role } = useAuth()
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)

  async function runDiagnostic() {
    setRunning(true)
    const res = await checkAdminPermissions()
    printDiagnostic(res)
    setResults(res)
    setRunning(false)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-elevated p-8">
        <h1 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Diagnóstico de Permisos Admin
        </h1>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Usuario actual:</strong> {user?.email || 'No autenticado'}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Rol detectado:</strong> <span className={`font-bold ${role === 'admin' ? 'text-green-600' : 'text-orange-600'}`}>{role}</span>
          </p>
        </div>

        <button
          onClick={runDiagnostic}
          disabled={running}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 mb-6"
        >
          {running ? 'Ejecutando...' : '🔍 Ejecutar diagnóstico'}
        </button>

        {results && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-2">Sesión</h3>
              {results.session ? (
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(results.session, null, 2)}</pre>
              ) : (
                <p className="text-red-600">No autenticado</p>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-2">Perfil</h3>
              {results.profile ? (
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(results.profile, null, 2)}</pre>
              ) : (
                <p className="text-red-600">No encontrado</p>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-2">Permisos sobre productos</h3>
              <ul className="space-y-1">
                <li className={results.canReadProducts ? 'text-green-600' : 'text-red-600'}>
                  {results.canReadProducts ? '✓' : '✗'} Leer productos
                </li>
                <li className={results.canInsertProduct ? 'text-green-600' : 'text-red-600'}>
                  {results.canInsertProduct ? '✓' : '✗'} Insertar producto
                </li>
                <li className={results.canUpdateProduct ? 'text-green-600' : 'text-red-600'}>
                  {results.canUpdateProduct ? '✓' : '✗'} Actualizar producto
                </li>
                <li className={results.canDeleteProduct ? 'text-green-600' : 'text-red-600'}>
                  {results.canDeleteProduct ? '✓' : '✗'} Eliminar producto
                </li>
              </ul>
            </div>

            {results.errors.length > 0 && (
              <div className="border border-red-300 rounded-lg p-4 bg-red-50">
                <h3 className="font-bold mb-2 text-red-800">Errores detectados</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {results.errors.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">💡 Soluciones comunes:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Si el rol es "user" pero lo cambiaste en la BD: cierra sesión y vuelve a iniciar.</li>
                <li>Si los permisos fallan: verifica que las políticas RLS estén aplicadas (SQL correcto).</li>
                <li>Si el perfil no existe: el trigger handle_new_user debe crear la fila automáticamente.</li>
                <li>Si persiste el error: revisa la consola del navegador (F12) y los logs de Supabase.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
