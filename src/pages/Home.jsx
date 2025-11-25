import React from 'react'
import Body from '../components/Body'
import Contact from '../components/Contact'

export default function HomePage() {
  return (
    <div className="space-y-16 pt-8">
      <section className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-elevated p-8">
          <h2 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Bienvenidos</h2>
          <p className="text-gray-700 leading-relaxed text-lg">Explora un mundo de juguetes diseñados para inspirar la imaginación y el aprendizaje. Descubre nuestras colecciones destacadas y encuentra el regalo perfecto.</p>
        </div>
      </section>
      <section className="container mx-auto px-4">
        <Body />
      </section>
      <section className="container mx-auto px-4 pb-16">
        <Contact />
      </section>
    </div>
  )
}
