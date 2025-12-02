import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function OrdersPage() {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [expandedOrder, setExpandedOrder] = useState(null)

    useEffect(() => {
        loadOrders()
    }, [user?.id])

    async function loadOrders() {
        try {
            setLoading(true)
            const { data, error: err } = await supabase
                .from('orders')
                .select(`
                    id,
                    total,
                    status,
                    payment_status,
                    created_at,
                    full_name,
                    address,
                    city,
                    order_items (
                        id,
                        product_name,
                        product_price,
                        quantity,
                        subtotal
                    )
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })

            if (err) throw err

            setOrders(data || [])
        } catch (err) {
            console.error('Error cargando órdenes:', err)
            setError(err.message || 'Error al cargar las compras')
        } finally {
            setLoading(false)
        }
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    function getStatusColor(status) {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'confirmed':
                return 'bg-purple-100 text-purple-800'
            case 'processing':
                return 'bg-blue-100 text-blue-800'
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            case 'cancelled':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    function getStatusText(status) {
        switch (status) {
            case 'completed':
                return 'Completado'
            case 'confirmed':
                return 'Confirmado'
            case 'processing':
                return 'En proceso'
            case 'shipped':
                return 'Enviado'
            case 'pending':
                return 'Pendiente'
            case 'failed':
                return 'Fallido'
            case 'cancelled':
                return 'Cancelado'
            default:
                return status
        }
    }

    function getPaymentStatusText(status) {
        switch (status) {
            case 'pending':
                return 'Pendiente'
            case 'processing':
                return 'Procesando'
            case 'completed':
                return 'Completado'
            case 'failed':
                return 'Fallido'
            default:
                return status
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-purple-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Mis Compras
                    </h1>
                    <p className="text-gray-600 mb-8">Historial de tus pedidos realizados</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Cargando tus compras...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">Aún no tienes compras realizadas</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                                >
                                    <div
                                        className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition"
                                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Orden</p>
                                                <p className="font-semibold text-indigo-600">#{order.id.slice(0, 8).toUpperCase()}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Fecha</p>
                                                <p className="font-medium">{formatDate(order.created_at)}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Total</p>
                                                <p className="font-semibold text-lg">S/. {parseFloat(order.total).toFixed(2)}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Estado</p>
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </div>

                                            <div className="text-right">
                                                <button className="text-indigo-600 hover:text-indigo-800 font-medium">
                                                    {expandedOrder === order.id ? 'Ocultar' : 'Ver Detalles'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {expandedOrder === order.id && (
                                        <div className="p-4 bg-white border-t border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 mb-2">Dirección de Envío</h3>
                                                    <p className="text-sm text-gray-600">{order.full_name}</p>
                                                    <p className="text-sm text-gray-600">{order.address}</p>
                                                    <p className="text-sm text-gray-600">{order.city}</p>
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold text-gray-800 mb-2">Estado de Pago</h3>
                                                    <p className="text-sm">
                                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                            {getPaymentStatusText(order.payment_status)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <h3 className="font-semibold text-gray-800 mb-3">Artículos</h3>
                                            <div className="space-y-2 border-t pt-4">
                                                {order.order_items?.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-gray-800">{item.product_name}</p>
                                                            <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold">S/. {parseFloat(item.subtotal).toFixed(2)}</p>
                                                            <p className="text-xs text-gray-500">S/. {parseFloat(item.product_price).toFixed(2)} c/u</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
