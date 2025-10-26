// Load product data
let productsData = null;
let promotionsData = null;

// Load JSON data
async function loadData() {
    try {
        const DEV_MODE = true;
        
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
            const [productsResponse, promotionsResponse] = await Promise.all([
                fetch(`../../dataset/products.json?t=${timestamp}`),
                fetch(`../../dataset/promotions.json?t=${timestamp}`)
            ]);

            productsData = await productsResponse.json();
            promotionsData = await promotionsResponse.json();

            localStorage.setItem("products", JSON.stringify(productsData));
            localStorage.setItem("promotions", JSON.stringify(promotionsData));

            console.log("🔄 Loaded fresh JSON data");
        }

        // Display products after data is loaded
        displayBestSellers();
        displayCategoryProducts();
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Calculate discounted price
function calculateDiscountedPrice(originalPrice, promoCode) {
    if (!promoCode || !promotionsData) return originalPrice;
    
    const promotion = promotionsData.promotion.find(p => p.promo_code === promoCode);
    if (!promotion) return originalPrice;
    
    const discount = (originalPrice * promotion.discount_rate) / 100;
    return Math.round(originalPrice - discount);
}

// Get promotion discount rate
function getPromotionDiscount(promoCode) {
    if (!promoCode || !promotionsData) return 0;
    const promotion = promotionsData.promotion.find(p => p.promo_code === promoCode);
    return promotion ? promotion.discount_rate : 0;
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

// Get category name
function getCategoryName(categoryId) {
    if (!productsData) return 'Unknown';
    const category = productsData.category.find(c => c.category_id === categoryId);
    return category ? category.category_name : 'Unknown';
}

// Calculate average rating
function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
}

// Display Best Sellers (1 product from each category)
function displayBestSellers() {
    const bestSellersGrid = document.querySelectorAll('.product-grid')[0];
    if (!bestSellersGrid || !productsData) return;

    // Get 1 signature product from each category
    const signatureProducts = [
        productsData.product.find(p => p.product_id === 'P001'), // Organic Cotton Tee - Shirts
        productsData.product.find(p => p.product_id === 'P007'), // Recycled Denim Jeans - Pants
        productsData.product.find(p => p.product_id === 'P018'), // Eco Linen Midi Dress - Dresses
        productsData.product.find(p => p.product_id === 'P023')  // Upcycled Tote Bag - Accessories
    ].filter(Boolean);

    bestSellersGrid.innerHTML = signatureProducts.map(product => 
        createProductCard(product)
    ).join('');

    // Add click events
    addProductCardEvents(bestSellersGrid);
}

// Display products for each category section
function displayCategoryProducts() {
    const sections = [
        { index: 1, categoryId: 'C001', productIds: ['P001', 'P002', 'P003', 'P004'] }, // Shirts - 4 shirts
        { index: 2, categoryId: 'C002', productIds: ['P006', 'P007', 'P015', 'P016'] }, // Pants - 4 pants
        { index: 3, categoryId: 'C003', productIds: ['P018', 'P019', 'P020', 'P021'] }, // Dresses - 4 dresses
        { index: 4, categoryId: 'C004', productIds: ['P008', 'P023', 'P024', 'P025'] }  // Accessories - 4 accessories
    ];

    sections.forEach(section => {
        const grid = document.querySelectorAll('.product-grid')[section.index];
        if (!grid || !productsData) return;

        const products = section.productIds
            .map(id => productsData.product.find(p => p.product_id === id))
            .filter(Boolean);

        grid.innerHTML = products.map(product => 
            createProductCard(product)
        ).join('');

        // Add click events
        addProductCardEvents(grid);
    });
}

// Create product card HTML
function createProductCard(product) {
    const discountRate = getPromotionDiscount(product.promotion_code);
    const discountedPrice = calculateDiscountedPrice(product.price_original, product.promotion_code);
    const avgRating = calculateAverageRating(product.reviews);
    const categoryName = getCategoryName(product.category_id);
    const productImage = (product.product_images && product.product_images.length > 0)
        ? product.product_images[0]
        : '../../dataset/product_images/placeholder.png';

    return `
        <div class="product-card" data-product-id="${product.product_id}">
            ${discountRate > 0 ? `<div class="discount">${discountRate}% off</div>` : ''}
            <div class="img-placeholder">
                <img src="${productImage}" alt="${escapeHtml(product.product_name)}"/>
            </div>
            <div class="product-info">
                <div class="price-rating">
                    <p class="price">
                        ${formatPrice(discountedPrice)}
                        ${discountRate > 0 ? `<span>${formatPrice(product.price_original)}</span>` : ''}
                    </p>
                    <div class="rating-line">
                        <img src="../images/star_filled.png" alt="rating" />
                        <span>${avgRating}</span>
                    </div>
                </div>
                <p class="name">${escapeHtml(product.product_name)}</p>
                <p class="type">${categoryName}</p>
                <p class="greenscore">
                    <img src="${product.green_score.image}" alt="greenscore" />
                    <span class="bought">${product.number_bought}</span>
                </p>
                <div class="btn-group">
                    <button class="btn-outline" data-action="add-cart">Add to cart</button>
                    <button class="btn-fill" data-action="buy-now">Buy now</button>
                </div>
            </div>
        </div>
    `;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add click events to product cards
function addProductCardEvents(grid) {
    const productCards = grid.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // Click on card to go to detail page
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-group')) {
                const productId = card.dataset.productId;
                window.location.href = `04_PRODUCT_Detail.html?id=${productId}`;
            }
        });

        // Add to cart button
        const addToCartBtn = card.querySelector('[data-action="add-cart"]');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = card.dataset.productId;
                addToCart(productId);
            });
        }

        // Buy now button
        const buyNowBtn = card.querySelector('[data-action="buy-now"]');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = card.dataset.productId;
                buyNow(productId);
            });
        }
    });
}

// Add to cart function
function addToCart(productId) {
    const product = productsData.product.find(p => p.product_id === productId);
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
    showMessage(`✓ ${product.product_name} added to cart!`);
    updateCartCount();
}

// Buy now function
function buyNow(productId) {
    addToCart(productId);
    setTimeout(() => {
        window.location.href = './05_SHOPPING_CART.html';
    }, 500);
}

// Show message
function showMessage(message) {
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

// Setup category navigation
function setupCategoryNavigation() {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const categories = ['Shirts', 'Pants', 'Dresses', 'Accessories'];
            const categoryName = categories[index];
            
            // Store selected category in sessionStorage
            sessionStorage.setItem('selectedCategory', categoryName);
            
            // Navigate to filter page
            window.location.href = '03_PRODUCT_SearchFilter.html';
        });
    });
}

// Setup "View all products" links
function setupViewAllLinks() {
    const viewAllLinks = document.querySelectorAll('.view-all');
    
    viewAllLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Map section index to category name
            const categories = ['Best Sellers', 'Shirts', 'Pants', 'Dresses', 'Accessories'];
            const categoryName = categories[index];
            
            if (categoryName !== 'Best Sellers') {
                sessionStorage.setItem('selectedCategory', categoryName);
            } else {
                // For Best Sellers, don't filter by category
                sessionStorage.removeItem('selectedCategory');
            }
            
            window.location.href = '03_PRODUCT_SearchFilter.html';
        });
    });
}

// Setup voucher button
function setupVoucherButton() {
    const voucherBtn = document.getElementById("getVoucherBtn");
    if (!voucherBtn) return;

    voucherBtn.addEventListener("click", () => {
        const voucherCode = "STYLE25";
        const storedVouchers = JSON.parse(localStorage.getItem("userVouchers")) || [];

        if (storedVouchers.includes(voucherCode)) {
            showMessage("⚠️ You've already claimed this voucher!");
            return;
        }

        storedVouchers.push(voucherCode);
        localStorage.setItem("userVouchers", JSON.stringify(storedVouchers));

        showMessage(`🎉 Successfully claimed voucher ${voucherCode}! Enjoy 25% off selected dresses.`);
        voucherBtn.classList.add('voucher-claimed');
        voucherBtn.textContent = 'Claimed!';
        voucherBtn.disabled = true;
    });
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
// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .cart-message {
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
        font-size: 14px;
        letter-spacing: 0.3px;
    }

    .product-card {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .category-item {
        transition: transform 0.2s ease;
    }

    .category-item:hover {
        transform: translateY(-5px);
    }

    #getVoucherBtn.voucher-claimed {
        background: #aaa !important;
        cursor: not-allowed;
    }

    #getVoucherBtn.voucher-claimed:hover {
        filter: none;
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Loading category page...');
    
    await loadData();
    setupCategoryNavigation();
    setupViewAllLinks();
    setupVoucherButton();
    
    console.log('Category page loaded successfully');
});

// Export functions
window.addToCart = addToCart;
window.buyNow = buyNow;