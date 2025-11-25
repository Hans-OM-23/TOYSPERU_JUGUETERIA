import React, { useState } from 'react'
import { addToCart } from '../lib/cart'
import ProductDetail from './ProductDetail'

export default function ProductCard({ product }) {
    const [added, setAdded] = useState(false)
    const [showDetail, setShowDetail] = useState(false)

    function handleAdd() {
        addToCart(product)
        setAdded(true)
        setTimeout(() => setAdded(false), 1200)
    }

    return (
        <>
            <article className="bg-white rounded-lg shadow-lg p-5 flex flex-col hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-6xl overflow-hidden">
                    {(product.img || product.imagen_url) ? (
                        <img src={product.img || product.imagen_url} alt={product.nombre || product.name} className="h-full w-full object-cover rounded-lg" />
                    ) : (
                        '🧸'
                    )}
                </div>
                <h3 className="mt-4 font-bold text-lg text-gray-800">{product.nombre || product.name}</h3>
                <p className="text-gray-600 text-sm mt-1 flex-1">Producto de calidad para niños</p>
                <p className="text-indigo-600 font-bold text-2xl mt-3">${Number.parseFloat(product.precio ?? product.price ?? 0).toFixed(2)}</p>
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => setShowDetail(true)}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                        Ver detalle
                    </button>
                    <button
                        onClick={handleAdd}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${added ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }`}
                    >
                        {added ? '✓ Añadido' : '+ Añadir'}
                    </button>
                </div>
            </article>
            {showDetail && <ProductDetail product={product} onClose={() => setShowDetail(false)} />}
        </>
    )
}
