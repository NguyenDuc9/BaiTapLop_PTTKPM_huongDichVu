const config = {
  API_URL: "https://localhost:7158",
  
  endpoints: {
    // Authentication
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    
    // Dashboard
    DASHBOARD_STATS: "/api/dashboard/statistics",
    RECENT_ORDERS: "/api/dashboard/recent-orders",
    LOW_STOCK: "/api/inventory/low-stock",
    TOP_PRODUCTS: "/api/sales/top-products",
    SALES_CHART: "/api/dashboard/sales-chart",
    
    // Products (Quản lý Sản phẩm)
    PRODUCTS: "/api/products",
    PRODUCT_BY_ID: "/api/products/:id",
    PRODUCT_CREATE: "/api/products",
    PRODUCT_UPDATE: "/api/products/:id",
    PRODUCT_DELETE: "/api/products/:id",
    
    // Categories (Danh mục sản phẩm)
    CATEGORIES: "/api/category",
    CATEGORY_BY_ID: "/api/category/:id",
    CATEGORY_CREATE: "/api/category",
    CATEGORY_UPDATE: "/api/category/:id",
    CATEGORY_DELETE: "/api/category/:id",
    
    // Warehouse (Quản lý Kho)
    INVENTORY: "/api/inventory",
    INVENTORY_BY_ID: "/api/inventory/:id",
    IMPORT_GOODS: "/api/warehouse/import",
    EXPORT_GOODS: "/api/warehouse/export",
    INVENTORY_UPDATE: "/api/warehouse/update-stock",
    
    // Sales (Bán hàng)
    INVOICES: "/api/sales",
    INVOICE_BY_ID: "/api/sales/:id",
    CREATE_INVOICE: "/api/sales",
    PRINT_INVOICE: "/api/sales/print-invoice/:id",
    CALCULATE_TOTAL: "/api/sales/calculate-total",
    PAYMENT: "/api/sales/payment",
    INVOICES_COMPLETED: "/api/sales/completed",
    
    // Customers (Quản lý Khách hàng)
    CUSTOMERS: "/api/customers",
    CUSTOMER_BY_ID: "/api/customers/:id",
    CUSTOMER_CREATE: "/api/customers/create",
    CUSTOMER_UPDATE: "/api/customers/update/:id",
    CUSTOMER_DELETE: "/api/customers/delete/:id",
    CUSTOMER_POINTS: "/api/customers/points/:id",
    CUSTOMER_ADD_POINTS: "/api/customers/add-points",
    CUSTOMER_HISTORY: "/api/customers/history/:id",
    
    // Reports (Báo cáo)
    REPORT_SALES: "/api/reports/sales",
    REPORT_INVENTORY: "/api/reports/inventory",
    REPORT_CUSTOMER: "/api/reports/customers",
    REPORT_REVENUE: "/api/reports/revenue",
    
    // Users (Quản lý người dùng - Admin only)
    USERS: "/api/users",
    USER_BY_ID: "/api/users/:id",
    USER_CREATE: "/api/users/create",
    USER_UPDATE: "/api/users/update/:id",
    USER_DELETE: "/api/users/delete/:id",

    // Promotions
    PROMOTIONS: "/api/promotions",
    PROMOTION_BY_ID: "/api/promotions/:id",

    // Taxes
    TAXES: "/api/taxes",
    TAX_BY_ID: "/api/taxes/:id",
  },
  
  // Helper function để lấy full URL
  getUrl: function(endpoint, params = {}) {
    let url = this.API_URL + endpoint;
    
    // Replace URL parameters (e.g., :id)
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
    
    return url;
  },
  
  // Helper function để build URL với query params
  buildUrlWithQuery: function(endpoint, queryParams = {}) {
    const url = this.getUrl(endpoint);
    const params = new URLSearchParams(queryParams);
    const queryString = params.toString();
    
    return queryString ? `${url}?${queryString}` : url;
  }
};

export default config;

