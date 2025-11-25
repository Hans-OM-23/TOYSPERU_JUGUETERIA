import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProductCard from './ProductCard'

const Body = ({ search = '' }) => {
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                console.log(' Cargando productos desde Supabase...')
                
                if (!supabase) {
                    throw new Error('Supabase no está configurado. Verifica tu archivo .env')
                }

                const { data, error } = await supabase
                    .from('productos')
                    .select('id, nombre, precio, imagen_url, descripcion, stock, es_destacado, categoria, marca')
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error(' Error de Supabase:', error)
                    throw new Error(`Error de base de datos: ${error.message}`)
                }
                
                console.log(' Productos cargados desde Supabase:', data?.length || 0, 'productos')
                console.log(' Datos recibidos:', data)
                
                setProductos(data || [])
                setError(null)
            } catch (err) {
                console.error(' Error al cargar productos:', err)
                setError(err.message)
                setProductos([])
            } finally {
                setLoading(false)
            }
        }

        fetchProductos()
    }, [])

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando productos desde Supabase...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-bold text-red-800 mb-2"> Error de Conexión</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="bg-white rounded p-4 text-left text-sm">
                        <p className="font-semibold mb-2">Pasos para solucionar:</p>
                        <ol className="list-decimal ml-5 space-y-1 text-gray-700">
                            <li>Verifica que ejecutaste el script SQL en Supabase</li>
                            <li>Confirma que el archivo <code className="bg-gray-100 px-1">.env</code> tiene las variables correctas</li>
                            <li>Reinicia el servidor de desarrollo (Ctrl+C y luego <code className="bg-gray-100 px-1">npm run dev</code>)</li>
                            <li>Revisa la consola del navegador (F12) para más detalles</li>
                        </ol>
                    </div>
                </div>
            </div>
        )
    }

    const filtered = productos.filter((p) => {
        if (!search) return true
        const term = search.toLowerCase()
        return (
            (p.nombre && p.nombre.toLowerCase().includes(term)) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
            (p.categoria && p.categoria.toLowerCase().includes(term)) ||
            (p.marca && p.marca.toLowerCase().includes(term))
        )
    })

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Productos</h2>

            {productos.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-bold text-yellow-800 mb-2"> No hay productos</h3>
                    <p className="text-yellow-600 mb-4">La tabla de productos está vacía en Supabase.</p>
                    <p className="text-sm text-gray-600">
                        Ejecuta el script <code className="bg-white px-2 py-1 rounded">supabase-setup.sql</code> para insertar productos de prueba.
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-500">No se encontraron productos para "{search}".</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filtered.map((producto) => (
                        <ProductCard key={producto.id} product={producto} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Body
