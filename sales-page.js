// Initialize variables
let salesData = [];
let todayTotal = 0;
let monthTotal = 0;
let allTimeTotal = 0;

// Redirect to sales recording page
function goToSales() {
    window.location.href = "breakfast.html";
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount).replace('₹', '₹');
}

// Format date
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Load sales data
async function loadSales() {
    if (!window.db) {
        console.error("Firestore not initialized");
        return;
    }

    try {
        const salesRef = window.db.collection('sales');
        const snapshot = await salesRef.orderBy('timestamp', 'desc').limit(50).get();

        salesData = [];
        todayTotal = 0;
        monthTotal = 0;
        allTimeTotal = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        snapshot.forEach(doc => {
            const sale = doc.data();
            sale.id = doc.id;
            
            // Convert Firestore timestamp to Date if needed
            const saleDate = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
            
            // Calculate totals
            allTimeTotal += sale.totalAmount || 0;
            
            // Check if sale is from this month
            if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                monthTotal += sale.totalAmount || 0;
                
                // Check if sale is from today
                if (saleDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
                    todayTotal += sale.totalAmount || 0;
                }
            }
            
            salesData.push(sale);
        });

        // Update UI
        updateSummaryCards();
        renderSalesTable();
        
    } catch (error) {
        console.error("Error loading sales:", error);
        alert('Failed to load sales data. Please check your connection.');
    }
}

// Update summary cards
function updateSummaryCards() {
    document.getElementById('today-sales').textContent = formatCurrency(todayTotal);
    document.getElementById('month-sales').textContent = formatCurrency(monthTotal);
    document.getElementById('total-sales').textContent = formatCurrency(allTimeTotal);
}

// Render sales table
function renderSalesTable() {
    const tableBody = document.getElementById('sales-table-body');
    tableBody.innerHTML = '';

    salesData.forEach(sale => {
        const row = document.createElement('tr');
        
        // Format items list
        const itemsList = sale.items?.map(item => 
            `${item.name} × ${item.quantity}`
        ).join('<br>') || 'No items';
        
        // Format date
        const saleDate = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
        const formattedDate = formatDate(saleDate);
        
        // Determine payment status
        const isPaid = sale.paymentStatus === 'Paid';
        const statusClass = isPaid ? 'paid' : 'pending';
        const statusText = isPaid ? 'Paid' : 'Pending';
        
        row.innerHTML = `
            <td>${sale.orderNo || 'N/A'}</td>
            <td>${itemsList}</td>
            <td>${formatCurrency(sale.totalAmount || 0)}</td>
            <td>${formattedDate}</td>
            <td>${sale.paymentMethod || 'N/A'}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                ${!isPaid ? 
                    `<button class="btn btn-success" onclick="payNow('${sale.id}', ${sale.totalAmount})">
                        <i class="fas fa-credit-card"></i> Pay
                    </button>` : ''
                }
                <button class="btn btn-danger" onclick="deleteSale('${sale.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Delete sale
async function deleteSale(saleId) {
    if (!confirm('Are you sure you want to delete this sale?')) return;
    
    try {
        await window.db.collection('sales').doc(saleId).delete();
        alert('Sale deleted successfully!');
        loadSales(); // Refresh data
    } catch (error) {
        console.error("Error deleting sale:", error);
        alert('Failed to delete sale. Please try again.');
    }
}

// Process payment
async function payNow(saleId, amount) {
    try {
        const saleRef = window.db.collection('sales').doc(saleId);
        const saleDoc = await saleRef.get();
        
        if (!saleDoc.exists) {
            alert('Sale not found.');
            return;
        }
        
        const saleData = saleDoc.data();
        
        if (saleData.paymentStatus === 'Paid') {
            alert('This sale has already been paid.');
            return;
        }
        
        const options = {
            key: "rzp_test_TfvSBMDZ96l5FS",
            amount: amount * 100,
            currency: "INR",
            name: "Plateful Paradise",
            description: `Payment for Order #${saleData.orderNo}`,
            handler: async function(response) {
                try {
                    // Create order data for orders collection
                    const orderData = {
                        orderNo: saleData.orderNo,
                        customerName: saleData.customerName || "Walk-in Customer",
                        customerPhone: saleData.customerPhone || "",
                        items: saleData.items || [],
                        subtotal: saleData.subtotal || amount,
                        tax: saleData.tax || 0,
                        totalAmount: amount,
                        paymentMethod: saleData.paymentMethod || "Card",
                        status: "completed",
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        date: new Date().toLocaleDateString(),
                        time: new Date().toLocaleTimeString(),
                        razorpayPaymentId: response.razorpay_payment_id
                    };

                    // Update payment status in sales collection
                    await saleRef.update({ 
                        paymentStatus: 'Paid',
                        paymentDate: new Date(),
                        razorpayPaymentId: response.razorpay_payment_id
                    });
                    
                    // Add to orders collection
                    await window.db.collection('orders').add(orderData);
                    
                    alert('Payment successful! Order has been created.');
                    loadSales(); // Refresh data
                } catch (error) {
                    console.error("Error updating payment:", error);
                    alert('Payment processed but failed to update records.');
                }
            },
            prefill: {
                name: saleData.customerName || "Customer",
                email: saleData.customerEmail || "customer@example.com",
                contact: saleData.customerPhone || "9876543210"
            },
            theme: {
                color: "#4361ee"
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
    } catch (error) {
        console.error("Error processing payment:", error);
        alert('Failed to process payment. Please try again.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadSales();
    
    // Refresh data every 30 seconds
    setInterval(loadSales, 30000);
});