import React, { useState } from 'react'

export default function Contact() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [status, setStatus] = useState(null)

    function validateEmail(e) {
        return /\S+@\S+\.\S+/.test(e)
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (!name.trim() || !email.trim() || !message.trim()) {
            setStatus({ ok: false, msg: 'Por favor complete todos los campos.' })
            return
        }
        if (!validateEmail(email)) {
            setStatus({ ok: false, msg: 'Ingrese un correo válido.' })
            return
        }

        // Guardar en localStorage como ejemplo (más tarde reemplazar por Supabase)
        try {
            const key = 'toy_store_contacts'
            const raw = localStorage.getItem(key)
            const list = raw ? JSON.parse(raw) : []
            list.push({ name, email, message, createdAt: new Date().toISOString() })
            localStorage.setItem(key, JSON.stringify(list))
            setName('')
            setEmail('')
            setMessage('')
            setStatus({ ok: true, msg: 'Mensaje enviado. Gracias!' })
        } catch (err) {
            setStatus({ ok: false, msg: 'Ocurrió un error, intente nuevamente.' })
        }
    }

    return (
        <section id="contacto" className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-8 shadow-lg">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Contacto</h2>
            <p className="mb-6 text-gray-700">¿Tienes preguntas? Envíanos un mensaje y te responderemos pronto.</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Nombre</label>
                    <input id="name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
                    <input id="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">Mensaje</label>
                    <textarea id="message" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        {status && (
                            <div className={`font-semibold ${status.ok ? 'text-green-600' : 'text-red-600'}`}>{status.msg}</div>
                        )}
                    </div>
                    <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all font-semibold">Enviar mensaje</button>
                </div>
            </form>
        </section>
    )
}