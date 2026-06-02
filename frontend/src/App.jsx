import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import Products from "./components/Products";
import Customers from "./components/Customers";
import Orders from "./components/Orders";
import { api } from "./services/api";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Sun, 
  Moon, 
  Radio,
  Menu,
  X
} from "lucide-react";

export default function App() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "dark";
    });
    
    // API Heartbeat connection status
    const [apiOnline, setApiOnline] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    
    // Mobile responsive sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sync HTML theme class
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Query API online status on startup and poll every 10 seconds
    const checkApiStatus = async () => {
        try {
            await api.getDashboardStats();
            setApiOnline(true);
        } catch (err) {
            setApiOnline(false);
        } finally {
            setCheckingStatus(false);
        }
    };

    useEffect(() => {
        checkApiStatus();
        const interval = setInterval(checkApiStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "products", label: "Products Catalog", icon: Package },
        { id: "customers", label: "Customers Db", icon: Users },
        { id: "orders", label: "Orders Registry", icon: ShoppingCart },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <Dashboard setActiveTab={setActiveTab} />;
            case "products":
                return <Products />;
            case "customers":
                return <Customers />;
            case "orders":
                return <Orders />;
            default:
                return <Dashboard setActiveTab={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-300 font-sans">
            {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
            <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 shrink-0">
                {/* Brand Logo Header */}
                <div className="h-16 px-6 border-b border-slate-150 dark:border-slate-850 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20">
                        S
                    </div>
                    <span className="font-extrabold text-lg text-slate-850 dark:text-white tracking-tight">StockFlow</span>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-4 space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                    isActive 
                                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400" 
                                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850"
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar footer showing user profile placeholder & environment */}
                <div className="p-4 border-t border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-955/20 text-xs">
                    <p className="font-semibold text-slate-550 dark:text-slate-400">Environment: Local Dev</p>
                    <p className="text-slate-400 dark:text-slate-500 mt-0.5">SQLite Database active</p>
                </div>
            </aside>

            {/* MOBILE SIDEBAR DRAWERS */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                    ></div>
                    {/* Drawer body */}
                    <aside className="relative flex flex-col w-64 bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-850 z-10 animate-slide-right">
                        <div className="h-16 px-6 border-b border-slate-150 dark:border-slate-855 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg">S</div>
                                <span className="font-extrabold text-lg text-slate-900 dark:text-white">StockFlow</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1.5">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                            isActive 
                                            ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" 
                                            : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850"
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>
                </div>
            )}

            {/* 2. MAIN PANEL WINDOW */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* HEADER */}
                <header className="h-16 px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-850/50 flex justify-between items-center z-40 sticky top-0">
                    <div className="flex items-center gap-4">
                        {/* Mobile hamburger menu */}
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="text-sm font-black text-slate-850 dark:text-white capitalize tracking-wide hidden sm:block">
                            StockFlow / {activeTab}
                        </h2>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-4">
                        {/* API Connection Pulse Indicator */}
                        <div 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                                apiOnline 
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" 
                                : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border-rose-100 dark:border-rose-900/30"
                            }`}
                            title={apiOnline ? "Backend service connected" : "Backend service offline / connecting"}
                        >
                            <Radio className={`w-3.5 h-3.5 ${apiOnline ? 'animate-pulse' : ''}`} />
                            <span className="hidden sm:inline">{apiOnline ? "System Online" : "System Offline"}</span>
                        </div>

                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-150 dark:border-slate-750 text-slate-500 dark:text-slate-300 rounded-xl transition-all active:scale-90 cursor-pointer shadow-sm"
                            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                        >
                            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                    </div>
                </header>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
