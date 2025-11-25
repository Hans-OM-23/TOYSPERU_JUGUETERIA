import React, { useState, useEffect } from 'react'
import { removeFromCart, clearCart, getCart, increaseQty, decreaseQty } from '../lib/cart'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function CartDrawer({ isOpen, onClose }) {
    const [cart, setCart] = useState(getCart())
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        setCart(getCart())
    }, [isOpen])

    useEffect(() => {
        function handleCartUpdate() {
            setCart(getCart())
        }
        globalThis.addEventListener('cartUpdated', handleCartUpdate)
        return () => globalThis.removeEventListener('cartUpdated', handleCartUpdate)
    }, [])

    // Use precio fallback to avoid NaN when price field differs from DB naming
    const total = cart.reduce((s, p) => {
        const unit = Number.parseFloat(p.precio ?? p.price ?? 0)
        const qty = p.qty || 1
        return s + unit * qty
    }, 0).toFixed(2)

    function handleIncrement(id) {
        increaseQty(id)
    }

    function handleDecrement(id) {
        decreaseQty(id)
    }

    function handlePay() {
        if (cart.length === 0) return
        if (!user) {
            // Redirect to login if not authenticated
            navigate('/login')
            onClose?.()
            return
        }
        setShowPaymentModal(true)
        clearCart()
        setCart([])
    }

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40"
                    onClick={onClose}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Escape' && onClose()}
                />
            )}
            <div
                className={`fixed top-0 right-0 h-screen w-80 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <h2 className="text-xl font-bold">🛒 Carrito</h2>
                    <button onClick={onClose} className="text-2xl font-bold hover:opacity-80">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Carrito vacío</p>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-gray-800">{item.nombre || item.name}</p>
                                        <p className="text-indigo-600 font-bold text-lg">${Number.parseFloat(item.precio ?? item.price).toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 hover:text-red-700 font-bold text-lg"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-white rounded border border-gray-300">
                                    <button
                                        onClick={() => handleDecrement(item.id)}
                                        className="px-3 py-1 text-lg font-bold text-red-500 hover:bg-red-50"
                                    >
                                        −
                                    </button>
                                    <span className="text-center font-bold text-gray-800 min-w-[2rem]">{item.qty || 1}</span>
                                    <button
                                        onClick={() => handleIncrement(item.id)}
                                        className="px-3 py-1 text-lg font-bold text-green-500 hover:bg-green-50"
                                    >
                                        +
                                    </button>
                                </div>

                                <p className="text-xs text-gray-600 mt-2">
                                    Subtotal: ${(Number.parseFloat(item.precio ?? item.price ?? 0) * (item.qty || 1)).toFixed(2)}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border-t bg-gray-50 p-4 space-y-3">
                        <div className="flex justify-between text-lg font-bold text-gray-800">
                            <span>Total:</span>
                            <span className="text-2xl text-indigo-600">${total}</span>
                        </div>
                        <button
                            onClick={handlePay}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
                        >
                            Ir a pagar
                        </button>
                        <button
                            onClick={() => clearCart()}
                            className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-semibold"
                        >
                            Vaciar carrito
                        </button>
                    </div>
                )}
            </div>

            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-elevated max-w-md w-full mx-4 p-8 text-center animate-fade-in">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">¡Pago confirmado!</h2>
                        <p className="text-gray-700 mb-6">
                            Tu compra se ha registrado correctamente. ¡Gracias por confiar en Juguetería Alegre!
                        </p>
                        <button
                            onClick={() => {
                                setShowPaymentModal(false)
                                onClose?.()
                            }}
                            className="btn-primary w-full"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
