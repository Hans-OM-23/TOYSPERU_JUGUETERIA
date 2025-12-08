import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AdminUsers() {
    const navigate = useNavigate()
    const { role } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editData, setEditData] = useState({})
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showNewUserForm, setShowNewUserForm] = useState(false)
    const [newUserData, setNewUserData] = useState({})

    const PAISES_LATAM = [
        'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
        'El Salvador', 'Guatemala', 'Guyana', 'Haití', 'Honduras', 'Jamaica', 'México', 'Nicaragua',
        'Panamá', 'Paraguay', 'Perú', 'Puerto Rico', 'República Dominicana', 'Surinam', 'Uruguay', 'Venezuela'
    ]

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/admin')
            return
        }
        loadUsers()
    }, [role, navigate])

    async function loadUsers() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            setError('Error cargando usuarios: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    function startEdit(user) {
        setEditingId(user.id)
        setEditData({ ...user })
        setShowNewUserForm(false)
        setError('')
    }

    function startNewUser() {
        setShowNewUserForm(true)
        setEditingId(null)
        setNewUserData({
            email: '',
            nombre: '',
            apellidos: '',
            pais: '',
            ciudad: '',
            telefono: '',
            role: 'user',
            requested_role: null
        })
        setError('')
    }

    async function saveEdit() {
        try {
            // Validar que se intenta cambiar a admin
            if (editData.role === 'admin') {
                console.log('Intentando cambiar rol a admin:', editData)
            }

            const { error } = await supabase
                .from('profiles')
                .update(editData)
                .eq('id', editingId)

            if (error) {
                console.error('Error de Supabase:', error)
                throw error
            }

            setSuccess('Usuario actualizado exitosamente')
            setEditingId(null)
            loadUsers()
        } catch (err) {
            console.error('Error al actualizar usuario:', err)
            setError('Error al actualizar usuario: ' + err.message)
        }
    }

    async function saveNewUser() {
        try {
            if (!newUserData.email || !newUserData.nombre) {
                setError('Email y nombre son obligatorios')
                return
            }

            console.log('Creando nuevo usuario con rol:', newUserData.role)

            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email: newUserData.email,
                password: Math.random().toString(36).slice(-12)
            })

            if (authError) {
                console.error('Error en signup:', authError)
                throw authError
            }

            if (user?.id) {
                const profileData = {
                    id: user.id,
                    email: newUserData.email,
                    nombre: newUserData.nombre,
                    apellidos: newUserData.apellidos || null,
                    pais: newUserData.pais || null,
                    ciudad: newUserData.ciudad || null,
                    telefono: newUserData.telefono || null,
                    role: newUserData.role || 'user',
                    requested_role: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }

                console.log('Insertando perfil:', profileData)

                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([profileData])

                if (profileError) {
                    console.error('Error al insertar perfil:', profileError)
                    throw profileError
                }
            }

            setSuccess('Usuario creado exitosamente (se envió enlace de confirmación al email)')
            setShowNewUserForm(false)
            setNewUserData({})
            loadUsers()
        } catch (err) {
            console.error('Error al crear usuario:', err)
            setError('Error al crear usuario: ' + err.message)
        }
    }

    async function deleteUser() {
        try {
            const { data, error } = await supabase
                .rpc('liberar_email', { email_to_release: deleteConfirm.email })

            if (error) throw error

            setSuccess('Usuario eliminado exitosamente')
            setDeleteConfirm(null)
            loadUsers()
        } catch (err) {
            setError('Error al eliminar usuario: ' + err.message)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-600">Cargando usuarios...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin')}
                        className="text-purple-200 hover:text-white mb-4 font-semibold"
                    >
                        ← Volver al Panel
                    </button>
                    <h1 className="text-4xl font-extrabold text-white">👥 Gestor de Usuarios</h1>
                    <p className="text-purple-200">Total de usuarios: {users.length}</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                {/* Botón Nuevo Usuario */}
                {!showNewUserForm && !editingId && (
                    <button
                        onClick={startNewUser}
                        className="mb-6 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
                    >
                        + Crear Nuevo Usuario
                    </button>
                )}

                {/* Formulario Nuevo Usuario */}
                {showNewUserForm && (
                    <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Crear Nuevo Usuario</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newUserData.email || ''}
                                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={newUserData.nombre || ''}
                                    onChange={(e) => setNewUserData({ ...newUserData, nombre: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Apellidos</label>
                                <input
                                    type="text"
                                    value={newUserData.apellidos || ''}
                                    onChange={(e) => setNewUserData({ ...newUserData, apellidos: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">País</label>
                                <select
                                    value={newUserData.pais || ''}
                                    onChange={(e) => setNewUserData({ ...newUserData, pais: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    <option value="">Selecciona un país</option>
                                    {PAISES_LATAM.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Ciudad</label>
                                <input
                                    type="text"
                                    value={newUserData.ciudad || ''}
                                    onChange={(e) => setNewUserData({ ...newUserData, ciudad: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Teléfono</label>
                                <input
                                    type="text"
                                    value={newUserData.telefono || ''}
                                    onChange={(e) => setNewUserData({ ...newUserData, telefono: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Rol</label>
                                <select
                                    value={newUserData.role || 'user'}
                                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    <option value="user">Usuario</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={saveNewUser}
                                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
                            >
                                Crear Usuario
                            </button>
                            <button
                                onClick={() => setShowNewUserForm(false)}
                                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabla de Usuarios - TODOS LOS ATRIBUTOS */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="text-sm w-max min-w-full">
                            <thead className="bg-gray-800 text-white sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">ID</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Email</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Nombre</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Apellidos</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Teléfono</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Ciudad</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">País</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Rol</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Rol Solicitado</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Creado</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Actualizado</th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap sticky right-0 bg-gray-800">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                        {editingId === user.id ? (
                                            <>
                                                <td className="px-3 py-2 text-xs font-mono bg-gray-100">{user.id.substring(0, 8)}</td>
                                                <td className="px-3 py-2 text-xs bg-gray-100">{user.email}</td>
                                                <td className="px-3 py-2"><input type="text" value={editData.nombre || ''} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} className="w-32 px-2 py-1 border rounded text-xs" /></td>
                                                <td className="px-3 py-2"><input type="text" value={editData.apellidos || ''} onChange={(e) => setEditData({ ...editData, apellidos: e.target.value })} className="w-32 px-2 py-1 border rounded text-xs" /></td>
                                                <td className="px-3 py-2"><input type="text" value={editData.telefono || ''} onChange={(e) => setEditData({ ...editData, telefono: e.target.value })} className="w-32 px-2 py-1 border rounded text-xs" /></td>
                                                <td className="px-3 py-2"><input type="text" value={editData.ciudad || ''} onChange={(e) => setEditData({ ...editData, ciudad: e.target.value })} className="w-32 px-2 py-1 border rounded text-xs" /></td>
                                                <td className="px-3 py-2">
                                                    <select value={editData.pais || ''} onChange={(e) => setEditData({ ...editData, pais: e.target.value })} className="w-32 px-2 py-1 border rounded text-xs">
                                                        <option value="">-</option>
                                                        {PAISES_LATAM.map(p => (<option key={p} value={p}>{p}</option>))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select value={editData.role || 'user'} onChange={(e) => setEditData({ ...editData, role: e.target.value })} className="w-24 px-2 py-1 border rounded text-xs">
                                                        <option value="user">user</option>
                                                        <option value="admin">admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select value={editData.requested_role || ''} onChange={(e) => setEditData({ ...editData, requested_role: e.target.value })} className="w-24 px-2 py-1 border rounded text-xs">
                                                        <option value="">-</option>
                                                        <option value="user">user</option>
                                                        <option value="admin">admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-600 bg-gray-50">{editData.created_at ? new Date(editData.created_at).toLocaleDateString('es-MX') : '-'}</td>
                                                <td className="px-3 py-2 text-xs text-gray-600 bg-gray-50">{editData.updated_at ? new Date(editData.updated_at).toLocaleDateString('es-MX') : '-'}</td>
                                                <td className="px-3 py-2 flex gap-1 sticky right-0 bg-white">
                                                    <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 whitespace-nowrap">Guardar</button>
                                                    <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500 whitespace-nowrap">Cancelar</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-3 py-2 text-xs font-mono bg-gray-100">{user.id.substring(0, 8)}</td>
                                                <td className="px-3 py-2 text-xs">{user.email}</td>
                                                <td className="px-3 py-2 text-xs font-medium">{user.nombre || '-'}</td>
                                                <td className="px-3 py-2 text-xs">{user.apellidos || '-'}</td>
                                                <td className="px-3 py-2 text-xs">{user.telefono || '-'}</td>
                                                <td className="px-3 py-2 text-xs">{user.ciudad || '-'}</td>
                                                <td className="px-3 py-2 text-xs">{user.pais || '-'}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-xs">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${user.requested_role ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {user.requested_role || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-600">{new Date(user.created_at).toLocaleDateString('es-MX')}</td>
                                                <td className="px-3 py-2 text-xs text-gray-600">{new Date(user.updated_at).toLocaleDateString('es-MX')}</td>
                                                <td className="px-3 py-2 flex gap-1 sticky right-0 bg-white border-l">
                                                    <button onClick={() => startEdit(user)} className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700 whitespace-nowrap">Editar</button>
                                                    <button onClick={() => setDeleteConfirm(user)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 whitespace-nowrap">Eliminar</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>No hay usuarios registrados</p>
                        </div>
                    )}
                </div>

                {/* Confirmación de eliminación */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 shadow-2xl">
                            <h3 className="text-xl font-bold mb-4">Eliminar usuario</h3>
                            <p className="text-gray-600 mb-6">
                                ¿Está seguro de que desea eliminar a <strong>{deleteConfirm.email}</strong>?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={deleteUser}
                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
                                >
                                    Sí, eliminar
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

