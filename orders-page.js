// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Global variables
let currentPage = 1;
const ordersPerPage = 10;
let allOrders = [];
let filteredOrders = [];
let currentOrderId = null;
const seenOrderIds = new Set(); // Track unique order IDs

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('orderSearch').addEventListener('input', filterOrders);
    
    // Status filter
    document.getElementById('filterStatus').addEventListener('change', filterOrders);
    
    // Pagination buttons
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderOrders();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderOrders();
        }
    });
    
    // Export button
    document.getElementById('exportOrders').addEventListener('click', exportOrders);
    
    // Print button in modal
    document.getElementById('printOrder').addEventListener('click', printOrder);
    
    // Update status button
    document.getElementById('saveStatus').addEventListener('click', updateOrderStatus);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('orderDetailsModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

async function loadOrders() {
    try {
        // Show loading state
        document.getElementById('ordersTableBody').innerHTML = `
            <tr>
                <td colspan="8" class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading orders...</p>
                </td>
            </tr>
        `;

        // Clear previous data
        allOrders = [];
        seenOrderIds.clear();

        // Get orders from orders collection
        const ordersQuery = db.collection('orders').orderBy('timestamp', 'desc');
        const ordersSnapshot = await ordersQuery.get();
        
        // Process regular orders
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;
            order.source = 'order';
            
            // Use orderNo as unique identifier if available, otherwise use document ID
            const uniqueId = order.orderNo || doc.id;
            
            if (!seenOrderIds.has(uniqueId)) {
                seenOrderIds.add(uniqueId);
                allOrders.push(order);
            }
        });

        try {
            // Get paid sales from sales collection
            const salesQuery = db.collection('sales')
                .where('paymentStatus', '==', 'Paid')
                .orderBy('timestamp', 'desc');
            
            const salesSnapshot = await salesQuery.get();
            
            // Process paid sales
            salesSnapshot.forEach(doc => {
                const sale = doc.data();
                // Convert sale to order format
                const order = {
                    id: doc.id,
                    source: 'sale',
                    orderNo: sale.orderNo || `SALE-${doc.id.substring(0, 8)}`,
                    customerName: sale.customerName || "Walk-in Customer",
                    customerPhone: sale.customerPhone || "",
                    items: sale.items || [],
                    subtotal: sale.subtotal || sale.totalAmount,
                    tax: sale.tax || 0,
                    totalAmount: sale.totalAmount || 0,
                    paymentMethod: sale.paymentMethod || "Card",
                    status: "completed",
                    timestamp: sale.timestamp || firebase.firestore.FieldValue.serverTimestamp(),
                    date: sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
                    time: sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleTimeString() : new Date().toLocaleTimeString(),
                    paymentStatus: sale.paymentStatus || "Paid"
                };
                
                // Use orderNo as unique identifier if available, otherwise use document ID
                const uniqueId = order.orderNo || doc.id;
                
                if (!seenOrderIds.has(uniqueId)) {
                    seenOrderIds.add(uniqueId);
                    allOrders.push(order);
                }
            });
        } catch (error) {
            console.warn("Error loading paid sales:", error);
            // Fallback: Load all sales and filter client-side
            const salesSnapshot = await db.collection('sales').get();
            
            salesSnapshot.forEach(doc => {
                const sale = doc.data();
                if (sale.paymentStatus === 'Paid') {
                    const order = {
                        id: doc.id,
                        source: 'sale',
                        orderNo: sale.orderNo || `SALE-${doc.id.substring(0, 8)}`,
                        customerName: sale.customerName || "Walk-in Customer",
                        customerPhone: sale.customerPhone || "",
                        items: sale.items || [],
                        subtotal: sale.subtotal || sale.totalAmount,
                        tax: sale.tax || 0,
                        totalAmount: sale.totalAmount || 0,
                        paymentMethod: sale.paymentMethod || "Card",
                        status: "completed",
                        timestamp: sale.timestamp || firebase.firestore.FieldValue.serverTimestamp(),
                        date: sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
                        time: sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleTimeString() : new Date().toLocaleTimeString(),
                        paymentStatus: sale.paymentStatus || "Paid"
                    };
                    
                    const uniqueId = order.orderNo || doc.id;
                    
                    if (!seenOrderIds.has(uniqueId)) {
                        seenOrderIds.add(uniqueId);
                        allOrders.push(order);
                    }
                }
            });
        }
        
        // Sort all orders by timestamp
        allOrders.sort((a, b) => {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return dateB - dateA;
        });
        
        filterOrders();
        updateStats();
    } catch (error) {
        console.error("Error loading orders:", error);
        document.getElementById('ordersTableBody').innerHTML = `
            <tr>
                <td colspan="8" class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading orders. Please try again.</p>
                    <button class="retry-btn" onclick="loadOrders()">Retry</button>
                </td>
            </tr>
        `;
    }
}

function filterOrders() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    
    filteredOrders = allOrders.filter(order => {
        // Filter by status
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        
        // Filter by search term
        const searchMatch = 
            order.orderNo.toLowerCase().includes(searchTerm) ||
            (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
            order.items.some(item => item.name.toLowerCase().includes(searchTerm));
        
        return statusMatch && searchMatch;
    });
    
    currentPage = 1;
    renderOrders();
}

function renderOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    
    if (paginatedOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-orders">
                    <i class="fas fa-box-open"></i>
                    <p>No orders found</p>
                </td>
            </tr>
        `;
    } else {
        paginatedOrders.forEach(order => {
            const tr = document.createElement('tr');
            
            // Format date and time
            let formattedDate = order.date;
            let formattedTime = order.time;
            if (order.timestamp && order.timestamp.toDate) {
                const date = order.timestamp.toDate();
                formattedDate = date.toLocaleDateString();
                formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
            
            // Count total items
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
            
            // Create status badge
            let statusClass = '';
            if (order.status === 'completed') statusClass = 'status-completed';
            else if (order.status === 'pending') statusClass = 'status-pending';
            else if (order.status === 'cancelled') statusClass = 'status-cancelled';
            
            tr.innerHTML = `
                <td>${order.orderNo}</td>
                <td>${order.customerName || 'Walk-in Customer'}</td>
                <td>${totalItems} items</td>
                <td>₹${order.totalAmount.toFixed(2)}</td>
                <td>
                    <div class="date-time">
                        <div class="date">${formattedDate}</div>
                        <div class="time">${formattedTime}</div>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>
                    <div class="payment-method">
                        <i class="fas ${getPaymentIcon(order.paymentMethod)} payment-icon"></i>
                        ${order.paymentMethod}
                    </div>
                </td>
                <td>
                    <button class="action-btn view-btn" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            
            // Add click event to view button
            tr.querySelector('.view-btn').addEventListener('click', () => {
                showOrderDetails(order.id);
            });
            
            tableBody.appendChild(tr);
        });
    }
    
    // Update pagination controls
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');
    
    currentPageSpan.textContent = currentPage;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    const startItem = (currentPage - 1) * ordersPerPage + 1;
    const endItem = Math.min(currentPage * ordersPerPage, filteredOrders.length);
    
    showingCount.textContent = filteredOrders.length > 0 ? `${startItem}-${endItem}` : '0';
    totalCount.textContent = filteredOrders.length;
}

function updateStats() {
    // Total orders
    document.getElementById('totalOrders').textContent = allOrders.length;
    
    // Today's orders
    const today = new Date().toLocaleDateString();
    const todayOrders = allOrders.filter(order => {
        const orderDate = order.timestamp && order.timestamp.toDate 
            ? order.timestamp.toDate().toLocaleDateString() 
            : order.date;
        return orderDate === today;
    });
    document.getElementById('todayOrders').textContent = todayOrders.length;
    
    // Total revenue
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
    
    // Average order value
    const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
    document.getElementById('avgOrderValue').textContent = `₹${avgOrderValue.toFixed(2)}`;
}

function getPaymentIcon(paymentMethod) {
    switch(paymentMethod.toLowerCase()) {
        case 'upi': return 'fa-mobile-alt';
        case 'cash': return 'fa-money-bill-wave';
        case 'card': return 'fa-credit-card';
        default: return 'fa-wallet';
    }
}

async function showOrderDetails(orderId) {
    currentOrderId = orderId;
    const modal = document.getElementById('orderDetailsModal');
    const order = allOrders.find(o => o.id === orderId);
    
    if (order) {
        // Set order information
        document.getElementById('modalOrderTitle').textContent = `Order #${order.orderNo}`;
        document.getElementById('modalOrderId').textContent = order.orderNo;
        
        // Format date and time
        let formattedDate = order.date;
        let formattedTime = order.time;
        if (order.timestamp && order.timestamp.toDate) {
            const date = order.timestamp.toDate();
            formattedDate = date.toLocaleDateString();
            formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        document.getElementById('modalOrderDate').textContent = `${formattedDate} at ${formattedTime}`;
        
        // Set status
        document.getElementById('modalOrderStatus').textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
        document.getElementById('updateStatus').value = order.status;
        
        // Set payment method
        document.getElementById('modalOrderPayment').textContent = order.paymentMethod;
        
        // Set items
        const itemsTable = document.getElementById('modalOrderItems');
        itemsTable.innerHTML = '';
        
        order.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${(item.price * item.quantity).toFixed(2)}</td>
            `;
            itemsTable.appendChild(tr);
        });
        
        // Set totals
        const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = order.tax || subtotal * 0.05;
        const total = order.totalAmount;
        
        document.getElementById('modalSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('modalTax').textContent = `₹${tax.toFixed(2)}`;
        document.getElementById('modalTotal').textContent = `₹${total.toFixed(2)}`;
        
        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    document.getElementById('orderDetailsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function updateOrderStatus() {
    if (!currentOrderId) return;
    
    const newStatus = document.getElementById('updateStatus').value;
    const order = allOrders.find(o => o.id === currentOrderId);
    
    try {
        if (order.source === 'order') {
            await db.collection('orders').doc(currentOrderId).update({
                status: newStatus
            });
        } else if (order.source === 'sale') {
            // For sales, we can't change the status as they're always "completed"
            alert('Paid sales cannot be modified.');
            return;
        }
        
        // Update local data
        const orderIndex = allOrders.findIndex(o => o.id === currentOrderId);
        if (orderIndex !== -1) {
            allOrders[orderIndex].status = newStatus;
        }
        
        // Update UI
        filterOrders();
        closeModal();
        
        alert('Order status updated successfully!');
    } catch (error) {
        console.error("Error updating order status:", error);
        alert('Error updating order status. Please try again.');
    }
}

function exportOrders() {
    // Convert orders to CSV
    let csv = 'Order No,Customer,Items,Amount,Date,Status,Payment Method\n';
    
    filteredOrders.forEach(order => {
        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
        let formattedDate = order.date;
        if (order.timestamp && order.timestamp.toDate) {
            formattedDate = order.timestamp.toDate().toLocaleDateString();
        }
        
        csv += `"${order.orderNo}","${order.customerName || 'Walk-in Customer'}","${totalItems} items","₹${order.totalAmount.toFixed(2)}","${formattedDate}","${order.status}","${order.paymentMethod}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printOrder() {
    const printContent = `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="text-align: center; color: #FF7F50; margin-bottom: 10px;">Plateful Paradise</h2>
            <p style="text-align: center; margin-bottom: 20px;">Order Receipt</p>
            
            <div style="margin-bottom: 15px;">
                <p><strong>Order No:</strong> ${document.getElementById('modalOrderId').textContent}</p>
                <p><strong>Date:</strong> ${document.getElementById('modalOrderDate').textContent}</p>
                <p><strong>Status:</strong> ${document.getElementById('modalOrderStatus').textContent}</p>
                <p><strong>Payment:</strong> ${document.getElementById('modalOrderPayment').textContent}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <th style="text-align: left; padding: 8px 0;">Item</th>
                        <th style="text-align: right; padding: 8px 0;">Qty</th>
                        <th style="text-align: right; padding: 8px 0;">Price</th>
                        <th style="text-align: right; padding: 8px 0;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(document.getElementById('modalOrderItems').rows)
                        .map(row => `
                            <tr>
                                <td style="padding: 8px 0;">${row.cells[0].textContent}</td>
                                <td style="text-align: right; padding: 8px 0;">${row.cells[1].textContent}</td>
                                <td style="text-align: right; padding: 8px 0;">${row.cells[2].textContent}</td>
                                <td style="text-align: right; padding: 8px 0;">${row.cells[3].textContent}</td>
                            </tr>
                        `).join('')}
                </tbody>
            </table>
            
            <div style="border-top: 1px dashed #ddd; padding-top: 10px; margin-bottom: 5px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Subtotal:</span>
                    <span>${document.getElementById('modalSubtotal').textContent}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Tax (5%):</span>
                    <span>${document.getElementById('modalTax').textContent}</span>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px;">
                <span>Total Amount:</span>
                <span>${document.getElementById('modalTotal').textContent}</span>
            </div>
            
            <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777;">
                Thank you for your order!
            </p>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}