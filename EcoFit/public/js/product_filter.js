// --- Globals (chung)
let allProducts = [];
let categories = [];
let filteredProducts = [];

// Dữ liệu dạng object (để tương thích loadData dùng productsData)
let productsData = null;
let promotionsData = null;
let currentProduct = null;

// ----------------- loadProducts (list page) -----------------
async function loadProducts() {
    try {
        const response = await fetch('../../dataset/products.json');
        const data = await response.json();
        allProducts = data.product || [];
        categories = data.category || [];
        filteredProducts = [...allProducts];
        currentPage = 1;
        
        // ✅ CHECK IF CATEGORY WAS SELECTED FROM PAGE 02
        const selectedCategory = sessionStorage.getItem('selectedCategory');
        if (selectedCategory) {
            // Auto-check the corresponding category checkbox
            const checkboxes = document.querySelectorAll('.filter-group:nth-child(2) input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const label = checkbox.parentElement.textContent.trim();
                if (label === selectedCategory) {
                    checkbox.checked = true;
                }
            });
            
            // Clear the stored category
            sessionStorage.removeItem('selectedCategory');
            
            // Apply filter immediately
            filterProducts();
        } else {
            displayProductsForPage();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// ----------------- loadData (detail page) -----------------
async function loadData() {
    try {
        const DEV_MODE = true;
        // Try localStorage if not in DEV mode
        if (!DEV_MODE) {
            const storedProducts = localStorage.getItem("products");
            const storedPromotions = localStorage.getItem("promotions");
            if (storedProducts && storedPromotions) {
                productsData = JSON.parse(storedProducts);
                promotionsData = JSON.parse(storedPromotions);
                console.log("✓ Loaded data from localStorage");
            }
        }

        if (!productsData || !promotionsData || DEV_MODE) {
            const timestamp = new Date().getTime();
            // IMPORTANT: use backticks so ${timestamp} expands
            const [productsResponse, promotionsResponse] = await Promise.all([
                fetch(`../../dataset/products.json?t=${timestamp}`),
                fetch(`../../dataset/promotions.json?t=${timestamp}`)
            ]);

            productsData = await productsResponse.json();
            promotionsData = await promotionsResponse.json();

            localStorage.setItem("products", JSON.stringify(productsData));
            localStorage.setItem("promotions", JSON.stringify(promotionsData));

            console.log("🔄 Loaded fresh JSON data from files");
        }

        const productId = getProductIdFromURL();
        currentProduct = productsData?.product?.find(p => p.product_id === productId) || null;

        if (currentProduct) {
            displayProductDetails();
            displayRelatedProducts();
        } else {
            console.error('Product not found');
            showErrorMessage('Product not found. Redirecting to shop...');
            setTimeout(() => {
                window.location.href = '03_PRODUCT_SearchFilter.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showErrorMessage('Failed to load product data. Please try again later.');
    }
}

// ----------------- helper: get id from URL -----------------
function getProductIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || null;
}

// ----------------- helper: simple error UI -----------------
function showErrorMessage(msg) {
    // minimal, non-intrusive
    const el = document.createElement('div');
    el.className = 'page-error';
    el.textContent = msg;
    el.style = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#f44336; color:#fff; padding:10px 16px; z-index:9999; border-radius:6px;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// Calculate average rating from reviews
function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
}

// Calculate discount percentage
function calculateDiscount(originalPrice, promotionCode) {
    const discounts = {
        'ECO10': 10,
        'GREEN20': 20,
        'SAVE15': 15,
        'ACC5': 5,
        'STYLE25':25,
        'CLEAR40':40,
    };
    return discounts[promotionCode] || 0;
}

// Format price in VND
function formatPrice(price) {
    return price.toLocaleString('vi-VN') + 'đ';
}

// Get category name by ID
function getCategoryName(categoryId) {
    const category = categories.find(cat => cat.category_id === categoryId);
    return category ? category.category_name : '';
}

// Display products
function displayProducts(products) {
    const productGrid = document.querySelector('.product-grid');
    const resultCount = document.querySelector('.products__header p');
    
    if (!productGrid) return;

    // Update result count
    if (resultCount) {
        const start = products.length > 0 ? 1 : 0;
        const end = Math.min(12, products.length);
        resultCount.textContent = products.length > 0 ? `Showing ${start}-${end} of ${products.length} results` : `Showing 0 results`;
    }

    // Clear existing products
    productGrid.innerHTML = '';

    if (!products || products.length === 0) {
        productGrid.innerHTML = `
          <div class="no-results" style="width:100%; 
                                        text-align:center; 
                                        padding:60px 20px;
                                        margin-bottom:30px">
            <h3>No products found</h3>
            <p>Try adjusting the filters or searching for something else..</p>
          </div>
        `;
        productGrid.style.minHeight = '240px';
        return;
    } else {
        productGrid.style.minHeight = '';
    }

    // Display products (first 12)
    const displayedProducts = products.slice(0, 12);
    
    displayedProducts.forEach(product => {
        const discountPercent = calculateDiscount(product.price_original, product.promotion_code);
        const discountedPrice = product.price_original * (1 - discountPercent / 100);
        const avgRating = calculateAverageRating(product.reviews);
        const categoryName = getCategoryName(product.category_id);

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.productId = product.product_id;
        
        productCard.innerHTML = `
            <div class="discount">${discountPercent}% off</div>
            <div class="img-placeholder">
                <img src="${product.product_images[0]}" alt="${product.product_name}"/>
            </div>
            <div class="product-info">
                <div class="price-rating">
                    <p class="price">
                        ${formatPrice(discountedPrice)} <span>${formatPrice(product.price_original)}</span>
                    </p>
                    <div class="rating-line">
                        <img src="../images/star_filled.png" alt="rating star" />
                        <span>${avgRating}</span>
                    </div>
                </div>
                <p class="name">${product.product_name}</p>
                <p class="type">${categoryName}</p>
                <p class="greenscore">
                    <img src="${product.green_score.image}" style="width:fit-content;"/>
                    <span class="bought">${product.number_bought}</span>
                </p>
                <div class="btn-group">
                    <button class="btn-outline" data-action="add-cart">Add to cart</button>
                    <button class="btn-fill" data-action="buy-now">Buy now</button>
                </div>
            </div>
        `;

        productGrid.appendChild(productCard);
    });

    // Add click events to product cards
    addProductClickEvents();
    // Add button click events
    addButtonClickEvents();
}

// Add click events to product cards
function addProductClickEvents() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on buttons
            if (e.target.closest('.btn-group')) return;
            
            const productId = card.dataset.productId;
            // Store product ID in sessionStorage for detail page
            window.location.href = `04_PRODUCT_Detail.html?id=${productId}`;    
        });
    });
}

// Add button click events with Add-to-Cart logic
function addButtonClickEvents() {
    const addToCartBtns = document.querySelectorAll('[data-action="add-cart"]');
    const buyNowBtns = document.querySelectorAll('[data-action="buy-now"]');

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.product-card');
            const productId = card.dataset.productId;

            // Run animation
            btn.classList.add('btn-clicked');
            const originalText = btn.textContent;
            btn.textContent = 'Added!';

            // Add product to cart
            addToCart(productId, e);

            setTimeout(() => {
                btn.classList.remove('btn-clicked');
                btn.textContent = originalText;
            }, 1000);
        });
    });

    buyNowBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.product-card');
            const productId = card.dataset.productId;

            // Run animation
            btn.classList.add('btn-clicked');

            setTimeout(() => {
                btn.classList.remove('btn-clicked');
                // Perform buy now (add then redirect)
                buyNow(productId, e);
            }, 300);
        });
    });
}
// Calculate discounted price (for cart)
function calculateDiscountedPrice(originalPrice, promotionCode) {
    const discounts = {
        'ECO10': 10,
        'GREEN20': 20,
        'SAVE15': 15,
        'ACC5': 5,
        'STYLE25':25,
        'CLEAR40':40,
    };
    const discountPercent = discounts[promotionCode] || 0;
    return originalPrice * (1 - discountPercent / 100);
}

// Add to cart function
function addToCart(productId, event) {
    if (event) event.stopPropagation();

    const product = allProducts.find(p => p.product_id === productId);
    if (!product) {
        alert('Product not found!');
        return;
    }

    if (product.quantity_available <= 0) {
        alert('Sorry, this product is out of stock!');
        return;
    }

    const quantity = 1;
    const size = 'M';
    const color = 'Default';

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(item =>
        item.product_id === product.product_id &&
        item.size === size &&
        item.color === color
    );

    const discountedPrice = calculateDiscountedPrice(product.price_original, product.promotion_code);

    if (existingIndex !== -1) {
        const newQuantity = cart[existingIndex].quantity + quantity;
        if (newQuantity > product.quantity_available) {
            alert(`Cannot add more. Maximum available quantity is ${product.quantity_available}`);
            return;
        }
        cart[existingIndex].quantity = newQuantity;
    } else {
        const productImage = product.product_images?.[0] || '../../dataset/product_images/placeholder.png';

        cart.push({
            product_id: product.product_id,
            product_name: product.product_name,
            price: discountedPrice,
            original_price: product.price_original,
            quantity: quantity,
            size: size,
            color: color,
            image: productImage,
            green_score: product.green_score.value
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    showAddToCartMessage(`✓ ${product.product_name} added to cart!`);
    updateCartCount();
}

// Show add to cart message
function showAddToCartMessage(message) {
    const existingMsg = document.querySelector('.cart-message');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = 'cart-message';
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
                margin-top:65px;
    `;
    document.body.appendChild(msgDiv);

    setTimeout(() => {
        msgDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const headerFrame = document.getElementById('header-frame');
    if (headerFrame && headerFrame.contentWindow) {
        headerFrame.contentWindow.postMessage({
            action: 'updateCartCount',
            count: totalItems
        }, '*');
    }
}

// Buy now function
function buyNow(productId, event) {
    if (event) event.stopPropagation();
    addToCart(productId, event);

    setTimeout(() => {
        window.location.href = './05_SHOPPING_CART.html';
    }, 500);
}


// Filter products based on selected criteria
function filterProducts() {
    let filtered = [...allProducts];

    // Filter by categories
    const selectedCategories = Array.from(
        document.querySelectorAll('.filter-group:nth-child(2) input[type="checkbox"]:checked')
    ).map(cb => cb.parentElement.textContent.trim());

    if (selectedCategories.length > 0) {
        filtered = filtered.filter(product => {
            const categoryName = getCategoryName(product.category_id);
            return selectedCategories.includes(categoryName);
        });
    }

    // Filter by green score
    const selectedGreenScores = Array.from(
        document.querySelectorAll('.filter-group:nth-child(3) input[type="checkbox"]:checked')
    ).map(cb => {
        const label = cb.parentElement.textContent.trim();
        const match = label.match(/(\d+)\s*-\s*(\d+)/);
        return match ? { min: parseInt(match[1]), max: parseInt(match[2]) } : null;
    }).filter(Boolean);

    if (selectedGreenScores.length > 0) {
        filtered = filtered.filter(product => {
            return selectedGreenScores.some(range => 
                product.green_score.value >= range.min && 
                product.green_score.value <= range.max
            );
        });
    }

    // Filter by price range
    const minPrice = document.querySelector('.min_max input[placeholder="Min"]').value;
    const maxPrice = document.querySelector('.min_max input[placeholder="Max"]').value;

    if (minPrice) {
        filtered = filtered.filter(product => {
            const discountPercent = calculateDiscount(product.price_original, product.promotion_code);
            const price = product.price_original * (1 - discountPercent / 100);
            return price >= parseInt(minPrice) * 1000;
        });
    }

    if (maxPrice) {
        filtered = filtered.filter(product => {
            const discountPercent = calculateDiscount(product.price_original, product.promotion_code);
            const price = product.price_original * (1 - discountPercent / 100);
            return price <= parseInt(maxPrice) * 1000;
        });
    }

    // Filter by review rating
    const selectedRatings = Array.from(
        document.querySelectorAll('.filter-group:nth-child(5) input[type="checkbox"]:checked')
    ).map(cb => {
        const img = cb.parentElement.querySelector('img');
        if (img.src.includes('fivestars')) return 5;
        if (img.src.includes('fourstars')) return 4;
        if (img.src.includes('threestars')) return 3;
        if (img.src.includes('twostars')) return 2;
        if (img.src.includes('onestar')) return 1;
        return 0;
    });

    if (selectedRatings.length > 0) {
        filtered = filtered.filter(product => {
            const avgRating = parseFloat(calculateAverageRating(product.reviews));
            return selectedRatings.some(rating => {
                if (rating === 5) return avgRating >= 4.5;
                if (rating === 4) return avgRating >= 3.5 && avgRating < 4.5;
                if (rating === 3) return avgRating >= 2.5 && avgRating < 3.5;
                if (rating === 2) return avgRating >= 1.5 && avgRating < 2.5;
                if (rating === 1) return avgRating < 1.5;
                return false;
            });
        });
    }

    // Filter by availability
    const availabilityCheckboxes = document.querySelectorAll('.filter-group:nth-child(7) input[type="checkbox"]');
    const inStockChecked = availabilityCheckboxes[0]?.checked;
    const outOfStockChecked = availabilityCheckboxes[1]?.checked;

    if (inStockChecked && !outOfStockChecked) {
        filtered = filtered.filter(product => product.quantity_available > 0);
    } else if (!inStockChecked && outOfStockChecked) {
        filtered = filtered.filter(product => product.quantity_available === 0);
    }

    filteredProducts = filtered;
    currentPage = 1;
    displayProductsForPage();
}

// Search products
function searchProducts(searchTerm) {
    if (!searchTerm.trim()) {
        filteredProducts = [...allProducts];
    } else {
        const term = searchTerm.toLowerCase();
        filteredProducts = allProducts.filter(product => 
            product.product_name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term) ||
            getCategoryName(product.category_id).toLowerCase().includes(term)
        );
    }
    currentPage = 1;
    displayProductsForPage();
}

// Sort products
function sortProducts(sortOption) {
    let sorted = [...filteredProducts];

    switch(sortOption) {
        case 'Popularity':
            sorted.sort((a, b) => {
                const aNum = parseInt(a.number_bought);
                const bNum = parseInt(b.number_bought);
                return bNum - aNum;
            });
            break;
        case 'Lastest':
            // Assuming products are already in order, reverse for latest
            sorted.reverse();
            break;
        case 'Price: high to low':
            sorted.sort((a, b) => {
                const aDiscount = calculateDiscount(a.price_original, a.promotion_code);
                const bDiscount = calculateDiscount(b.price_original, b.promotion_code);
                const aPrice = a.price_original * (1 - aDiscount / 100);
                const bPrice = b.price_original * (1 - bDiscount / 100);
                return bPrice - aPrice;
            });
            break;
        case 'Price: low to high':
            sorted.sort((a, b) => {
                const aDiscount = calculateDiscount(a.price_original, a.promotion_code);
                const bDiscount = calculateDiscount(b.price_original, b.promotion_code);
                const aPrice = a.price_original * (1 - aDiscount / 100);
                const bPrice = b.price_original * (1 - bDiscount / 100);
                return aPrice - bPrice;
            });
            break;
        default:
            // Default sorting
            break;
    }
filteredProducts = sorted;
currentPage = 1;
displayProductsForPage();
}
// PROMOTION BANNER (English version)
document.addEventListener("DOMContentLoaded", () => {
  const voucherBtn = document.getElementById("getVoucherBtn");

  if (voucherBtn) {
    voucherBtn.addEventListener("click", () => {
      const voucherCode = "STYLE25"; // use promo_code here
      const storedVouchers = JSON.parse(localStorage.getItem("userVouchers")) || [];

      // Check if already claimed
      if (storedVouchers.includes(voucherCode)) {
        showBannerMessage("⚠️ You’ve already claimed this voucher!");
        return;
      }

      // Save to localStorage
      storedVouchers.push(voucherCode);
      localStorage.setItem("userVouchers", JSON.stringify(storedVouchers));

      // UI animation + message
      showBannerMessage(`🎉 Successfully claimed voucher ${voucherCode}! Enjoy 25% off selected dresses.`);
      voucherBtn.classList.add("voucher-claimed");
      voucherBtn.textContent = "Claimed!";
      voucherBtn.disabled = true;
    });
  }
});

// Popup message UI
function showBannerMessage(text) {
  const existingMsg = document.querySelector(".banner-message");
  if (existingMsg) existingMsg.remove();

  const msg = document.createElement("div");
  msg.className = "banner-message";
  msg.textContent = text;
  msg.style.cssText = `
      position: fixed;
      top: 30px;
      right: 30px;
      background: #4caf50;
      color: #fff;
      padding: 14px 22px;
      border-radius: 8px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
  `;
  document.body.appendChild(msg);
  setTimeout(() => {
    msg.style.opacity = "1";
    msg.style.transform = "translateY(0)";
  }, 10);

  setTimeout(() => {
    msg.style.opacity = "0";
    msg.style.transform = "translateY(-10px)";
    setTimeout(() => msg.remove(), 300);
  }, 3000);
}

// Style when claimed
const bannerStyle = document.createElement("style");
bannerStyle.textContent = `
  #getVoucherBtn.voucher-claimed {
    background: #aaa !important;
    cursor: not-allowed;
  }

  #getVoucherBtn.voucher-claimed:hover {
    filter: none;
  }
`;
document.head.appendChild(bannerStyle);
// Initialize event listeners
function initializeEventListeners() {
    // Filter button
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filterProducts();
        });
    }

    // Search form
    const searchForm = document.querySelector('.searchBar');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchInput = searchForm.querySelector('input[type="search"]');
            searchProducts(searchInput.value);
        });
    }

    // Sort dropdown
    const sortSelect = document.querySelector('.products__header select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortProducts(e.target.value);
        });
    }

    // Real-time filter on checkbox change
    const filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            filterProducts();
        });
    });

    // Real-time filter on price input
    const priceInputs = document.querySelectorAll('.min_max input');
    priceInputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(input.timeout);
            input.timeout = setTimeout(() => {
                filterProducts();
            }, 500);
        });
    });
}

// Add CSS for button animations
const style = document.createElement('style');
style.textContent = `
    .btn-clicked {
        animation: btnPulse 0.3s ease-in-out;
        transform: scale(0.95);
    }

    @keyframes btnPulse {
        0% { transform: scale(1); }
        50% { transform: scale(0.95); }
        100% { transform: scale(1); }
    }

    .product-card {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .product-card .btn-group button {
        transition: all 0.2s ease;
    }

    .product-card .btn-group button:hover {
        transform: translateY(-1px);
    }

    .product-card .btn-outline:hover {
        background-color: #f0f0f0;
    }

    .product-card .btn-fill:hover {
        filter: brightness(1.1);
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    initializeEventListeners();
});
// --- Pagination ---
const PRODUCTS_PER_PAGE = 12;
let currentPage = 1;

function renderPagination(totalProducts) {
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) return;

  paginationContainer.innerHTML = '';

  // Helper tạo nút
  const createButton = (text, page, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    if (disabled) btn.disabled = true;
    if (active) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (page !== currentPage) {
        currentPage = page;
        displayProductsForPage();
      }
    });
    return btn;
  };

  // Previous
  paginationContainer.appendChild(createButton('← Previous', currentPage - 1, currentPage === 1));

  // Dấu "..." logic
  const maxPagesToShow = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxPagesToShow - 1);

  if (end - start < maxPagesToShow - 1) start = Math.max(1, end - maxPagesToShow + 1);

  if (start > 1) {
    paginationContainer.appendChild(createButton('1', 1));
    if (start > 2) paginationContainer.appendChild(document.createTextNode('...'));
  }

  for (let i = start; i <= end; i++) {
    paginationContainer.appendChild(createButton(i, i, false, i === currentPage));
  }

  if (end < totalPages) {
    if (end < totalPages - 1) paginationContainer.appendChild(document.createTextNode('...'));
    paginationContainer.appendChild(createButton(totalPages, totalPages));
  }

  // Next
  paginationContainer.appendChild(createButton('Next →', currentPage + 1, currentPage === totalPages));
}

function displayProductsForPage() {
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIdx = startIdx + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIdx, endIdx);
  displayProducts(paginatedProducts);
  renderPagination(filteredProducts.length);
}
