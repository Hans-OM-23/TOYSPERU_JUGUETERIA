import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const USD_TO_PEN = 3.80
const convertToPen = (priceInUsd) => (Number.parseFloat(priceInUsd ?? 0) * USD_TO_PEN).toFixed(2)

export default function AdminSales() {
    const navigate = useNavigate()
    const { role } = useAuth()
    const [loading, setLoading] = useState(true)
    const [salesData, setSalesData] = useState({
        totalSales: 0,
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        recentOrders: [],
        topProducts: [],
        salesByMonth: {}
    })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState({})

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/admin')
            return
        }
        loadSalesData()
    }, [role, navigate])

    async function loadSalesData() {
        try {
            // Obtener todas las órdenes con items
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, user_id, created_at, status, payment_status, order_items(*)')
                .order('created_at', { ascending: false })

            if (ordersError) throw ordersError

            // Calcular métricas
            const totalOrders = orders.length
            let totalRevenue = 0
            let totalSales = 0
            const topProductsMap = {}
            const salesByMonthMap = {}

            orders.forEach(order => {
                order.order_items?.forEach(item => {
                    const itemTotal = (item.product_price || 0) * (item.quantity || 0)
                    totalRevenue += itemTotal
                    totalSales += item.quantity || 0

                    // Top productos
                    if (!topProductsMap[item.product_name]) {
                        topProductsMap[item.product_name] = 0
                    }
                    topProductsMap[item.product_name] += item.quantity || 0
                })

                // Por mes
                const date = new Date(order.created_at)
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                if (!salesByMonthMap[monthKey]) {
                    salesByMonthMap[monthKey] = { orders: 0, revenue: 0 }
                }
                salesByMonthMap[monthKey].orders += 1
            })

            // Agregar revenue por mes
            orders.forEach(order => {
                const date = new Date(order.created_at)
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                const orderTotal = order.order_items?.reduce((sum, item) => sum + ((item.product_price || 0) * (item.quantity || 0)), 0) || 0
                if (salesByMonthMap[monthKey]) {
                    salesByMonthMap[monthKey].revenue += orderTotal
                }
            })

            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

            const sortedTopProducts = Object.entries(topProductsMap)
                .map(([name, quantity]) => ({ name, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5)

            setSalesData({
                totalSales,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalOrders,
                averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                recentOrders: orders.slice(0, 10),
                topProducts: sortedTopProducts,
                salesByMonth: salesByMonthMap
            })
        } catch (err) {
            console.error('Error cargando datos de ventas:', err)
            setError('Error al cargar los datos de ventas: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            setSaving(prev => ({ ...prev, [orderId]: true }))
            const { error: upErr } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)

            if (upErr) throw upErr

            setSalesData(prev => ({
                ...prev,
                recentOrders: prev.recentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
            }))
        } catch (e) {
            console.error('Error actualizando estado:', e)
            setError('No se pudo actualizar el estado: ' + (e.message || 'Error'))
        } finally {
            setSaving(prev => ({ ...prev, [orderId]: false }))
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <p className="text-white text-xl">Cargando datos de ventas...</p>
            </div>
        )
    }

    // Crear datos para gráfico simple de barras
    const chartData = Object.entries(salesData.salesByMonth)
        .sort()
        .slice(-12) // Últimos 12 meses

    const maxRevenue = Math.max(...chartData.map(([, data]) => data.revenue || 0), 1)
    const maxProductQty = Math.max(...salesData.topProducts.map(p => p.quantity), 1)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Resumen de Ventas</h1>
                    <p className="text-gray-300">Análisis gerencial del desempeño de ventas</p>
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
                        <p className="text-gray-300 text-sm mb-2">Total Ordenes</p>
                        <p className="text-4xl font-bold text-white">{salesData.totalOrders}</p>
                    </div>
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
                        <p className="text-gray-300 text-sm mb-2">Total Ingresos</p>
                        <p className="text-4xl font-bold text-white">S/ {convertToPen(salesData.totalRevenue)}</p>
                    </div>
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
                        <p className="text-gray-300 text-sm mb-2">Productos Vendidos</p>
                        <p className="text-4xl font-bold text-white">{salesData.totalSales}</p>
                    </div>
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
                        <p className="text-gray-300 text-sm mb-2">Promedio por Orden</p>
                        <p className="text-4xl font-bold text-white">S/ {convertToPen(salesData.averageOrderValue)}</p>
                    </div>
                </div>

                {/* Gráfico de barras - Ventas por mes */}
                <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Ventas por Mes (Últimos 12 Meses)</h2>
                    <div className="flex items-end justify-between h-64 gap-2 px-2">
                        {chartData.length > 0 ? (
                            chartData.map(([month, data]) => {
                                const barHeight = (data.revenue / maxRevenue) * 100
                                return (
                                    <div key={month} className="flex-1 flex flex-col items-center group">
                                        <div className="relative w-full flex justify-center">
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                                ${data.revenue.toFixed(0)}
                                            </div>
                                            <div
                                                className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t transition-all duration-300 hover:opacity-80"
                                                style={{ height: `${barHeight}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 text-center">{month}</p>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-gray-400">No hay datos disponibles</p>
                        )}
                    </div>
                </div>

                {/* Productos Top 5 */}
                <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Productos Top 5</h2>
                    <div className="space-y-4">
                        {salesData.topProducts.map((product, index) => {
                            const percentage = (product.quantity / maxProductQty) * 100
                            return (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-300 font-semibold">{index + 1}. {product.name}</span>
                                        <span className="text-white font-bold">{product.quantity} vendidas</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-4">
                                        <div
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Órdenes recientes */}
                <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
                    <h2 className="text-2xl font-bold text-white mb-6">Órdenes Recientes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-white bg-opacity-5 border-b border-white border-opacity-20">
                                <tr>
                                    <th className="text-left px-4 py-3">ID Orden</th>
                                    <th className="text-left px-4 py-3">Items</th>
                                    <th className="text-left px-4 py-3">Total</th>
                                    <th className="text-left px-4 py-3">Estado</th>
                                    <th className="text-left px-4 py-3">Acciones</th>
                                    <th className="text-left px-4 py-3">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData.recentOrders.map(order => {
                                    const total = order.order_items?.reduce((sum, item) => sum + ((item.product_price || 0) * (item.quantity || 0)), 0) || 0
                                    const itemCount = order.order_items?.length || 0
                                    return (
                                        <tr key={order.id} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5">
                                            <td className="px-4 py-3 font-mono text-xs">{order.id.substring(0, 8)}</td>
                                            <td className="px-4 py-3">{itemCount} items</td>
                                            <td className="px-4 py-3 font-semibold">S/ {convertToPen(total)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'completed' ? 'bg-green-500 bg-opacity-20 text-green-300' :
                                                    order.status === 'pending' ? 'bg-yellow-500 bg-opacity-20 text-yellow-300' :
                                                        order.status === 'processing' ? 'bg-blue-500 bg-opacity-20 text-blue-300' :
                                                            order.status === 'confirmed' ? 'bg-purple-500 bg-opacity-20 text-purple-300' :
                                                                order.status === 'shipped' ? 'bg-indigo-500 bg-opacity-20 text-indigo-300' :
                                                                    'bg-red-500 bg-opacity-20 text-red-300'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {['admin', 'manager', 'seller'].includes(role) && (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                            className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-white/20"
                                                        >
                                                            {['pending', 'processing', 'confirmed', 'shipped', 'completed', 'cancelled'].map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                        {saving[order.id] && <span className="text-xs text-gray-400">Guardando…</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400">
                                                {new Date(order.created_at).toLocaleDateString('es-MX')}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
