import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const USD_TO_PEN = 3.80
const convertToPen = (priceInUsd) => (Number.parseFloat(priceInUsd ?? 0) * USD_TO_PEN).toFixed(2)

export default function AdminProductsPage() {
  const { role } = useAuth()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    imagen_url: '',
    descripcion: '',
    stock: '',
    es_destacado: false,
    categoria: '',
    marca: '',
    edad_minima: '',
    material: '',
    es_novedad: false
  })
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
    setIsEditMode(true)
    setForm({
      nombre: '',
      precio: '',
      imagen_url: '',
      descripcion: '',
      stock: '',
      es_destacado: false,
      categoria: '',
      marca: '',
      edad_minima: '',
      material: '',
      es_novedad: false
    })
    setShowModal(true)
  }
  function openEdit(p) {
    setEditing(p)
    setIsEditMode(false)
    setForm({
      nombre: p.nombre || '',
      precio: p.precio || '',
      imagen_url: p.imagen_url || '',
      descripcion: p.descripcion || '',
      stock: p.stock || '',
      es_destacado: p.es_destacado || false,
      categoria: p.categoria || '',
      marca: p.marca || '',
      edad_minima: p.edad_minima || '',
      material: p.material || '',
      es_novedad: p.es_novedad || false
    })
    setShowModal(true)
  }
  function enterEditMode() {
    setIsEditMode(true)
  }
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.nombre || form.precio === '' || form.precio === null) {
      setError('Nombre y precio son obligatorios')
      return
    }
    try {
      // Construir payload saneado: convertir números y evitar cadenas vacías en columnas numéricas
      const parsedPrecio = (() => {
        const v = String(form.precio).trim()
        if (v === '') return null
        const n = Number.parseFloat(v)
        return Number.isFinite(n) ? n : null
      })()

      const parsedStock = (() => {
        const v = String(form.stock ?? '').trim()
        if (v === '') return null
        const n = Number.parseInt(v, 10)
        return Number.isFinite(n) ? n : null
      })()

      const parsedEdadMinima = (() => {
        const v = String(form.edad_minima ?? '').trim()
        if (v === '') return null
        const n = Number.parseInt(v, 10)
        return Number.isFinite(n) ? n : null
      })()

      const payload = {
        nombre: form.nombre,
        // La base guarda el precio en USD; enviamos número (o null). La UI muestra PEN con conversión.
        precio: parsedPrecio,
        imagen_url: form.imagen_url || null,
        descripcion: form.descripcion || null,
        stock: parsedStock,
        es_destacado: !!form.es_destacado,
        categoria: form.categoria || null,
        marca: form.marca || null,
        edad_minima: parsedEdadMinima,
        material: form.material || null,
        es_novedad: !!form.es_novedad
      }

      // Quitar claves con null para no forzar NOT NULL si existe
      Object.keys(payload).forEach(k => payload[k] === null && delete payload[k])

      let result
      if (editing) {
        result = await supabase.from('productos').update(payload).eq('id', editing.id)
      } else {
        result = await supabase.from('productos').insert(payload)
      }

      if (result.error) {
        console.error('Supabase error:', result.error)
        setError(`Error: ${result.error.message}. Verifica tus permisos de administrador.`)
        return
      }

      setShowModal(false)
      fetchProductos()
    } catch (err) {
      console.error('Unexpected error:', err)
      setError(err.message)
    }
  }
  async function handleDelete(id) {
    if (!confirm('¿Eliminar producto?')) return
    const result = await supabase.from('productos').delete().eq('id', id)
    if (result.error) {
      console.error('Delete error:', result.error)
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
            Diagnosticar permisos
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
            Diagnóstico
          </Link>
          <button onClick={openNew} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold">+ Nuevo</button>
        </div>
      </div>
      {loading ? <p>Cargando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {p.imagen_url && (
                <img src={p.imagen_url} alt={p.nombre} className="w-full h-48 object-cover" />
              )}
              <div className="p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg flex-1">{p.nombre}</h3>
                  <div className="flex gap-1">
                    {p.es_destacado && <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">Destacado</span>}
                    {p.es_novedad && <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">Novedad</span>}
                  </div>
                </div>
                <p className="text-indigo-600 font-bold text-xl mb-2">S/ {convertToPen(p.precio)}</p>
                {p.categoria && <p className="text-xs text-gray-600 mb-1"><strong>Categoría:</strong> {p.categoria}</p>}
                <p className="text-xs text-gray-500 mb-3 flex-1 line-clamp-2">{p.descripcion}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-semibold">Ver Detalles</button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-semibold">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">

            {!isEditMode && editing ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold">Detalles del Producto</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">X</button>
                </div>

                {form.imagen_url && (
                  <div className="mb-6 rounded-lg overflow-hidden border border-gray-300">
                    <img src={form.imagen_url} alt={form.nombre} className="w-full h-64 object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">Nombre</p>
                    <p className="text-2xl font-bold text-gray-800">{form.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">Precio</p>
                    <p className="text-2xl font-bold text-indigo-600">S/ {convertToPen(form.precio)}</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold mb-3">Descripción</h3>
                  <p className="text-gray-700 text-base leading-relaxed">{form.descripcion || 'Sin descripción'}</p>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-bold mb-4">Características</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Categoría</p>
                      <p className="text-sm font-bold text-gray-800">{form.categoria || '—'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Marca</p>
                      <p className="text-sm font-bold text-gray-800">{form.marca || '—'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Material</p>
                      <p className="text-sm font-bold text-gray-800">{form.material || '—'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Stock</p>
                      <p className="text-sm font-bold text-gray-800">{form.stock || '—'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Edad Mínima</p>
                      <p className="text-sm font-bold text-gray-800">{form.edad_minima ? `${form.edad_minima} años` : '—'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Destacado</p>
                      <p className="text-sm font-bold text-gray-800">{form.es_destacado ? 'Sí' : 'No'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-bold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {form.es_destacado && (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-300">Destacado</span>
                    )}
                    {form.es_novedad && (
                      <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full border border-red-300">Novedad</span>
                    )}
                    {!form.es_destacado && !form.es_novedad && (
                      <span className="text-gray-500 text-sm italic">Sin tags especiales</span>
                    )}
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm font-semibold bg-red-50 p-4 rounded-lg border border-red-200 mt-6">{error}</div>}

                <div className="border-t pt-6 mt-6 flex gap-3">
                  <button type="button" onClick={enterEditMode} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow">Editar Producto</button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-semibold transition-colors">Cerrar</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-6">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold mb-4">Información Básica</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Nombre *</label>
                        <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Precio *</label>
                        <input name="precio" type="number" step="0.01" value={form.precio} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" required />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold mb-4">Contenido Multimedia</h3>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Imagen URL</label>
                      <input name="imagen_url" type="url" value={form.imagen_url} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      {form.imagen_url && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-300">
                          <img src={form.imagen_url} alt="Preview" className="w-full h-40 object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold mb-4">Descripción</h3>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Descripción</label>
                      <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" rows={4} />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold mb-4">Inventario y Características</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Stock</label>
                        <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Edad Mínima</label>
                        <input name="edad_minima" type="number" value={form.edad_minima} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Material</label>
                        <input name="material" value={form.material} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold mb-4">Categorización</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Categoría</label>
                        <input name="categoria" value={form.categoria} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Marca</label>
                        <input name="marca" value={form.marca} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold mb-4">Tags</h3>
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3">
                        <input id="es_destacado" name="es_destacado" type="checkbox" checked={form.es_destacado} onChange={handleChange} className="w-4 h-4 cursor-pointer" />
                        <label htmlFor="es_destacado" className="text-sm font-semibold cursor-pointer">Destacado</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input id="es_novedad" name="es_novedad" type="checkbox" checked={form.es_novedad} onChange={handleChange} className="w-4 h-4 cursor-pointer" />
                        <label htmlFor="es_novedad" className="text-sm font-semibold cursor-pointer">Novedad</label>
                      </div>
                    </div>
                  </div>

                  {error && <div className="text-red-600 text-sm font-semibold bg-red-50 p-4 rounded-lg border border-red-200">{error}</div>}

                  <div className="border-t pt-6 flex gap-3">
                    <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow">Guardar Cambios</button>
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-semibold transition-colors">Cancelar</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
