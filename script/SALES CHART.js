// ========================================
// SALES CHART - BIỂU ĐỒ DOANH THU 7 NGÀY
// ========================================

// Cấu hình API endpoint
const API_BASE_URL = 'http://localhost:3000/api'; // Thay đổi URL của bạn

// Khởi tạo biểu đồ
let salesChart = null;

// Hàm format tiền VND
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Hàm lấy dữ liệu từ API
async function fetchRevenueData() {
    try {
        const response = await fetch(`${API_BASE_URL}/revenue/chart?period=7days`);

        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu');
        }

        const result = await response.json();

        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || 'Lỗi không xác định');
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        // Trả về dữ liệu mẫu nếu API lỗi
        return getMockData();
    }
}

// Dữ liệu mẫu (dùng khi chưa có API)
function getMockData() {
    return {
        chart: {
            labels: ["28/12", "29/12", "30/12", "31/12", "01/01", "02/01", "03/01"],
            datasets: [{
                label: "Doanh thu",
                data: [1500000, 2300000, 1800000, 2700000, 3100000, 2900000, 3500000]
            }]
        },
        summary: {
            total: 17900000,
            average: 2557143,
            highest: 3500000,
            lowest: 1500000,
            growth: 12.5
        }
    };
}

// Hàm khởi tạo biểu đồ
function initSalesChart(data) {
    const ctx = document.getElementById('salesChart');

    if (!ctx) {
        console.error('Không tìm thấy canvas element');
        return;
    }

    // Hủy biểu đồ cũ nếu có
    if (salesChart) {
        salesChart.destroy();
    }

    const chartData = data.chart;

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: chartData.datasets[0].label || 'Doanh thu',
                data: chartData.datasets[0].data,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4, // Làm đường cong mượt
                pointRadius: 5,
                pointBackgroundColor: '#4f46e5',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#4f46e5',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 13,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return 'Doanh thu: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            // Hiển thị theo triệu đồng
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            }
                            return value.toLocaleString('vi-VN');
                        },
                        font: {
                            size: 12
                        },
                        padding: 8
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        },
                        padding: 8
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Hàm hiển thị loading
function showChartLoading() {
    const cardBody = document.querySelector('#salesChart').parentElement;
    cardBody.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
      <div style="text-align: center;">
        <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #4f46e5;"></i>
        <p style="margin-top: 16px; color: #6b7280;">Đang tải dữ liệu...</p>
      </div>
    </div>
  `;
}

// Hàm hiển thị lỗi
function showChartError(message) {
    const cardBody = document.querySelector('#salesChart').parentElement;
    cardBody.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
      <div style="text-align: center; color: #dc2626;">
        <i class="fas fa-exclamation-triangle" style="font-size: 32px;"></i>
        <p style="margin-top: 16px;">${message}</p>
        <button onclick="loadSalesChart()" style="margin-top: 12px; padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Thử lại
        </button>
      </div>
    </div>
  `;
}

// Hàm tải và hiển thị biểu đồ
async function loadSalesChart() {
    try {
        // Reset canvas
        const cardBody = document.querySelector('#salesChart')?.parentElement;
        if (cardBody) {
            cardBody.innerHTML = '<canvas id="salesChart"></canvas>';
        }

        // Hiển thị loading (có thể bỏ qua nếu load nhanh)
        // showChartLoading();

        // Lấy dữ liệu
        const data = await fetchRevenueData();

        // Khởi tạo biểu đồ
        initSalesChart(data);

        // Cập nhật summary (nếu có)
        if (data.summary) {
            updateDashboardSummary(data.summary);
        }

    } catch (error) {
        console.error('Lỗi khi tải biểu đồ:', error);
        showChartError('Không thể tải biểu đồ. Vui lòng thử lại sau.');
    }
}

// Hàm cập nhật summary cards (tùy chọn)
function updateDashboardSummary(summary) {
    // Cập nhật doanh thu hôm nay (hoặc tổng 7 ngày)
    const todayRevenueEl = document.getElementById('todayRevenue');
    if (todayRevenueEl && summary.total) {
        todayRevenueEl.textContent = formatCurrency(summary.total);
    }

    // Có thể thêm các cập nhật khác ở đây
}

// Khởi chạy khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', function () {
    // Đảm bảo Chart.js đã load
    if (typeof Chart !== 'undefined') {
        loadSalesChart();
    } else {
        console.error('Chart.js chưa được load');
    }

    // Thêm event listener cho nút "Xem chi tiết" (nếu cần)
    const viewDetailBtn = document.querySelector('.dashboard-card .btn-small');
    if (viewDetailBtn) {
        viewDetailBtn.addEventListener('click', function () {
            // Chuyển đến trang báo cáo chi tiết
            console.log('Xem chi tiết doanh thu');
            // window.location.href = '#report-sales';
        });
    }
});

// Export để có thể gọi từ nơi khác
window.loadSalesChart = loadSalesChart;