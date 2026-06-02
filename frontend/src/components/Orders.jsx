import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { 
  Plus, 
  ShoppingCart, 
  Trash2, 
  Eye, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  X,
  Loader2,
  RefreshCw,
  Minus,
  Info
} from "lucide-react";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for placing a new order
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [cart, setCart] = useState([]); // Array of { product_id, name, sku, price, stock_quantity, quantity }
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedProductQty, setSelectedProductQty] = useState(1);
    const [orderSubmitting, setOrderSubmitting] = useState(false);
    const [orderError, setOrderError] = useState(null);

    // Detail Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ordersData, productsData, customersData] = await Promise.all([
                api.orders.getAll(),
                api.products.getAll(),
                api.customers.getAll()
            ]);
            setOrders(ordersData);
            setProducts(productsData);
            setCustomers(customersData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenOrderForm = () => {
        setSelectedCustomerId("");
        setCart([]);
        setSelectedProductId("");
        setSelectedProductQty(1);
        setOrderError(null);
        setIsPlacingOrder(true);
    };

    // Add item to cart
    const handleAddToCart = () => {
        if (!selectedProductId) return;
        const product = products.find(p => p.id === parseInt(selectedProductId, 10));
        if (!product) return;

        const qty = parseInt(selectedProductQty, 10);
        if (isNaN(qty) || qty <= 0) {
            alert("Quantity must be at least 1");
            return;
        }

        // Validate stock locally first to help the user
        if (product.stock_quantity < qty) {
            alert(`Cannot add ${qty} units. Only ${product.stock_quantity} units are available in stock.`);
            return;
        }

        // Check if product already exists in cart
        const existingIndex = cart.findIndex(item => item.product_id === product.id);
        if (existingIndex > -1) {
            const currentQty = cart[existingIndex].quantity;
            const newQty = currentQty + qty;
            
            if (product.stock_quantity < newQty) {
                alert(`Cannot add ${qty} more units. Total in cart (${newQty}) exceeds available stock (${product.stock_quantity}).`);
                return;
            }
            
            const updatedCart = [...cart];
            updatedCart[existingIndex].quantity = newQty;
            setCart(updatedCart);
        } else {
            setCart([...cart, {
                product_id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                stock_quantity: product.stock_quantity,
                quantity: qty
            }]);
        }

        // Reset inputs
        setSelectedProductId("");
        setSelectedProductQty(1);
    };

    // Remove item from cart
    const handleRemoveFromCart = (index) => {
        const updatedCart = [...cart];
        updatedCart.splice(index, 1);
        setCart(updatedCart);
    };

    const handleCartQtyChange = (index, value) => {
        const qty = parseInt(value, 10);
        if (isNaN(qty) || qty <= 0) return;
        
        const updatedCart = [...cart];
        const item = updatedCart[index];
        
        if (item.stock_quantity < qty) {
            alert(`Cannot update to ${qty} units. Only ${item.stock_quantity} available in stock.`);
            return;
        }
        
        updatedCart[index].quantity = qty;
        setCart(updatedCart);
    };

    // Submit Order
    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        if (!selectedCustomerId) {
            setOrderError("Please select a customer.");
            return;
        }
        if (cart.length === 0) {
            setOrderError("Please add at least one product to the order.");
            return;
        }

        setOrderSubmitting(true);
        setOrderError(null);

        const payload = {
            customer_id: parseInt(selectedCustomerId, 10),
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        };

        try {
            await api.orders.create(payload);
            setIsPlacingOrder(false);
            fetchData(); // Refresh everything (orders and updated product stocks!)
        } catch (err) {
            if (err.code === "INSUFFICIENT_STOCK") {
                setOrderError(`Insufficient stock for '${err.details.product_name}' (SKU: ${err.details.sku}). Requested: ${err.details.requested}, Available: ${err.details.available}.`);
            } else {
                setOrderError(err.message);
            }
        } finally {
            setOrderSubmitting(false);
        }
    };

    // Calculate cart total
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Orders Registry
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Track customer orders, transactions, and update stock inventory.
                    </p>
                </div>
                <button 
                    onClick={handleOpenOrderForm}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Place New Order
                </button>
            </div>

            {/* Controls Row */}
            <div className="flex justify-end">
                <button 
                    onClick={fetchData}
                    className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Orders List Container */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl overflow-hidden">
                {loading && orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fetching orders database...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                        <h3 className="font-semibold text-slate-850 dark:text-slate-200">Error Loading Orders</h3>
                        <p className="text-sm text-red-500 max-w-md mt-1">{error}</p>
                        <button 
                            onClick={fetchData}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-indigo-700 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ShoppingCart className="w-16 h-16 text-slate-300 dark:text-slate-700 stroke-[1.5] mb-3" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-350">No Orders Found</h3>
                        <p className="text-sm text-slate-455 dark:text-slate-500 max-w-xs mt-1">
                            Click 'Place New Order' to write transactions and ship inventory!
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="py-4 px-6">Order ID</th>
                                    <th className="py-4 px-6">Customer Details</th>
                                    <th className="py-4 px-6">Date Placed</th>
                                    <th className="py-4 px-6 text-right">Total Price</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                    <th className="py-4 px-6 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-855 text-sm text-slate-700 dark:text-slate-300">
                                {orders.map((order) => (
                                    <tr 
                                        key={order.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                                    >
                                        <td className="py-4 px-6 font-mono font-bold text-indigo-650 dark:text-indigo-400">
                                            #{order.id.toString().padStart(5, "0")}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-900 dark:text-white">{order.customer?.name}</div>
                                            <div className="text-xs text-slate-450 dark:text-slate-500">{order.customer?.email}</div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(order.created_at).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right font-extrabold text-slate-900 dark:text-slate-200">
                                            ${order.total_amount.toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400">
                                                <CheckCircle className="w-3 h-3" />
                                                Completed
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-all inline-flex items-center gap-1 text-xs font-bold"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Inspect
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Place Order Modal (Fullscreen or large overlay) */}
            {isPlacingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col animate-scale-up"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Place New Order Transaction</h2>
                            </div>
                            <button 
                                onClick={() => setIsPlacingOrder(false)}
                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Error Banner */}
                        {orderError && (
                            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-xs mt-4">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="font-medium">{orderError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto mt-4 pr-1 space-y-6">
                            {/* Step 1: Select Customer */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    1. Choose Customer Account
                                </h3>
                                <select
                                    required
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="w-full md:w-1/2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                >
                                    <option value="">-- Choose a Customer --</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Step 2: Add Items */}
                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" />
                                    2. Add Products to Cart
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    {/* Product Select */}
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Product</label>
                                        <select
                                            value={selectedProductId}
                                            onChange={(e) => {
                                                setSelectedProductId(e.target.value);
                                                setSelectedProductQty(1);
                                            }}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        >
                                            <option value="">-- Select Product --</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (${p.price.toFixed(2)} - Qty Available: {p.stock_quantity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quantity Input */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={selectedProductQty}
                                            onChange={(e) => setSelectedProductQty(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    {/* Add button */}
                                    <button
                                        type="button"
                                        onClick={handleAddToCart}
                                        disabled={!selectedProductId}
                                        className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex justify-center items-center gap-1.5"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>

                            {/* Step 3: Cart List */}
                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    3. Cart Review
                                </h3>

                                {cart.length === 0 ? (
                                    <div className="py-8 bg-slate-50 dark:bg-slate-955/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-550">
                                        <ShoppingCart className="w-8 h-8 mb-2 stroke-[1.5]" />
                                        <p className="text-xs">Your order cart is empty.</p>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/30 dark:bg-slate-955/10">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-455 text-[10px] font-bold uppercase border-b border-slate-150 dark:border-slate-800">
                                                    <th className="py-2.5 px-4">Item (SKU)</th>
                                                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                                                    <th className="py-2.5 px-4 text-center w-28">Quantity</th>
                                                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                                                    <th className="py-2.5 px-4 text-center w-12">Delete</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-150 dark:divide-slate-850 text-xs">
                                                {cart.map((item, idx) => (
                                                    <tr key={idx} className="bg-white/80 dark:bg-slate-900/40">
                                                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">
                                                            <div>{item.name}</div>
                                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{item.sku}</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-350">
                                                            ${item.price.toFixed(2)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleCartQtyChange(idx, e.target.value)}
                                                                className="w-16 px-2 py-1 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-semibold text-slate-900 dark:text-white"
                                                            />
                                                            <span className="block text-[9px] text-slate-400 mt-1">Avail: {item.stock_quantity}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-200">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveFromCart(idx)}
                                                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 rounded"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50 dark:bg-slate-950/30 font-bold border-t border-slate-200 dark:border-slate-800 text-sm">
                                                    <td colSpan="3" className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-455">Total Amount:</td>
                                                    <td className="py-3.5 px-4 text-right text-indigo-600 dark:text-indigo-400 font-extrabold text-base">${cartTotal.toFixed(2)}</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </form>

                        {/* Modal Footer actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-800 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsPlacingOrder(false)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitOrder}
                                disabled={orderSubmitting || cart.length === 0}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-750 hover:to-violet-750 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                            >
                                {orderSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Complete Order Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspect Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-slate-800">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Details</h2>
                                <p className="text-xs text-slate-450 dark:text-slate-500 font-mono mt-0.5">Transaction ID: #{selectedOrder.id.toString().padStart(5, "0")}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Customer Information Card */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-2">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Customer Contact Info</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-slate-500 font-medium">Name:</span> <strong className="text-slate-850 dark:text-slate-200 font-bold">{selectedOrder.customer?.name}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Email:</span> <strong className="text-slate-850 dark:text-slate-200 font-bold">{selectedOrder.customer?.email}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Date Placed:</span> <span className="text-slate-600 dark:text-slate-400 font-mono">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Phone:</span> <span className="text-slate-600 dark:text-slate-400 font-mono">{selectedOrder.customer?.phone || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Order Items Table */}
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Purchased Items</h3>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-455 text-[10px] font-bold uppercase border-b border-slate-150 dark:border-slate-800">
                                            <th className="py-2.5 px-4">Product Name (SKU)</th>
                                            <th className="py-2.5 px-4 text-right">Purchase Unit Price</th>
                                            <th className="py-2.5 px-4 text-center w-20">Quantity</th>
                                            <th className="py-2.5 px-4 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-150 dark:divide-slate-850 text-xs">
                                        {selectedOrder.items?.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/30">
                                                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-200">
                                                    <div>{item.product?.name || "Unknown Product"}</div>
                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{item.product?.sku || "N/A"}</div>
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-medium text-slate-700 dark:text-slate-350">
                                                    ${item.unit_price.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-4 text-center font-bold text-slate-800 dark:text-slate-105">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                                                    ${(item.unit_price * item.quantity).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50 dark:bg-slate-950/30 font-bold border-t border-slate-200 dark:border-slate-800 text-sm">
                                            <td colSpan="3" className="py-3 px-4 text-right text-slate-500 dark:text-slate-455">Grand Total:</td>
                                            <td className="py-3 px-4 text-right text-indigo-650 dark:text-indigo-400 font-extrabold">${selectedOrder.total_amount.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end pt-3 border-t border-slate-150 dark:border-slate-800">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                Close Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
