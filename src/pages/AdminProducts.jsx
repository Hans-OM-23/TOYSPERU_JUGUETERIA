import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function AdminProductsPage() {
  const { role } = useAuth()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nombre: '', precio: '', categoria: '', descripcion: '', es_destacado: false })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProductos()
  }, [])

  async function fetchProductos() {
    const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false })
    if (!error) setProductos(data)
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ nombre: '', precio: '', categoria: '', descripcion: '', es_destacado: false })
    setShowModal(true)
  }
  function openEdit(p) {
    setEditing(p)
    setForm({ nombre: p.nombre, precio: p.precio, categoria: p.categoria || '', descripcion: p.descripcion || '', es_destacado: p.es_destacado })
    setShowModal(true)
  }
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.nombre || !form.precio) {
      setError('Nombre y precio son obligatorios')
      return
    }
    try {
      let result
      if (editing) {
        result = await supabase.from('productos').update({ ...form }).eq('id', editing.id)
      } else {
        result = await supabase.from('productos').insert({ ...form })
      }
      
      if (result.error) {
        console.error('❌ Supabase error:', result.error)
        setError(`Error: ${result.error.message}. Verifica tus permisos de administrador.`)
        return
      }
      
      setShowModal(false)
      fetchProductos()
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      setError(err.message)
    }
  }
  async function handleDelete(id) {
    if (!confirm('¿Eliminar producto?')) return
    const result = await supabase.from('productos').delete().eq('id', id)
    if (result.error) {
      console.error('❌ Delete error:', result.error)
      alert(`Error al eliminar: ${result.error.message}`)
      return
    }
    fetchProductos()
  }

  if (role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-elevated p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Acceso restringido</h2>
          <p className="text-gray-600 mb-4">Necesitas rol administrador.</p>
          <p className="text-sm text-gray-500">Rol actual: <strong>{role}</strong></p>
          <Link 
            to="/admin/diagnostic" 
            className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            🔍 Diagnosticar permisos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Administrar Productos</h1>
        <div className="flex gap-3">
          <Link 
            to="/admin/diagnostic" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold"
          >
            🔍 Diagnóstico
          </Link>
          <button onClick={openNew} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold">+ Nuevo</button>
        </div>
      </div>
      {loading ? <p>Cargando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {productos.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow-lg p-5 flex flex-col">
              <h3 className="font-bold text-lg mb-1">{p.nombre}</h3>
              <p className="text-indigo-600 font-bold text-xl">${Number.parseFloat(p.precio).toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2 flex-1">{p.descripcion}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(p)} className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-lg py-1 text-sm font-semibold">Editar</button>
                <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-1 text-sm font-semibold">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-2xl font-bold mb-4">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold">Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold">Precio</label>
                <input name="precio" type="number" step="0.01" value={form.precio} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold">Categoría</label>
                <input name="categoria" value={form.categoria} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold">Descripción</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" rows={4} />
              </div>
              <div className="flex items-center gap-2">
                <input id="es_destacado" name="es_destacado" type="checkbox" checked={form.es_destacado} onChange={handleChange} />
                <label htmlFor="es_destacado" className="text-sm font-semibold">Destacado</label>
              </div>
              {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-semibold">Guardar</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg font-semibold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
