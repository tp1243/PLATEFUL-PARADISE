document.addEventListener('DOMContentLoaded', initDashboard);

let revenueChart = null;
let salesDistributionChart = null;
let currentRevenueChartType = 'bar';
let currentDistributionChartType = 'pie';
let chartDataCache = {};
let isInitialized = false;

// Initialize the dashboard
async function initDashboard() {
    if (isInitialized) return;
    
    try {
        if (!window.db) {
            console.error("❌ Firestore (db) is not initialized yet!");
            showErrorMessage();
            return;
        }

        setupEventListeners();
        updateLastUpdatedTime();
        await loadData();
        isInitialized = true;
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showErrorMessage();
    }
}

// Set up event listeners
function setupEventListeners() {
    try {
        // Revenue chart tabs
        document.getElementById('barChartTab')?.addEventListener('click', () => switchRevenueChartType('bar'));
        document.getElementById('lineChartTab')?.addEventListener('click', () => switchRevenueChartType('line'));
        document.getElementById('areaChartTab')?.addEventListener('click', () => switchRevenueChartType('line', true));

        // Sales distribution chart tabs
        document.getElementById('pieChartTab')?.addEventListener('click', () => switchDistributionChartType('pie'));
        document.getElementById('doughnutChartTab')?.addEventListener('click', () => switchDistributionChartType('doughnut'));
        document.getElementById('polarChartTab')?.addEventListener('click', () => switchDistributionChartType('polarArea'));

        // Filter change listeners
        document.getElementById('dateRange')?.addEventListener('change', () => loadData());
        document.getElementById('categoryFilter')?.addEventListener('change', () => loadData(true));
        document.getElementById('statusFilter')?.addEventListener('change', () => loadData(true));
        document.getElementById('showTransactions')?.addEventListener('change', () => loadData(true));

        // Add debounced resize handler
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                safeResizeCharts();
            }, 200);
        });
    } catch (error) {
        console.error("❌ Error setting up event listeners:", error);
    }
}

// Safely resize charts with error handling
function safeResizeCharts() {
    try {
        if (revenueChart && typeof revenueChart.resize === 'function') {
            revenueChart.resize();
        }
        if (salesDistributionChart && typeof salesDistributionChart.resize === 'function') {
            salesDistributionChart.resize();
        }
    } catch (error) {
        console.error("❌ Error resizing charts:", error);
    }
}

// Load all data from Firestore
async function loadData(updateOnly = false) {
    try {
        showLoadingState();
        
        const ordersRef = window.db.collection('orders');
        const snapshot = await ordersRef.orderBy('timestamp', 'desc').get();
        
        if (snapshot.empty) {
            console.log("No orders found");
            updateUIWithEmptyState();
            return;
        }

        const orders = [];
        snapshot.forEach(doc => {
            try {
                const orderData = doc.data();
                orders.push({
                    id: doc.id,
                    ...orderData,
                    date: orderData.timestamp?.toDate ? orderData.timestamp.toDate() : new Date(orderData.date || new Date())
                });
            } catch (parseError) {
                console.error("❌ Error parsing order:", doc.id, parseError);
            }
        });

        if (updateOnly) {
            processDataForTable(orders);
            updateSideMetrics(orders);
        } else {
            processData(orders);
        }
    } catch (error) {
        console.error("❌ Error loading data:", error);
        showErrorMessage();
    } finally {
        updateLastUpdatedTime();
    }
}

function showLoadingState() {
    const tableBody = document.getElementById('transactionsTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading data...</p>
                </td>
            </tr>
        `;
    }
}

function updateUIWithEmptyState() {
    updateCharts([], []);
    updateTransactionsTable([]);
    calculateMetrics([], []);
    updateSideMetrics([]);
}

// Process the loaded data
function processData(orders) {
    try {
        // Filter orders based on selected criteria
        const filteredOrders = filterOrders(orders);
        
        updateCategoriesDropdown(orders);
        calculateMetrics(filteredOrders, orders);
        
        // Process chart data
        const chartData = processChartData(filteredOrders);
        updateCharts(chartData.dates, chartData.revenues, chartData.categories, chartData.categoryAmounts);
        
        const showCount = parseInt(document.getElementById('showTransactions')?.value) || 10;
        updateTransactionsTable(filteredOrders, showCount);
        updateSideMetrics(filteredOrders);
    } catch (error) {
        console.error("❌ Error processing data:", error);
        showErrorMessage();
    }
}

function filterOrders(orders) {
    try {
        const dateRangeValue = document.getElementById('dateRange')?.value || '30';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        
        const now = new Date();
        const startDate = new Date();
        
        // Determine date range for filtering
        let dateRange = 30; // Default to 30 days
        if (dateRangeValue !== 'all') {
            const parsedRange = parseInt(dateRangeValue);
            dateRange = !isNaN(parsedRange) ? parsedRange : 30;
        }
        
        startDate.setDate(now.getDate() - dateRange);
        
        return orders.filter(order => {
            try {
                const orderDate = order.date;
                const dateMatch = dateRangeValue === 'all' || orderDate >= startDate;
                const categoryMatch = categoryFilter === 'all' || order.category === categoryFilter;
                const statusMatch = statusFilter === 'all' || order.status === statusFilter;
                
                return dateMatch && categoryMatch && statusMatch;
            } catch (filterError) {
                console.error("❌ Error filtering order:", order.id, filterError);
                return false;
            }
        });
    } catch (error) {
        console.error("❌ Error in filterOrders:", error);
        return [];
    }
}

// Process chart data with proper validation
function processChartData(orders) {
    try {
        // Check cache first
        const cacheKey = JSON.stringify({
            dateRange: document.getElementById('dateRange')?.value,
            category: document.getElementById('categoryFilter')?.value,
            status: document.getElementById('statusFilter')?.value,
            count: orders.length
        });
        
        if (chartDataCache[cacheKey]) {
            return chartDataCache[cacheKey];
        }
        
        // Group orders by date
        const dateGroups = {};
        const categoryGroups = {};
        
        orders.forEach(order => {
            try {
                // Format date for chart (YYYY-MM-DD)
                const dateKey = order.date.toISOString().split('T')[0];
                const category = order.category || 'Other';
                
                // Calculate order total from items
                const orderTotal = calculateOrderTotal(order);
                
                // Only include positive revenue
                if (orderTotal > 0) {
                    // Date-based grouping
                    if (!dateGroups[dateKey]) dateGroups[dateKey] = 0;
                    dateGroups[dateKey] += orderTotal;
                    
                    // Category-based grouping
                    if (!categoryGroups[category]) categoryGroups[category] = 0;
                    categoryGroups[category] += orderTotal;
                }
            } catch (groupError) {
                console.error("❌ Error processing order for chart:", order.id, groupError);
            }
        });
        
        // Convert to sorted arrays for charts
        const dates = Object.keys(dateGroups).sort();
        const revenues = dates.map(date => dateGroups[date]);
        
        const categories = Object.keys(categoryGroups).filter(
            cat => categoryGroups[cat] > 0
        );
        
        const categoryAmounts = categories.map(cat => categoryGroups[cat]);
        
        // Find top revenue day
        updateTopDayInfo(dateGroups, dates);
        
        // Cache the results
        chartDataCache[cacheKey] = { dates, revenues, categories, categoryAmounts };
        
        return { dates, revenues, categories, categoryAmounts };
    } catch (error) {
        console.error("❌ Error in processChartData:", error);
        return { dates: [], revenues: [], categories: [], categoryAmounts: [] };
    }
}

function calculateOrderTotal(order) {
    try {
        if (order.totalAmount) return order.totalAmount;
        
        return (order.items || []).reduce((sum, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
        }, 0);
    } catch (error) {
        console.error("❌ Error calculating order total:", order.id, error);
        return 0;
    }
}

function updateTopDayInfo(dateGroups, dates) {
    try {
        const topDayElement = document.getElementById('topDay');
        const topDayAmountElement = document.getElementById('topDayAmount');
        
        if (!topDayElement || !topDayAmountElement) return;
        
        if (dates.length === 0) {
            topDayElement.textContent = 'N/A';
            topDayAmountElement.textContent = '0';
            return;
        }

        const topDay = dates.reduce((max, date) => 
            dateGroups[date] > dateGroups[max] ? date : max, dates[0]);
        
        topDayElement.textContent = new Date(topDay).toLocaleDateString();
        topDayAmountElement.textContent = formatNumber(Math.round(dateGroups[topDay]));
    } catch (error) {
        console.error("❌ Error updating top day info:", error);
    }
}

// Update charts with proper data validation
function updateCharts(dates, revenues, categories, categoryAmounts) {
    try {
        updateRevenueChart(dates, revenues);
        updateDistributionChart(categories, categoryAmounts);
    } catch (error) {
        console.error("❌ Error updating charts:", error);
    }
}

function updateRevenueChart(dates, revenues) {
    try {
        const revenueCtx = document.getElementById('revenueChart');
        if (!revenueCtx) return;
        
        // Format dates for display
        const formattedDates = dates.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        // Destroy existing chart safely
        if (revenueChart) {
            try {
                revenueChart.destroy();
            } catch (destroyError) {
                console.error("❌ Error destroying revenue chart:", destroyError);
            }
            revenueChart = null;
        }
        
        // Check if we have data to display
        if (revenues.length === 0) {
            createEmptyRevenueChart(revenueCtx);
            return;
        }
        
        // Create revenue chart with stabilized configuration
        revenueChart = new Chart(revenueCtx, {
            type: currentRevenueChartType,
            data: {
                labels: formattedDates,
                datasets: [{
                    label: 'Revenue (₹)',
                    data: revenues,
                    backgroundColor: 'rgba(123, 97, 255, 0.5)',
                    borderColor: '#7b61ff',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: currentRevenueChartType === 'line' && 
                          document.getElementById('areaChartTab')?.classList.contains('active')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 800,
                    onComplete: () => {
                        try {
                            if (revenueChart && typeof revenueChart.resize === 'function') {
                                revenueChart.resize();
                            }
                        } catch (resizeError) {
                            console.error("❌ Error resizing revenue chart:", resizeError);
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `₹${formatNumber(context.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#a0a3bd',
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grace: '5%',
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#a0a3bd',
                            callback: (value) => '₹' + formatNumber(value),
                            maxTicksLimit: 6
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 5
                    },
                    line: {
                        borderWidth: 2,
                        tension: 0.1
                    },
                    bar: {
                        borderRadius: 4
                    }
                }
            }
        });
    } catch (error) {
        console.error("❌ Error updating revenue chart:", error);
    }
}

function createEmptyRevenueChart(ctx) {
    try {
        if (revenueChart) {
            try {
                revenueChart.destroy();
            } catch (destroyError) {
                console.error("❌ Error destroying existing revenue chart:", destroyError);
            }
        }
        
        revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [0],
                    backgroundColor: ['rgba(200, 200, 200, 0.2)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (error) {
        console.error("❌ Error creating empty revenue chart:", error);
    }
}

function updateDistributionChart(categories, categoryAmounts) {
    try {
        const distributionCtx = document.getElementById('salesDistributionChart');
        if (!distributionCtx) return;
        
        // Destroy existing chart safely
        if (salesDistributionChart) {
            try {
                salesDistributionChart.destroy();
            } catch (destroyError) {
                console.error("❌ Error destroying distribution chart:", destroyError);
            }
            salesDistributionChart = null;
        }
        
        if (categories.length === 0) {
            createEmptyDistributionChart(distributionCtx);
            return;
        }
        
        // Generate colors for all categories
        const backgroundColors = generateCategoryColors(categories.length);
        
        // Create stabilized distribution chart
        salesDistributionChart = new Chart(distributionCtx, {
            type: currentDistributionChartType,
            data: {
                labels: categories,
                datasets: [{
                    data: categoryAmounts,
                    backgroundColor: backgroundColors,
                    borderColor: '#1e2131',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 800,
                    onComplete: () => {
                        try {
                            if (salesDistributionChart && typeof salesDistributionChart.resize === 'function') {
                                salesDistributionChart.resize();
                            }
                        } catch (resizeError) {
                            console.error("❌ Error resizing distribution chart:", resizeError);
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#a0a3bd',
                            usePointStyle: true,
                            boxWidth: 10,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((sum, amount) => sum + amount, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                return `₹${formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                elements: {
                    arc: {
                        borderWidth: 2
                    }
                },
                interaction: {
                    mode: 'point'
                }
            }
        });
    } catch (error) {
        console.error("❌ Error updating distribution chart:", error);
    }
}

function generateCategoryColors(count) {
    try {
        const baseColors = [
            'rgba(123, 97, 255, 0.8)',
            'rgba(233, 30, 99, 0.8)',
            'rgba(3, 169, 244, 0.8)',
            'rgba(0, 200, 83, 0.8)',
            'rgba(255, 145, 0, 0.8)',
            'rgba(156, 39, 176, 0.8)'
        ];
        
        if (count <= baseColors.length) return baseColors.slice(0, count);
        
        // Generate additional colors if needed
        const colors = [...baseColors];
        for (let i = baseColors.length; i < count; i++) {
            const hue = (i * 137.5) % 360;
            colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
        }
        return colors;
    } catch (error) {
        console.error("❌ Error generating category colors:", error);
        return ['rgba(123, 97, 255, 0.8)'];
    }
}

function createEmptyDistributionChart(ctx) {
    try {
        if (salesDistributionChart) {
            try {
                salesDistributionChart.destroy();
            } catch (destroyError) {
                console.error("❌ Error destroying existing distribution chart:", destroyError);
            }
        }
        
        salesDistributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(200, 200, 200, 0.2)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    } catch (error) {
        console.error("❌ Error creating empty distribution chart:", error);
    }
}

function updateTransactionsTable(orders, showCount = 10) {
    try {
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No transactions found</td></tr>';
            return;
        }
        
        // Sort by date (newest first)
        const sortedOrders = [...orders].sort((a, b) => b.date - a.date);
        const displayOrders = sortedOrders.slice(0, showCount);
        
        displayOrders.forEach(order => {
            try {
                const row = document.createElement('tr');
                const shortId = order.id.substring(0, 8);
                const formattedDate = order.date.toLocaleDateString();
                const orderTotal = calculateOrderTotal(order);
                
                row.innerHTML = `
                    <td>${shortId}</td>
                    <td>${formattedDate}</td>
                    <td>${order.customerName || 'Walk-in Customer'}</td>
                    <td>${order.category || 'Other'}</td>
                    <td>₹${formatNumber(Math.round(orderTotal))}</td>
                    <td><span class="transaction-status ${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                `;
                
                tableBody.appendChild(row);
            } catch (rowError) {
                console.error("❌ Error creating table row for order:", order.id, rowError);
            }
        });
    } catch (error) {
        console.error("❌ Error updating transactions table:", error);
    }
}

// Calculate and update metrics
function calculateMetrics(filteredOrders, allOrders) {
    try {
        // Calculate totals
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0);
        const totalOrders = filteredOrders.length;
        const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate conversion rate (simplified for demo)
        const conversionRate = totalOrders > 0 ? (Math.min(totalOrders / 10, 100)) : 0;
        
        // Previous period comparison
        const prevTotalRevenue = totalRevenue * 0.85; // Simulated previous period
        const prevTotalOrders = Math.floor(totalOrders * 0.9); // Simulated previous period
        
        // Calculate changes
        const revenueChange = calculatePercentageChange(totalRevenue, prevTotalRevenue);
        const ordersChange = calculatePercentageChange(totalOrders, prevTotalOrders);
        const averageChange = calculatePercentageChange(averageOrder, prevTotalRevenue / prevTotalOrders);
        
        // Update UI
        const totalRevenueElement = document.getElementById('totalRevenue');
        const totalOrdersElement = document.getElementById('totalOrders');
        const averageOrderElement = document.getElementById('averageOrder');
        const conversionRateElement = document.getElementById('conversionRate');
        
        if (totalRevenueElement) totalRevenueElement.textContent = formatNumber(Math.round(totalRevenue));
        if (totalOrdersElement) totalOrdersElement.textContent = totalOrders;
        if (averageOrderElement) averageOrderElement.textContent = formatNumber(Math.round(averageOrder));
        if (conversionRateElement) conversionRateElement.textContent = conversionRate.toFixed(1);
        
        updateChangeIndicator('revenueChange', revenueChange);
        updateChangeIndicator('ordersChange', ordersChange);
        updateChangeIndicator('averageChange', averageChange);
    } catch (error) {
        console.error("❌ Error calculating metrics:", error);
    }
}

function calculatePercentageChange(current, previous) {
    try {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    } catch (error) {
        console.error("❌ Error calculating percentage change:", error);
        return 0;
    }
}

function updateChangeIndicator(elementId, change) {
    try {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const absChange = Math.abs(change);
        
        if (change > 0) {
            element.innerHTML = `<i class="fas fa-arrow-up"></i> ${absChange.toFixed(1)}% vs previous period`;
            element.className = 'metric-change positive';
        } else if (change < 0) {
            element.innerHTML = `<i class="fas fa-arrow-down"></i> ${absChange.toFixed(1)}% vs previous period`;
            element.className = 'metric-change negative';
        } else {
            element.innerHTML = `0% vs previous period`;
            element.className = 'metric-change';
        }
    } catch (error) {
        console.error("❌ Error updating change indicator:", error);
    }
}

function updateSideMetrics(orders) {
    try {
        // Find top selling product
        const productCounts = {};
        orders.forEach(order => {
            try {
                (order.items || []).forEach(item => {
                    productCounts[item.name] = (productCounts[item.name] || 0) + (item.quantity || 1);
                });
            } catch (itemError) {
                console.error("❌ Error processing items for order:", order.id, itemError);
            }
        });
        
        const topProduct = Object.entries(productCounts).reduce((max, [name, count]) => 
            count > max.count ? {name, count} : max, {name: 'N/A', count: 0}).name;
        
        // Find most loyal customer
        const customerCounts = {};
        orders.forEach(order => {
            try {
                const customer = order.customerName || 'Walk-in Customer';
                customerCounts[customer] = (customerCounts[customer] || 0) + 1;
            } catch (customerError) {
                console.error("❌ Error processing customer for order:", order.id, customerError);
            }
        });
        
        const loyalCustomer = Object.entries(customerCounts).reduce((max, [name, count]) => 
            count > max.count ? {name, count} : max, {name: 'N/A', count: 0}).name;
        
        // Calculate fulfillment rate
        const completedOrders = orders.filter(o => o.status === 'completed').length;
        const fulfillmentRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;
        
        // Update UI
        const topProductElement = document.getElementById('topProduct');
        const loyalCustomerElement = document.getElementById('loyalCustomer');
        const fulfillmentRateElement = document.getElementById('fulfillmentRate');
        
        if (topProductElement) topProductElement.textContent = topProduct;
        if (loyalCustomerElement) loyalCustomerElement.textContent = loyalCustomer;
        if (fulfillmentRateElement) fulfillmentRateElement.textContent = fulfillmentRate.toFixed(1) + '%';
    } catch (error) {
        console.error("❌ Error updating side metrics:", error);
    }
}

function updateCategoriesDropdown(orders) {
    try {
        const dropdown = document.getElementById('categoryFilter');
        if (!dropdown) return;
        
        // Get existing categories
        const existingCategories = new Set();
        for (let i = 1; i < dropdown.options.length; i++) {
            existingCategories.add(dropdown.options[i].value);
        }
        
        // Find all unique categories in orders
        const orderCategories = new Set();
        orders.forEach(order => {
            try {
                if (order.category) orderCategories.add(order.category);
            } catch (categoryError) {
                console.error("❌ Error processing category for order:", order.id, categoryError);
            }
        });
        
        // Add new categories to dropdown
        orderCategories.forEach(category => {
            if (!existingCategories.has(category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                dropdown.appendChild(option);
            }
        });
    } catch (error) {
        console.error("❌ Error updating categories dropdown:", error);
    }
}

function formatNumber(number) {
    try {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch (error) {
        console.error("❌ Error formatting number:", error);
        return number;
    }
}

function switchRevenueChartType(type, fill = false) {
    try {
        currentRevenueChartType = type;
        
        // Update active tab
        document.querySelectorAll('#barChartTab, #lineChartTab, #areaChartTab').forEach(tab => {
            if (tab) tab.classList.remove('active');
        });
        
        const activeTab = type === 'bar' ? 'barChartTab' : 
                         fill ? 'areaChartTab' : 'lineChartTab';
        const activeTabElement = document.getElementById(activeTab);
        if (activeTabElement) activeTabElement.classList.add('active');
        
        // Update chart if it exists
        if (revenueChart) {
            revenueChart.config.type = type;
            revenueChart.data.datasets[0].fill = fill;
            revenueChart.update();
        }
    } catch (error) {
        console.error("❌ Error switching revenue chart type:", error);
    }
}

function switchDistributionChartType(type) {
    try {
        currentDistributionChartType = type;
        
        // Update active tab
        document.querySelectorAll('#pieChartTab, #doughnutChartTab, #polarChartTab').forEach(tab => {
            if (tab) tab.classList.remove('active');
        });
        
        const activeTabElement = document.getElementById(`${type}ChartTab`);
        if (activeTabElement) activeTabElement.classList.add('active');
        
        // Update chart if it exists
        if (salesDistributionChart) {
            salesDistributionChart.config.type = type;
            salesDistributionChart.update();
        }
    } catch (error) {
        console.error("❌ Error switching distribution chart type:", error);
    }
}

function updateLastUpdatedTime() {
    try {
        const now = new Date();
        const lastUpdatedElement = document.getElementById('lastUpdatedTime');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = now.toLocaleString();
        }
    } catch (error) {
        console.error("❌ Error updating last updated time:", error);
    }
}

function showErrorMessage() {
    try {
        const metrics = document.querySelectorAll('.metric-card, .chart-container, .side-metric');
        metrics.forEach(metric => {
            metric.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                    <p style="margin-top: 10px;">Failed to load data</p>
                </div>
            `;
        });
    } catch (error) {
        console.error("❌ Error showing error message:", error);
    }
}