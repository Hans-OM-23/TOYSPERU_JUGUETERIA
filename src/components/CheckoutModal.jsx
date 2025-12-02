import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { clearCart, getCart } from '../lib/cart'

const USD_TO_PEN = 3.80
const convertToPen = (priceInUsd) => (Number.parseFloat(priceInUsd ?? 0) * USD_TO_PEN).toFixed(2)

export default function CheckoutModal({ isOpen, onClose, cartItems, total }) {
    const { user } = useAuth()
    const [step, setStep] = useState('shipping') // shipping, payment, review, confirmation
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [rememberData, setRememberData] = useState(false)

    // Datos de envío
    const [shipping, setShipping] = useState({
        full_name: '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Perú'
    })

    // Email con dominio seleccionable
    const [emailLocal, setEmailLocal] = useState('')
    const [emailDomain, setEmailDomain] = useState('gmail.com')

    // Datos de pago
    const [payment, setPayment] = useState({
        method: 'credit_card', // credit_card, debit_card, paypal, yape, plin
        card_holder: '',
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvv: ''
    })

    // Cargar datos guardados en sessionStorage si existen
    useEffect(() => {
        if (isOpen) {
            const savedShipping = sessionStorage.getItem(`shipping_${user?.id}`)
            if (savedShipping) {
                const s = JSON.parse(savedShipping)
                setShipping(s)
                setRememberData(true)
                // Inicializar combo a partir del email guardado
                if (s?.email?.includes('@')) {
                    const [local, domain] = s.email.split('@')
                    setEmailLocal(local)
                    setEmailDomain(['gmail.com', 'continental.edu.pe', 'outlook.com'].includes(domain) ? domain : 'gmail.com')
                }
            } else if (user?.email) {
                // Inicializar desde el email del usuario autenticado
                const [local, domain] = user.email.split('@')
                setEmailLocal(local || '')
                setEmailDomain(['gmail.com', 'continental.edu.pe', 'outlook.com'].includes(domain) ? domain : 'gmail.com')
                setShipping(prev => ({ ...prev, email: user.email }))
            } else {
                setEmailLocal('')
                setEmailDomain('gmail.com')
            }
        } else {
            // Reset cuando se cierra el modal
            setStep('shipping')
            setError('')
            setLoading(false)
        }
    }, [isOpen, user?.id, user?.email])

    // Mantener shipping.email sincronizado con el combo
    useEffect(() => {
        const composed = emailLocal ? `${emailLocal}@${emailDomain}` : ''
        setShipping(prev => ({ ...prev, email: composed }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emailLocal, emailDomain])

    function handleShippingChange(e) {
        const { name, value } = e.target
        setShipping(prev => ({ ...prev, [name]: value }))
    }

    function handlePaymentChange(e) {
        const { name, value } = e.target
        setPayment(prev => ({ ...prev, [name]: value }))
    }

    function validateShipping() {
        if (!shipping.full_name.trim()) {
            setError('Ingresa tu nombre completo')
            return false
        }
        if (!shipping.email.trim()) {
            setError('Ingresa tu correo')
            return false
        }
        // Validar que el email local no sea solo números (excepto para @continental.edu.pe que usa IDs)
        if (emailLocal && /^\d+$/.test(emailLocal.trim()) && emailDomain !== 'continental.edu.pe') {
            setError('El email no puede ser solo números. Usa tu nombre o usuario (ejemplo: juan.perez)')
            return false
        }
        if (!shipping.phone.trim()) {
            setError('Ingresa tu teléfono')
            return false
        }
        if (!shipping.address.trim()) {
            setError('Ingresa tu dirección')
            return false
        }
        if (!shipping.city.trim()) {
            setError('Ingresa tu ciudad')
            return false
        }
        setError('')
        return true
    }

    function validatePayment() {
        if (payment.method === 'credit_card' || payment.method === 'debit_card') {
            if (!payment.card_holder.trim()) {
                setError('Ingresa el nombre del titular')
                return false
            }
            if (!payment.card_number.replace(/\s/g, '').match(/^\d{13,19}$/)) {
                setError('Número de tarjeta inválido')
                return false
            }
            if (!payment.expiry_month || !payment.expiry_year) {
                setError('Ingresa la fecha de vencimiento')
                return false
            }
            if (!payment.cvv.match(/^\d{3,4}$/)) {
                setError('CVV inválido')
                return false
            }
        }
        setError('')
        return true
    }

    function handleNextStep() {
        if (step === 'shipping') {
            if (validateShipping()) {
                setStep('payment')
            }
        } else if (step === 'payment') {
            if (validatePayment()) {
                setStep('review')
            }
        }
    }

    async function handleConfirmOrder() {
        setLoading(true)
        setError('')
        try {
            // Guardar datos de envío en sessionStorage si se marcó rememberData
            if (rememberData) {
                sessionStorage.setItem(`shipping_${user?.id}`, JSON.stringify(shipping))
            } else {
                sessionStorage.removeItem(`shipping_${user?.id}`)
            }

            // Crear orden con los items del carrito PRIMERO
            const cartData = getCart()
            const orderItems = cartData.map(item => ({
                product_id: item.id,
                product_name: item.nombre,
                product_price: item.precio,
                quantity: item.qty || 1
            }))

            // Usar función almacenada para crear la orden
            const { data: orderData, error: orderError } = await supabase
                .rpc('create_order', {
                    p_user_id: user.id,
                    p_full_name: shipping.full_name,
                    p_email: shipping.email,
                    p_phone: shipping.phone,
                    p_address: shipping.address,
                    p_city: shipping.city,
                    p_postal_code: shipping.postal_code,
                    p_country: shipping.country,
                    p_payment_method: payment.method,
                    p_payment_method_id: null,
                    p_items: orderItems
                })

            if (orderError) {
                console.error('Error al crear orden:', orderError)
                throw orderError
            }

            console.log('Orden creada con ID:', orderData)
            const orderId = orderData

            // AHORA crear registro de transacción con el order_id
            const { data: transData, error: transError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    order_id: orderId,
                    amount: total,
                    status: 'pending',
                    payment_method: payment.method,
                    response_data: {
                        shipping: shipping,
                        payment_method: payment.method,
                        timestamp: new Date().toISOString()
                    }
                })
                .select()

            if (transError) {
                console.error('Error al crear transacción:', transError)
                throw transError
            }

            console.log('Transacción creada:', transData)

            // Simular aprobación del pago (en producción, esto vendría de la pasarela)
            if (transData && transData[0]) {
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update({
                        status: 'completed'
                    })
                    .eq('id', transData[0].id)

                if (updateError) {
                    console.error('Error al actualizar transacción:', updateError)
                    throw updateError
                }
            }

            // Actualizar estado de pago en la orden: pago completado, orden pendiente de confirmación
            await supabase
                .from('orders')
                .update({
                    payment_status: 'completed',
                    status: 'pending'
                })
                .eq('id', orderId)

            // Actualizar stock de productos
            for (const item of orderItems) {
                const { data: productData, error: selectError } = await supabase
                    .from('productos')
                    .select('stock')
                    .eq('id', item.product_id)
                    .single()

                if (!selectError && productData) {
                    const newStock = Math.max(0, productData.stock - item.quantity)
                    await supabase
                        .from('productos')
                        .update({ stock: newStock })
                        .eq('id', item.product_id)
                }
            }

            // Limpiar carrito
            clearCart()

            // Emitir evento para refrescar productos
            const refreshEvent = new CustomEvent('refreshProducts', { detail: { timestamp: Date.now() } })
            globalThis.dispatchEvent(refreshEvent)

            // Ir a confirmación
            setStep('confirmation')

        } catch (err) {
            console.error('Error en pago:', err)
            setError(err.message || 'Error al procesar el pago')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                {/* Encabezado */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between border-b">
                    <h2 className="text-2xl font-bold">
                        {step === 'shipping' && '📍 Dirección de Envío'}
                        {step === 'payment' && '💳 Método de Pago'}
                        {step === 'review' && '📋 Revisar Pedido'}
                        {step === 'confirmation' && '✅ Pedido Confirmado'}
                    </h2>
                    {step !== 'confirmation' && (
                        <button
                            onClick={onClose}
                            className="text-2xl font-bold hover:opacity-80"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Contenido */}
                <div className="p-8 space-y-6">
                    {/* PASO 1: DIRECCIÓN */}
                    {step === 'shipping' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={shipping.full_name}
                                        onChange={handleShippingChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1" htmlFor="email-local">Email</label>
                                    <div className="flex gap-2">
                                        <input
                                            id="email-local"
                                            type="text"
                                            placeholder={emailDomain === 'continental.edu.pe' ? 'ID (ej: 75937419)' : 'nombre.apellido'}
                                            value={emailLocal}
                                            onChange={(e) => {
                                                const val = e.target.value
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
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                        <select
                                            id="email-domain"
                                            value={emailDomain}
                                            onChange={(e) => setEmailDomain(e.target.value)}
                                            className="min-w-[12rem] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        >
                                            <option value="gmail.com">@gmail.com</option>
                                            <option value="continental.edu.pe">@continental.edu.pe</option>
                                            <option value="outlook.com">@outlook.com</option>
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Email: <span className="font-semibold">{emailLocal || (emailDomain === 'continental.edu.pe' ? 'ID' : 'nombre.apellido')}@{emailDomain}</span>
                                        {/^\d+$/.test(emailLocal) && emailDomain !== 'continental.edu.pe' && <span className="text-red-600 ml-2">⚠️ No uses solo números</span>}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={shipping.phone}
                                        onChange={handleShippingChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="+51 999 999 999"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Código Postal</label>
                                    <input
                                        type="text"
                                        name="postal_code"
                                        value={shipping.postal_code}
                                        onChange={handleShippingChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="15001"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Dirección</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={shipping.address}
                                    onChange={handleShippingChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Av. Principal 123, Apto 4B"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Ciudad</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={shipping.city}
                                        onChange={handleShippingChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Lima"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">País</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={shipping.country}
                                        onChange={handleShippingChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 py-4 border-t border-b">
                        <input
                            type="checkbox"
                            id="rememberData"
                            checked={rememberData}
                            onChange={(e) => setRememberData(e.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="rememberData" className="text-sm text-gray-700 cursor-pointer">
                            Recordar estos datos para futuras compras en esta sesión
                        </label>
                    </div>

                    {/* PASO 2: PAGO */}
                    {step === 'payment' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-3">Método de Pago</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {['credit_card', 'debit_card', 'paypal', 'yape', 'plin'].map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setPayment(prev => ({ ...prev, method }))}
                                            className={`p-3 rounded-lg text-sm font-semibold transition ${payment.method === method
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                }`}
                                        >
                                            {method === 'credit_card' && '💳 Crédito'}
                                            {method === 'debit_card' && '💳 Débito'}
                                            {method === 'paypal' && '🅿️ PayPal'}
                                            {method === 'yape' && '📱 Yape'}
                                            {method === 'plin' && '📱 Plin'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(payment.method === 'credit_card' || payment.method === 'debit_card') && (
                                <div className="space-y-4 border-t pt-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Titular de la Tarjeta</label>
                                        <input
                                            type="text"
                                            name="card_holder"
                                            value={payment.card_holder}
                                            onChange={handlePaymentChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder="JUAN PEREZ"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Número de Tarjeta</label>
                                        <input
                                            type="text"
                                            name="card_number"
                                            value={payment.card_number}
                                            onChange={handlePaymentChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                            placeholder="1234 5678 9012 3456"
                                            maxLength="19"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Mes</label>
                                            <select
                                                name="expiry_month"
                                                value={payment.expiry_month}
                                                onChange={handlePaymentChange}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            >
                                                <option value="">Mes</option>
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                        {String(i + 1).padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Año</label>
                                            <select
                                                name="expiry_year"
                                                value={payment.expiry_year}
                                                onChange={handlePaymentChange}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            >
                                                <option value="">Año</option>
                                                {Array.from({ length: 10 }, (_, i) => {
                                                    const year = new Date().getFullYear() + i
                                                    return <option key={year} value={year}>{year}</option>
                                                })}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">CVV</label>
                                            <input
                                                type="text"
                                                name="cvv"
                                                value={payment.cvv}
                                                onChange={handlePaymentChange}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                                placeholder="123"
                                                maxLength="4"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {payment.method === 'paypal' && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-700">Serás redirigido a PayPal para completar el pago</p>
                                </div>
                            )}

                            {(payment.method === 'yape' || payment.method === 'plin') && (
                                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-700">Usarás tu aplicación móvil para completar el pago</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PASO 3: REVISAR */}
                    {step === 'review' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold mb-3">📍 Dirección de Envío</h3>
                                <p className="text-sm text-gray-700">
                                    {shipping.full_name}<br />
                                    {shipping.address}<br />
                                    {shipping.city}, {shipping.postal_code}<br />
                                    {shipping.country}<br />
                                    Tel: {shipping.phone}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold mb-3">Método de Pago</h3>
                                <p className="text-sm text-gray-700">
                                    {payment.method === 'credit_card' && 'Tarjeta de Crédito'}
                                    {payment.method === 'debit_card' && 'Tarjeta de Débito'}
                                    {payment.method === 'paypal' && 'PayPal'}
                                    {payment.method === 'yape' && 'Yape'}
                                    {payment.method === 'plin' && 'Plin'}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold mb-3">Artículos ({cartItems.length})</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {cartItems.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm text-gray-700">
                                            <span>{item.nombre} x{item.qty || 1}</span>
                                            <span>S/ {convertToPen(item.precio * (item.qty || 1))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total:</span>
                                    <span className="text-indigo-600">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONFIRMACIÓN */}
                    {step === 'confirmation' && (
                        <div className="text-center space-y-4">
                            <div className="text-6xl mb-4">✓</div>
                            <h3 className="text-2xl font-bold text-green-600">¡Pedido Confirmado!</h3>
                            <p className="text-gray-600">Tu pago ha sido procesado exitosamente.</p>
                            <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                                <p className="text-sm text-gray-600">Número de Orden:</p>
                                <p className="text-xl font-mono font-bold text-indigo-600">#ORD-{new Date().getTime()}</p>
                            </div>
                            <p className="text-sm text-gray-600">Recibirás un email de confirmación pronto. El envío llegará en 2-3 días hábiles.</p>
                        </div>
                    )}

                    {/* ERRORES */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <p className="text-red-700 font-semibold">{error}</p>
                        </div>
                    )}
                </div>

                {/* BOTONES */}
                <div className="border-t p-6 bg-gray-50 flex gap-3">
                    {step !== 'confirmation' && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                            Cancelar
                        </button>
                    )}

                    {step === 'shipping' && (
                        <button
                            onClick={handleNextStep}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                        >
                            Siguiente: Pago
                        </button>
                    )}

                    {step === 'payment' && (
                        <button
                            onClick={handleNextStep}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                        >
                            Siguiente: Revisar
                        </button>
                    )}

                    {step === 'review' && (
                        <button
                            onClick={handleConfirmOrder}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Procesando...' : 'Confirmar Pago'}
                        </button>
                    )}

                    {step === 'confirmation' && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                        >
                            Volver al Inicio
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
