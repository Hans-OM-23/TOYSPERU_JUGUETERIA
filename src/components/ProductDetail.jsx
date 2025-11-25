import React, { useState } from 'react'
import { addToCart } from '../lib/cart'

export default function ProductDetail({ product, onClose }) {
    const [qty, setQty] = useState(1)
    const [added, setAdded] = useState(false)

    function handleIncrease() {
        setQty(q => q + 1)
    }

    function handleDecrease() {
        if (qty > 1) setQty(q => q - 1)
    }

    function handleAddToCart() {
        for (let i = 0; i < qty; i++) {
            addToCart(product)
        }
        setAdded(true)
        setTimeout(() => {
            setAdded(false)
            onClose?.()
        }, 1500)
    }

    const unit = Number.parseFloat(product.precio ?? product.price ?? 0)
    const total = (unit * qty).toFixed(2)

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold text-gray-800">{product.nombre || product.name}</h2>
                    <button onClick={onClose} className="text-3xl font-bold text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Producto */}
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 h-64 rounded-lg flex items-center justify-center text-8xl overflow-hidden">
                        {(product.img || product.imagen_url) ? (
                            <img src={product.img || product.imagen_url} alt={product.nombre || product.name} className="h-full w-full object-cover rounded-lg" />
                        ) : (
                            '🧸'
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h3>
                        <p className="text-gray-700">
                            Este es un juguete de alta calidad diseñado para niños de todas las edades. Cumple con los estándares de seguridad internacionales y proporciona diversión sin fin.
                        </p>
                    </div>

                    {/* Precio */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold text-gray-800">Precio unitario:</span>
                            <span className="text-3xl font-bold text-indigo-600">${unit.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Cantidad */}
                    <div className="border-2 border-gray-300 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cantidad</h3>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={handleDecrease}
                                className="w-14 h-14 bg-red-500 text-white text-2xl font-bold rounded-lg hover:bg-red-600 transition-all"
                            >
                                −
                            </button>
                            <div className="text-4xl font-bold text-gray-800 min-w-[4rem] text-center">{qty}</div>
                            <button
                                onClick={handleIncrease}
                                className="w-14 h-14 bg-green-500 text-white text-2xl font-bold rounded-lg hover:bg-green-600 transition-all"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-semibold text-gray-800">Total:</span>
                            <span className="text-3xl font-bold text-indigo-600">${total}</span>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="space-y-2">
                        <button
                            onClick={handleAddToCart}
                            className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${added
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                                }`}
                        >
                            {added ? '✓ Añadido al carrito' : `Añadir ${qty} al carrito`}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-lg font-bold text-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
