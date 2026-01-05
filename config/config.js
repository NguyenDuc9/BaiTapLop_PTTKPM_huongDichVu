const config = {
  API_URL: "https://localhost:7242",

  endpoints: {
    // Authentication
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",

    // Dashboard
    DASHBOARD_DAY: "/api/Dashboard/day",
    DASHBOARD_WEEK: "/api/Dashboard/week",
    DASHBOARD_MONTH: "/api/Dashboard/month",
    SELECTED_NOTIFICATIONS: "/api/Dashboard/notifications",
    DELETED_NOTIFICATION: "/api/Dashboard/notification",
    CalculateRevenueOfDay: "/api/Dashboard/revenue/day",
    CalculateRevenueOfWeekAndMonth: "/api/Dashboard/revenue/week-month",
    REVENUE_CHART: "/api/Dashboard/7dayrevenues",
    INVENTORY_WARNINGS: '/api/Dashboard/hangtons',
    TOP_PRODUCTS: '/api/Dashboard/hanghots',

    // Products (Quản lý Sản phẩm)
    PRODUCTS: "/api/products",
    PRODUCT_BY_ID: "/api/products/:id",
    PRODUCT_CREATE: "/api/products/create",
    PRODUCT_UPDATE: "/api/products/update/:id",
    PRODUCT_DELETE: "/api/products/delete/:id",

    // Categories (Danh mục sản phẩm)
    CATEGORIES: "/api/categories",
    CATEGORY_BY_ID: "/api/categories/:id",
    CATEGORY_CREATE: "/api/categories/create",
    CATEGORY_UPDATE: "/api/categories/update/:id",
    CATEGORY_DELETE: "/api/categories/delete/:id",

    // Warehouse (Quản lý Kho)
    INVENTORY: "/api/warehouse/inventory",
    INVENTORY_BY_ID: "/api/warehouse/inventory/:id",
    IMPORT_GOODS: "/api/warehouse/import",
    EXPORT_GOODS: "/api/warehouse/export",
    INVENTORY_UPDATE: "/api/warehouse/update-stock",

    // Sales (Bán hàng)
    INVOICES: "/api/sales/invoices",
    INVOICE_BY_ID: "/api/sales/invoices/:id",
    CREATE_INVOICE: "/api/sales/create-invoice",
    PRINT_INVOICE: "/api/sales/print-invoice/:id",
    CALCULATE_TOTAL: "/api/sales/calculate-total",
    PAYMENT: "/api/sales/payment",

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
  },

  // Helper function để lấy full URL
  getUrl: function (endpoint, params = {}) {
    let url = this.API_URL + endpoint;

    // Replace URL parameters (e.g., :id)
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });

    return url;
  },

  // Helper function để build URL với query params
  buildUrlWithQuery: function (endpoint, queryParams = {}) {
    const url = this.getUrl(endpoint);
    const params = new URLSearchParams(queryParams);
    const queryString = params.toString();

    return queryString ? `${url}?${queryString}` : url;
  }
};

export default config;

