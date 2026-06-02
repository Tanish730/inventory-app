const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper function to handle fetch requests and throw descriptive errors
async function request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    
    // Default to JSON Content-Type if we're sending a body
    const defaultHeaders = {
        "Content-Type": "application/json",
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    if (config.body && typeof config.body !== "string") {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        
        // Try parsing JSON response (the API always returns JSON, even for errors)
        let data = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        }

        if (!response.ok) {
            // Extract the error message from the response data, defaulting to HTTP status text
            const errorMessage = data?.detail || response.statusText || "Something went wrong";
            
            // Create a custom error object carrying extra payload (like errorCode, stock levels, etc.)
            const error = new Error(errorMessage);
            error.status = response.status;
            error.code = data?.code; // e.g. "INSUFFICIENT_STOCK", "SKU_EXISTS"
            error.details = data;
            throw error;
        }

        return data;
    } catch (err) {
        // If it's already our custom Error, just rethrow it
        if (err.status) throw err;
        // Otherwise, it's a network issue (CORS, offline, etc.)
        const networkError = new Error("Failed to connect to the backend server. Please make sure it is running.");
        networkError.status = 503;
        throw networkError;
    }
}

// API client methods
export const api = {
    // Dashboard Stats
    getDashboardStats: () => request("/api/dashboard/stats"),

    // Products CRUD
    products: {
        getAll: (search = "") => {
            const query = search ? `?search=${encodeURIComponent(search)}` : "";
            return request(`/api/products${query}`);
        },
        get: (id) => request(`/api/products/${id}`),
        create: (data) => request("/api/products", { method: "POST", body: data }),
        update: (id, data) => request(`/api/products/${id}`, { method: "PUT", body: data }),
        delete: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
    },

    // Customers CRUD
    customers: {
        getAll: (search = "") => {
            const query = search ? `?search=${encodeURIComponent(search)}` : "";
            return request(`/api/customers${query}`);
        },
        get: (id) => request(`/api/customers/${id}`),
        create: (data) => request("/api/customers", { method: "POST", body: data }),
        update: (id, data) => request(`/api/customers/${id}`, { method: "PUT", body: data }),
        delete: (id) => request(`/api/customers/${id}`, { method: "DELETE" }),
    },

    // Orders CRUD
    orders: {
        getAll: () => request("/api/orders"),
        get: (id) => request(`/api/orders/${id}`),
        create: (data) => request("/api/orders", { method: "POST", body: data }),
    }
};
