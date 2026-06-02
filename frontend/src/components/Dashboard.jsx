import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Boxes
} from "lucide-react";

export default function Dashboard({ setActiveTab }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getDashboardStats();
            setStats(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">Loading dashboard statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-300">Failed to Load Dashboard</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
                <button 
                    onClick={fetchStats}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all shadow-md"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const cards = [
        {
            title: "Total Revenue",
            value: `$${stats?.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "emerald",
            desc: "Total value of orders"
        },
        {
            title: "Total Products",
            value: stats?.total_products || 0,
            icon: Package,
            color: "sky",
            desc: "Unique SKUs in catalog"
        },
        {
            title: "Total Customers",
            value: stats?.total_customers || 0,
            icon: Users,
            color: "violet",
            desc: "Registered client accounts"
        },
        {
            title: "Total Orders",
            value: stats?.total_orders || 0,
            icon: ShoppingCart,
            color: "amber",
            desc: "Successfully placed orders"
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Row with Header and Refresh */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Dashboard Overview
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Real-time metrics, system health, and inventory warnings.
                    </p>
                </div>
                <button 
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div 
                            key={idx}
                            className="relative overflow-hidden p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl shadow-slate-100/10 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.title}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{card.value}</h3>
                                </div>
                                <div className={`p-3 rounded-xl bg-${card.color}-500/10 dark:bg-${card.color}-500/20 text-${card.color}-600 dark:text-${card.color}-400`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 font-medium flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                {card.desc}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Main Dashboard Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Low Stock Alerts */}
                <div className="lg:col-span-2 p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/15 text-rose-500 rounded-lg">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Critical Stock Warnings</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Products with stock level at or below 5 units.</p>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${stats?.low_stock_count > 0 ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 animate-pulse' : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'}`}>
                            {stats?.low_stock_count || 0} Alert{stats?.low_stock_count !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex-1 mt-4 overflow-y-auto max-h-[300px] pr-2 space-y-3">
                        {stats?.low_stock_items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
                                <Boxes className="w-12 h-12 stroke-[1.5] mb-2" />
                                <p className="text-sm font-semibold">Inventory is healthy!</p>
                                <p className="text-xs">No products are currently low in stock.</p>
                            </div>
                        ) : (
                            stats?.low_stock_items.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/50 border border-slate-150 dark:border-slate-850 rounded-xl transition-all"
                                >
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">{item.name}</h4>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{item.sku}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${item.stock_quantity === 0 ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                                                {item.stock_quantity} left
                                            </span>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">${item.price.toFixed(2)} ea</p>
                                        </div>
                                        <button 
                                            onClick={() => setActiveTab("products")}
                                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                                        >
                                            Restock
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Inventory Summary */}
                <div className="p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Inventory Status</h2>
                        
                        <div className="space-y-6 mt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <span>Stock Warning Rate</span>
                                    <span>{stats?.total_products ? Math.round((stats.low_stock_count / stats.total_products) * 100) : 0}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${stats?.low_stock_count > 0 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${stats?.total_products ? (stats.low_stock_count / stats.total_products) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-100/50 dark:border-slate-800/30 text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Asset Value</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-100">${stats?.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100/50 dark:border-slate-800/30 text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Unique Product SKUs</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{stats?.total_products || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total Orders Handled</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{stats?.total_orders || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setActiveTab("orders")}
                        className="w-full mt-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Create New Order
                    </button>
                </div>
            </div>
        </div>
    );
}
