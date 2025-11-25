import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import HomePage from './pages/Home'
import ProductsPage from './pages/Products'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/Login'
import AdminProductsPage from './pages/AdminProducts'
import AdminDiagnosticPage from './pages/AdminDiagnostic'
import { AuthProvider } from './context/AuthContext'

function App() {
    const [isCartOpen, setIsCartOpen] = useState(false)

    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-purple-50">
                    <Header onCartClick={() => setIsCartOpen(true)} />
                    <main className="flex-1 pb-8">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/productos" element={<ProductsPage />} />
                            <Route path="/contacto" element={<ContactPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/admin" element={<AdminProductsPage />} />
                            <Route path="/admin/diagnostic" element={<AdminDiagnosticPage />} />
                        </Routes>
                    </main>
                    <Footer />
                    <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                </div>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App