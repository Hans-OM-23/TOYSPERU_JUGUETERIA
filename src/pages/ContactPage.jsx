import React from 'react'
import Contact from '../components/Contact'

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Contacto</h1>
      <Contact />
    </div>
  )
}
