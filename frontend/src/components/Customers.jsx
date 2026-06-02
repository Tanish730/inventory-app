import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Mail, 
  Phone, 
  AlertCircle, 
  X,
  Loader2,
  RefreshCw
} from "lucide-react";

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const fetchCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.customers.getAll(search);
            setCustomers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleOpenAddModal = () => {
        setEditingCustomer(null);
        setFormData({ name: "", email: "", phone: "" });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone || ""
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);
        setFormError(null);

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null
        };

        try {
            if (editingCustomer) {
                await api.customers.update(editingCustomer.id, payload);
            } else {
                await api.customers.create(payload);
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (err) {
            if (err.code === "EMAIL_EXISTS") {
                setFormError(`Customer email '${payload.email}' is already registered. Please use a unique email address.`);
            } else {
                setFormError(err.message);
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteCustomer = async (customer) => {
        if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"? This will delete all their order history.`)) {
            return;
        }
        try {
            await api.customers.delete(customer.id);
            fetchCustomers();
        } catch (err) {
            alert(`Failed to delete customer: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Customers Database
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Register, search, and manage your customer accounts and records.
                    </p>
                </div>
                <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Register Customer
                </button>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search customers by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
                {/* Manual Reload Button */}
                <button 
                    onClick={fetchCustomers}
                    className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Customers Grid/Table */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl overflow-hidden">
                {loading && customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fetching customer records...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                        <h3 className="font-semibold text-slate-850 dark:text-slate-200">Error Loading Customers</h3>
                        <p className="text-sm text-red-500 max-w-md mt-1">{error}</p>
                        <button 
                            onClick={fetchCustomers}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-indigo-700 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 stroke-[1.5] mb-3" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-350">No Customers Found</h3>
                        <p className="text-sm text-slate-455 dark:text-slate-500 max-w-xs mt-1">
                            {search ? "No matches found for your search term." : "Create your first customer to build the database!"}
                        </p>
                        {search && (
                            <button 
                                onClick={() => setSearch("")}
                                className="mt-4 px-4 py-2 border border-slate-250 dark:border-slate-750 text-slate-655 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
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
                                    <th className="py-4 px-6">Customer Name</th>
                                    <th className="py-4 px-6">Email Address</th>
                                    <th className="py-4 px-6">Phone Number</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm text-slate-700 dark:text-slate-300">
                                {customers.map((customer) => (
                                    <tr 
                                        key={customer.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                                    >
                                        <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                                            {customer.name}
                                        </td>
                                        <td className="py-4 px-6">
                                            <a 
                                                href={`mailto:${customer.email}`}
                                                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-all"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                                {customer.email}
                                            </a>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-slate-800 dark:text-slate-300">
                                            {customer.phone ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    {customer.phone}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-600 italic">No phone set</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(customer)}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-all"
                                                    title="Edit Customer"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCustomer(customer)}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 dark:text-slate-450 hover:text-red-650 dark:hover:text-red-400 rounded-lg transition-all"
                                                    title="Delete Customer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-up"
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingCustomer ? "Edit Customer Info" : "Register New Customer"}
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
                            {/* Name Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Prashant Sharma"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. prashant@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* Phone Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. +1 555-0199"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
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
                                    {editingCustomer ? "Save Changes" : "Register Customer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
