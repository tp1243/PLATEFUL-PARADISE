document.addEventListener("DOMContentLoaded", () => {
  // Toggle sidebar on mobile
  const toggleMenu = document.getElementById("toggle-menu");
  const closeMenu = document.getElementById("close-menu");
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");

  toggleMenu.addEventListener("click", () => {
    sidebar.classList.add("active");
    mainContent.style.opacity = "0.7";
  });

  closeMenu.addEventListener("click", () => {
    sidebar.classList.remove("active");
    mainContent.style.opacity = "1";
  });

  // Handle search functionality
  const searchBar = document.getElementById("search-bar");
  const dropdownList = document.getElementById("dropdown-list");

  const suggestions = [
    "Truffle Pasta",
    "Avocado Toast",
    "Grilled Salmon",
    "Buddha Bowl",
    "Artisan Pizza",
    "Gourmet Burger",
    "Sushi Platter",
    "Caesar Salad",
    "Chocolate Mousse",
    "Tiramisu",
    "Margherita Pizza",
    "Beef Wellington",
    "Lobster Bisque",
    "Chicken Tikka Masala",
    "Vegetable Stir Fry"
  ];

  searchBar.addEventListener("input", function(event) {
    const query = event.target.value.toLowerCase();
    dropdownList.innerHTML = "";

    if (query.length > 0) {
      const filteredSuggestions = suggestions.filter(item => 
        item.toLowerCase().includes(query)
      );

      if (filteredSuggestions.length > 0) {
        filteredSuggestions.forEach(suggestion => {
          const listItem = document.createElement("li");
          listItem.textContent = suggestion;
          listItem.addEventListener("click", function() {
            searchBar.value = suggestion;
            dropdownList.style.display = "none";
            // Here you would typically redirect to search results or show them
            console.log(`Searching for: ${suggestion}`);
          });
          dropdownList.appendChild(listItem);
        });

        dropdownList.style.display = "block";
      } else {
        dropdownList.style.display = "none";
      }
    } else {
      dropdownList.style.display = "none";
    }
  });

  document.addEventListener("click", function(event) {
    if (!searchBar.contains(event.target) && !dropdownList.contains(event.target)) {
      dropdownList.style.display = "none";
    }
  });

  // Handle promo carousel navigation
  const prevPromoBtn = document.getElementById("prev-promo");
  const nextPromoBtn = document.getElementById("next-promo");
  const promoContainer = document.querySelector(".promo-container");

  let currentPromoIndex = 0;
  const promoItems = document.querySelectorAll(".promo-card");
  const promoItemCount = promoItems.length;

  function updatePromoCarousel() {
    const offset = -currentPromoIndex * 100;
    promoContainer.style.transform = `translateX(${offset}%)`;
  }

  nextPromoBtn.addEventListener("click", () => {
    if (currentPromoIndex < promoItemCount - 1) {
      currentPromoIndex++;
      updatePromoCarousel();
    }
  });

  prevPromoBtn.addEventListener("click", () => {
    if (currentPromoIndex > 0) {
      currentPromoIndex--;
      updatePromoCarousel();
    }
  });

  // Handle trending tabs
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      // Here you would typically filter the trending items
      console.log(`Showing ${button.textContent} items`);
    });
  });

  // Handle add to cart buttons
  const addToCartButtons = document.querySelectorAll(".add-to-cart");

  addToCartButtons.forEach(button => {
    button.addEventListener("click", () => {
      const item = button.closest(".trending-item");
      const itemName = item.querySelector("h3").textContent;
      const itemPrice = item.querySelector(".price").textContent;
      
      // Here you would typically add the item to the cart
      console.log(`Added ${itemName} (${itemPrice}) to cart`);
      
      // Update cart count
      const cartCount = document.querySelector(".cart-count");
      let currentCount = parseInt(cartCount.textContent);
      cartCount.textContent = currentCount + 1;
      
      // Show a quick confirmation
      button.innerHTML = '<i class="bx bx-check"></i>';
      setTimeout(() => {
        button.innerHTML = '<i class="bx bx-plus"></i>';
      }, 1000);
    });
  });

  // Get user name from URL if available
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get("name");

  if (name) {
    const userNameElement = document.getElementById("user-name");
    if (userNameElement) {
      userNameElement.textContent = name;
    }
  }

  // Initialize charts (example for future implementation)
  // This would be used if you add charts to the dashboard
  function initCharts() {
    // Example sales chart
    const salesCtx = document.createElement('canvas');
    salesCtx.id = 'salesChart';
    document.querySelector('.stats-cards').after(salesCtx);
    
    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Monthly Sales',
          data: [1200, 1900, 1700, 2100, 2300, 2500],
          borderColor: '#F67280',
          tension: 0.1,
          fill: true,
          backgroundColor: 'rgba(246, 114, 128, 0.1)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          }
        }
      }
    });
  }

  // Uncomment to enable charts
  // initCharts();
});