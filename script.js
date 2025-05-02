// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let cart = [];
let orderCounter = 0;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeOrderCounter();
    setupEventListeners();
    
    // Load cart from localStorage if available
    const savedCart = localStorage.getItem('breakfastCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
});

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const menuCards = document.querySelectorAll('.menu-card');
        
        menuCards.forEach(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            if (name.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

async function initializeOrderCounter() {
    try {
        const snapshot = await db.collection('orderCounter').doc('counter').get();
        if (snapshot.exists) {
            orderCounter = snapshot.data().value;
        } else {
            await db.collection('orderCounter').doc('counter').set({ value: 0 });
        }
    } catch (error) {
        console.error("Error initializing order counter:", error);
        showToast("Error connecting to database", "error");
    }
}

function adjustQuantity(button, change) {
    const quantityInput = button.parentElement.querySelector('.quantity');
    let newValue = parseInt(quantityInput.value) + change;
    
    if (newValue < 1) newValue = 1;
    quantityInput.value = newValue;
}

function addToCart(button) {
    const menuCard = button.closest('.menu-card');
    const name = menuCard.getAttribute('data-name');
    const price = parseFloat(menuCard.getAttribute('data-price'));
    const quantity = parseInt(menuCard.querySelector('.quantity').value);
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.name === name);
    
    if (existingItemIndex >= 0) {
        // Update quantity if item exists
        cart[existingItemIndex].quantity += quantity;
        cart[existingItemIndex].totalPrice = cart[existingItemIndex].price * cart[existingItemIndex].quantity;
    } else {
        // Add new item to cart
        const item = {
            name: name,
            price: price,
            quantity: quantity,
            totalPrice: price * quantity
        };
        cart.push(item);
    }
    
    updateCart();
    showToast(`${name} added to cart`, "success");
    
    // Save cart to localStorage
    localStorage.setItem('breakfastCart', JSON.stringify(cart));
}

function updateCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    const subtotalPriceSpan = document.getElementById('subtotal-price');
    const taxAmountSpan = document.getElementById('tax-amount');
    const totalPriceSpan = document.getElementById('total-price');
    
    cartItemsDiv.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-coffee"></i>
                <p>Your cart is empty</p>
                <p>Add some delicious breakfast items!</p>
            </div>
        `;
    } else {
        cart.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cart-item');
            itemDiv.innerHTML = `
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-quantity">x${item.quantity}</span>
                <span class="cart-item-price">₹${item.totalPrice.toFixed(2)}</span>
                <span class="cart-item-remove" onclick="removeFromCart(${index})"><i class="fas fa-times"></i></span>
            `;
            cartItemsDiv.appendChild(itemDiv);
        });
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;
    
    subtotalPriceSpan.textContent = subtotal.toFixed(2);
    taxAmountSpan.textContent = tax.toFixed(2);
    totalPriceSpan.textContent = total.toFixed(2);
}

function removeFromCart(index) {
    const removedItem = cart[index].name;
    cart.splice(index, 1);
    updateCart();
    showToast(`${removedItem} removed from cart`, "warning");
    
    // Update localStorage
    localStorage.setItem('breakfastCart', JSON.stringify(cart));
}

function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        updateCart();
        showToast('Cart cleared', "warning");
        localStorage.removeItem('breakfastCart');
    }
}

function filterItems(category) {
    const menuCards = document.querySelectorAll('.menu-card');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Update active tab
    tabButtons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(category) || (category === 'all' && btn.textContent === 'All Items')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Filter items
    menuCards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            const itemCategory = card.getAttribute('data-category');
            if (itemCategory.includes(category)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

async function recordSale() {
    if (cart.length === 0) {
        showToast('Cart is empty!', "error");
        return;
    }

    try {
        // Get the current counter value and increment it
        const counterRef = db.collection('orderCounter').doc('counter');
        
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            const newCounter = (doc.exists ? doc.data().value : 0) + 1;
            transaction.update(counterRef, { value: newCounter });
            orderCounter = newCounter;
        });

        const paymentMethod = document.getElementById('payment').value;
        const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = subtotal * 0.05;
        const totalAmount = subtotal + tax;
        const now = new Date();

        // Record the sale
        await db.collection('sales').add({
            orderNo: `#${String(orderCounter).padStart(3, '0')}`,
            items: cart,
            paymentMethod: paymentMethod,
            subtotal: subtotal,
            tax: tax,
            totalAmount: totalAmount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            date: now.toLocaleDateString('en-IN'),
            time: now.toLocaleTimeString('en-IN'),
            status: 'completed'
        });

        // Clear the cart
        cart = [];
        updateCart();
        localStorage.removeItem('breakfastCart');
        
        showToast('Order placed successfully!', "success");
        
        // Reset quantities in menu items
        document.querySelectorAll('.quantity').forEach(input => {
            input.value = 1;
        });
        
    } catch (error) {
        console.error("Error recording sale:", error);
        showToast('Error placing order. Please try again.', "error");
    }
}

function viewSales() {
    window.location.href = "sales.html";
}

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "toast show";
    
    // Set background color based on type
    switch(type) {
        case "success":
            toast.style.backgroundColor = "#4CAF50";
            break;
        case "error":
            toast.style.backgroundColor = "#F44336";
            break;
        case "warning":
            toast.style.backgroundColor = "#FFC107";
            break;
        default:
            toast.style.backgroundColor = "#4CAF50";
    }
    
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}