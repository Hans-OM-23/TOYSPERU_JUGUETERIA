import React from 'react'

export default function Footer() {
    return (
        <footer className="bg-gray-800 text-gray-200 mt-8">
            <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>© {new Date().getFullYear()} Juguetería Alegre</div>

                <div className="text-center">
                    <div className="font-semibold">Contacto</div>
                    <div className="text-sm">info@jugueteria-alegre.example</div>
                </div>

                <div className="flex items-center justify-end">
                    <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                        <input className="px-3 py-1 rounded text-gray-800" placeholder="Tu email" />
                        <button className="bg-indigo-600 px-3 py-1 rounded text-white">Suscribirse</button>
                    </form>
                </div>
            </div>
        </footer>
    )
}
