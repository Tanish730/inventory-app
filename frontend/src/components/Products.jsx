import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  AlertCircle, 
  Info,
  X,
  Loader2,
  RefreshCw
} from "lucide-react";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ sku: "", name: "", price: "", stock_quantity: "" });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.products.getAll(search);
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Simple debounce for search queries
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setFormData({ sku: "", name: "", price: "", stock_quantity: "0" });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            sku: product.sku,
            name: product.name,
            price: product.price.toString(),
            stock_quantity: product.stock_quantity.toString()
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);
        setFormError(null);
        
        // Simple client-side type-casting & validation
        const priceNum = parseFloat(formData.price);
        const stockNum = parseInt(formData.stock_quantity, 10);

        if (isNaN(priceNum) || priceNum <= 0) {
            setFormError("Price must be a valid number greater than 0");
            setFormSubmitting(false);
            return;
        }

        if (isNaN(stockNum) || stockNum < 0) {
            setFormError("Stock quantity must be a non-negative integer");
            setFormSubmitting(false);
            return;
        }

        const payload = {
            sku: formData.sku.trim(),
            name: formData.name.trim(),
            price: priceNum,
            stock_quantity: stockNum
        };

        try {
            if (editingProduct) {
                await api.products.update(editingProduct.id, payload);
            } else {
                await api.products.create(payload);
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) {
            // Check if it's the SKU duplicate error from the backend API
            if (err.code === "SKU_EXISTS") {
                setFormError(`Product SKU '${payload.sku}' is already in use. Please use a unique SKU.`);
            } else {
                setFormError(err.message);
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteProduct = async (product) => {
        if (!window.confirm(`Are you sure you want to delete product "${product.name}" (SKU: ${product.sku})?`)) {
            return;
        }
        try {
            await api.products.delete(product.id);
            fetchProducts();
        } catch (err) {
            alert(`Failed to delete product: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Products Catalog
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Register, edit, and keep track of items in your inventory.
                    </p>
                </div>
                <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search products by SKU or Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
                {/* Manual Reload Button */}
                <button 
                    onClick={fetchProducts}
                    className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Catalog Grid/Table */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl overflow-hidden">
                {loading && products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fetching product list...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                        <h3 className="font-semibold text-slate-850 dark:text-slate-200">Error Loading Catalog</h3>
                        <p className="text-sm text-red-500 max-w-md mt-1">{error}</p>
                        <button 
                            onClick={fetchProducts}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-indigo-700 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Package className="w-16 h-16 text-slate-300 dark:text-slate-700 stroke-[1.5] mb-3" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-350">No Products Found</h3>
                        <p className="text-sm text-slate-455 dark:text-slate-500 max-w-xs mt-1">
                            {search ? "No matches found for your search term." : "Create your first product to build the catalog!"}
                        </p>
                        {search && (
                            <button 
                                onClick={() => setSearch("")}
                                className="mt-4 px-4 py-2 border border-slate-250 dark:border-slate-750 text-slate-650 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="py-4 px-6">SKU</th>
                                    <th className="py-4 px-6">Product Details</th>
                                    <th className="py-4 px-6 text-right">Unit Price</th>
                                    <th className="py-4 px-6 text-center">Stock Level</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm text-slate-700 dark:text-slate-300">
                                {products.map((product) => {
                                    // Stock Styling Helper
                                    const stock = product.stock_quantity;
                                    let stockBadgeStyle = "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400";
                                    let stockLabel = "In Stock";
                                    
                                    if (stock === 0) {
                                        stockBadgeStyle = "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-450";
                                        stockLabel = "Out of Stock";
                                    } else if (stock <= 5) {
                                        stockBadgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-450";
                                        stockLabel = "Low Stock";
                                    }

                                    return (
                                        <tr 
                                            key={product.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                                        >
                                            <td className="py-4 px-6 font-mono font-bold text-indigo-650 dark:text-indigo-400">
                                                {product.sku}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-slate-900 dark:text-white">{product.name}</div>
                                            </td>
                                            <td className="py-4 px-6 text-right font-semibold text-slate-900 dark:text-slate-200">
                                                ${product.price.toFixed(2)}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-1">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{stock}</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${stockBadgeStyle}`}>
                                                        {stockLabel}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(product)}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-all"
                                                        title="Edit Product"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product)}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 dark:text-slate-450 hover:text-red-650 dark:hover:text-red-400 rounded-lg transition-all"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-up"
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingProduct ? "Edit Product Details" : "Register New Product"}
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Error Banner */}
                        {formError && (
                            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="font-medium">{formError}</span>
                            </div>
                        )}

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* SKU input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product SKU</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. LAPTOP-PRO-001"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
                                />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1.5">
                                    <Info className="w-3 h-3" />
                                    SKUs must be unique across the entire database.
                                </p>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. MacBook Pro 14"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Price Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                {/* Stock Quantity Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Qty</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="0"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingProduct ? "Save Changes" : "Register Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
