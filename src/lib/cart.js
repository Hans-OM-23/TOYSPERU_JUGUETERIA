const CART_KEY = 'toy_store_cart'

function read() {
    try {
        const raw = localStorage.getItem(CART_KEY)
        return raw ? JSON.parse(raw) : []
    } catch (e) {
        return []
    }
}

function write(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
    // Notify listeners
    globalThis.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: getCount() } }))
}

export function getCart() {
    return read()
}

export function getCount() {
    const cart = read()
    return cart.reduce((s, item) => s + (item.qty || 1), 0)
}

export function addToCart(product) {
    const cart = read()
    const idx = cart.findIndex((p) => p.id === product.id)
    if (idx >= 0) {
        cart[idx].qty = (cart[idx].qty || 1) + 1
    } else {
        cart.push({ ...product, qty: 1 })
    }
    write(cart)
}

export function removeFromCart(productId) {
    let cart = read()
    cart = cart.filter((p) => p.id !== productId)
    write(cart)
}

export function clearCart() {
    write([])
}

export function increaseQty(productId) {
    const cart = read()
    const idx = cart.findIndex((p) => p.id === productId)
    if (idx >= 0) {
        cart[idx].qty = (cart[idx].qty || 1) + 1
        write(cart)
    }
}

export function decreaseQty(productId) {
    const cart = read()
    const idx = cart.findIndex((p) => p.id === productId)
    if (idx >= 0) {
        const newQty = (cart[idx].qty || 1) - 1
        if (newQty <= 0) {
            cart.splice(idx, 1)
        } else {
            cart[idx].qty = newQty
        }
        write(cart)
    }
}

export default {
    getCart,
    getCount,
    addToCart,
    removeFromCart,
    clearCart,
    increaseQty,
    decreaseQty,
}
