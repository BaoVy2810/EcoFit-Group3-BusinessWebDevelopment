// Load product data from JSON
let productsData = null;
let promotionsData = null;
let currentProduct = null;
let currentImageIndex = 0;

// Get product ID from URL parameter
function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || 'P002'; // Default to P002 if no ID
}

// Load JSON data
async function loadData() {
    try {
        // ƯU TIÊN ĐỌC DỮ LIỆU TỪ LOCALSTORAGE
        //const storedProducts = localStorage.getItem("products");
        //const storedPromotions = localStorage.getItem("promotions");
        
        //if (storedProducts && storedPromotions) {
            // Nếu có data trong localStorage thì dùng luôn
            //productsData = JSON.parse(storedProducts);
            //promotionsData = JSON.parse(storedPromotions);
            //console.log("✓ Loaded data from localStorage");
        //} else {
            // Nếu chưa có thì fetch từ file JSON
            //const [productsResponse, promotionsResponse] = await Promise.all([
                //fetch('../../dataset/products.json'),
                //fetch('../../dataset/promotions.json')
            //]);
    //productsData = await productsResponse.json();
            //promotionsData = await promotionsResponse.json();
            
            // Lưu vào localStorage để lần sau dùng
            //localStorage.setItem("products", JSON.stringify(productsData));
            //localStorage.setItem("promotions", JSON.stringify(promotionsData));
            //console.log("✓ Loaded data from JSON files and saved to localStorage");
        //}
    // 🔹 DEV MODE: luôn đọc lại JSON mới nhất, bỏ qua cache localStorage
        const DEV_MODE = true;
            if (!DEV_MODE) {
                // Production mode: vẫn ưu tiên dùng localStorage để load nhanh
                const storedProducts = localStorage.getItem("products");
                const storedPromotions = localStorage.getItem("promotions");

            if (storedProducts && storedPromotions) {
                productsData = JSON.parse(storedProducts);
                promotionsData = JSON.parse(storedPromotions);
                console.log("✓ Loaded data from localStorage");
            }
        }

        if (!productsData || !promotionsData || DEV_MODE) {
            // 🔹 Luôn fetch lại bản mới, thêm timestamp để tránh cache
            const timestamp = new Date().getTime();
            const [productsResponse, promotionsResponse] = await Promise.all([
                fetch('../../dataset/products.json?t=${timestamp}'),
                fetch('../../dataset/promotions.json?t=${timestamp}')
            ]);

    productsData = await productsResponse.json();
    promotionsData = await promotionsResponse.json();

    // Cập nhật lại localStorage (để dùng nếu tắt DEV_MODE)
    localStorage.setItem("products", JSON.stringify(productsData));
    localStorage.setItem("promotions", JSON.stringify(promotionsData));

    console.log("🔄 Loaded fresh JSON data from files");
}
        
        const productId = getProductIdFromURL();
        currentProduct = productsData.product.find(p => p.product_id === productId);
        
        if (currentProduct) {
            displayProductDetails();
            displayRelatedProducts();
        } else {
            console.error('Product not found');
            showErrorMessage('Product not found. Redirecting to shop...');
            setTimeout(() => {
                window.location.href = './03_PRODUCT_SearchFilter.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showErrorMessage('Failed to load product data. Please try again later.');
    }
}

// Show error message
function showErrorMessage(message) {
    const container = document.querySelector('.product-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2 style="color: #e74c3c;">${message}</h2>
            </div>
        `;
    }
}

// Calculate discounted price
function calculateDiscountedPrice(originalPrice, promoCode) {
    if (!promoCode) return originalPrice;
    
    const discounts = {
        'ECO10': 10,
        'GREEN20': 20,
        'SAVE15': 15,
        'ACC5': 5,
        'STYLE25':25,
        'CLEAR40':40,
    };
    
    const discountRate = discounts[promoCode] || 0;
    const discount = (originalPrice * discountRate) / 100;
    return Math.round(originalPrice - discount);
}

// Get promotion discount rate
function getPromotionDiscount(promoCode) {
    if (!promoCode) return 0;
    
    const discounts = {
        'ECO10': 10,
        'GREEN20': 20,
        'SAVE15': 15,
        'ACC5': 5,
        'STYLE25':25,
        'CLEAR40':40,
    };
    
    return discounts[promoCode] || 0;
}

// Format price to Vietnamese Dong
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

// Get category name
function getCategoryName(categoryId) {
    if (!productsData) return 'Unknown';
    const category = productsData.category.find(c => c.category_id === categoryId);
    return category ? category.category_name : 'Unknown';
}

// Calculate average rating from reviews
function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
}

// Display product details
function displayProductDetails() {
    if (!currentProduct) return;
    
    const discountRate = getPromotionDiscount(currentProduct.promotion_code);
    const discountedPrice = calculateDiscountedPrice(currentProduct.price_original, currentProduct.promotion_code);
    const categoryName = getCategoryName(currentProduct.category_id);
    const avgRating = calculateAverageRating(currentProduct.reviews);
    
    // Update discount badge
    const discountBadge = document.querySelector('.gallery-main .discount');
    if (discountBadge) {
        if (discountRate > 0) {
            discountBadge.textContent = `${discountRate}% off`;
            discountBadge.style.display = 'block';
        } else {
            discountBadge.style.display = 'none';
        }
    }
    
    // Update gallery main image
    const mainImage = document.querySelector('.gallery-main img');
    if (mainImage && currentProduct.product_images && currentProduct.product_images.length > 0) {
        mainImage.src = currentProduct.product_images[0];
        mainImage.alt = currentProduct.product_name;
    }

    // Update gallery thumbnails
    updateGalleryThumbnails();

    // Update stock status
    const statusTag = document.querySelector('.status-tag');
    if (statusTag) {
        if (currentProduct.quantity_available > 0) {
            statusTag.textContent = 'In Stock';
            statusTag.style.backgroundColor = '#4CAF50';
        } else {
            statusTag.textContent = 'Out of Stock';
            statusTag.style.backgroundColor = '#e74c3c';
        }
    }
    
    // Update product category
    const categoryP = document.querySelector('.product-category p');
    if (categoryP) {
        categoryP.textContent = categoryName;
    }
    
    // Update product title
    const productTitle = document.querySelector('.product-title');
    if (productTitle) {
        productTitle.innerHTML = `
            ${currentProduct.product_name}
            <span class="greenscore-detail">
                <span class="greenscore-value">${currentProduct.green_score.value}</span>
                <img src="${currentProduct.green_score.image}" alt="greenscore">
            </span>
        `;
    }
    
    // Update rating
    updateProductRating(avgRating);
    
    // Update price
    updateProductPrice(discountedPrice, discountRate);
    
    // Update description
    const descP = document.querySelector('.product-desc');
    if (descP) {
        descP.innerHTML = `
            ${currentProduct.description}
            <span class="more" style="color: #4CAF50; cursor: pointer;">More...</span>
        `;
        
        // Add click event for "More..."
        const moreBtn = descP.querySelector('.more');
        if (moreBtn) {
            moreBtn.addEventListener('click', () => {
                const descSection = document.querySelector('.description');
                if (descSection) {
                    descSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }
    
    // Update size options
    updateSizeOptions();
    
    // Update color options
    updateColorOptions();
    
    // Update additional information table
    updateAdditionalInfo();
    
    // Update description section
    updateDescriptionSection();
    
    // Update reviews section
    updateReviewsSection();
}

// Update gallery thumbnails
function updateGalleryThumbnails() {
    const thumbnailsContainer = document.querySelector('.gallery-thumbnails');
    if (!thumbnailsContainer || !currentProduct.product_images || currentProduct.product_images.length === 0) return;

    thumbnailsContainer.innerHTML = currentProduct.product_images.map((img, index) => 
        `<img src="${img}" alt="${currentProduct.product_name} ${index + 1}" ${index === 0 ? 'class="active"' : ''}>`
    ).join('');

    setupThumbnailClicks();
}

// Update product rating
function updateProductRating(avgRating) {
    const ratingDiv = document.querySelector('.product-rating');
    if (!ratingDiv) return;
    
    const reviewCount = currentProduct.reviews ? currentProduct.reviews.length : 0;

    // Làm tròn rating để chọn ảnh
    const roundedRating = Math.round(avgRating);
    const starImage = `../images/${getStarImage(roundedRating)}`;
    
    ratingDiv.innerHTML = `
        <div class="rating-item">
            <img src="${starImage}" alt="${roundedRating} stars">
            <span><u>${avgRating}</u></span>
        </div>
        <span class="divider">|</span>
        <div class="rating-item">(<u>${reviewCount}</u> review${reviewCount !== 1 ? 's' : ''})</div>
        <span class="divider">|</span>
        <div class="rating-item">${currentProduct.number_bought}</div>
    `;
}

// Update product price
function updateProductPrice(discountedPrice, discountRate) {
    const priceDiv = document.querySelector('.product-price');
    if (!priceDiv) return;
    
    if (discountRate > 0) {
        priceDiv.innerHTML = `
            <p>${formatPrice(discountedPrice)}</p>
            <span>${formatPrice(currentProduct.price_original)}</span>
        `;
    } else {
        priceDiv.innerHTML = `<p>${formatPrice(currentProduct.price_original)}</p>`;
    }
}

// Update size options
function updateSizeOptions() {
    const sizeSelect = document.querySelector('#size');
    if (!sizeSelect || !currentProduct.attributes || !currentProduct.attributes.Size) return;
    
    const sizes = currentProduct.attributes.Size.split(' - ');
    sizeSelect.innerHTML = sizes.map(size => 
        `<option value="${size.trim()}">${size.trim()}</option>`
    ).join('');
}

function updateColorOptions() {
    const colorSelect = document.querySelector('#color');
    if (!colorSelect || !currentProduct.attributes || !currentProduct.attributes.Color) return;

    // Lấy danh sách màu từ thuộc tính
    const colors = currentProduct.attributes.Color.split(',').map(c => c.trim());
    colorSelect.innerHTML = colors.map(color => 
        `<option value="${color}">${color}</option>`
    ).join('');

    colorSelect.addEventListener('change', (e) => {
        const selectedIndex = e.target.selectedIndex;
        const images = currentProduct.product_images || [];

        if (images.length === 0) return;

        // Nếu ít ảnh hơn số màu → lấy ảnh cuối cùng
        const newImageIndex = selectedIndex < images.length ? selectedIndex : images.length - 1;

        const mainImage = document.querySelector('.gallery-main img');
        if (mainImage) {
            mainImage.src = images[newImageIndex];
            mainImage.alt = `${currentProduct.product_name} - ${e.target.value}`;
        }

        const thumbnails = document.querySelectorAll('.gallery-thumbnails img');
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === newImageIndex);
        });
    });
}

// Update additional information table
function updateAdditionalInfo() {
    const tbody = document.querySelector('.additional-info tbody');
    if (!tbody || !currentProduct.attributes) return;
    
    tbody.innerHTML = Object.entries(currentProduct.attributes).map(([key, value]) => `
        <tr>
            <td>${key}:</td>
            <td>${value}</td>
        </tr>
    `).join('');
}

// Update description section
function updateDescriptionSection() {
    const descSection = document.querySelector('.description');
    if (!descSection) return;
    
    const additionalInfo = currentProduct.additional_info;
    
    let html = '';
    
    if (additionalInfo) {
        html += `<p>${additionalInfo.description_text}</p>`;
        
        if (additionalInfo.key_features && additionalInfo.key_features.length > 0) {
            html += '<ul>';
            additionalInfo.key_features.forEach(feature => {
                html += `<li>${feature}</li>`;
            });
            html += '</ul>';
        }
    }
    
    if (currentProduct.review_images && currentProduct.review_images.length > 0) {
        html += '<div class="images">';
        currentProduct.review_images.forEach(img => {
            html += `<img src="${img}" alt="${currentProduct.product_name}">`;
        });
        html += '</div>';
    }
    
    descSection.innerHTML = html;
}

// Update reviews section
function updateReviewsSection() {
    if (!currentProduct.reviews || currentProduct.reviews.length === 0) return;
    
    const avgRating = calculateAverageRating(currentProduct.reviews);
    const totalReviews = currentProduct.reviews.length;
    
    // Calculate rating distribution
    const ratingCounts = [0, 0, 0, 0, 0]; // for ratings 1-5
    currentProduct.reviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
            ratingCounts[review.rating - 1]++;
        }
    });
    
    // Update review summary
    updateReviewSummary(avgRating, totalReviews, ratingCounts);
    
    // Display individual reviews
    displayIndividualReviews();
    displayReviewsForPage();
}

// Update review summary
function updateReviewSummary(avgRating, totalReviews, ratingCounts) {
    const reviewSummary = document.querySelector('.review-summary');
    if (!reviewSummary) return;
    
    // Tính phần trăm cho conic-gradient (rating / 5 * 360deg)
    const ratingPercentage = (parseFloat(avgRating) / 5) * 360;
    
    reviewSummary.innerHTML = `
        <div class="review-score">
            <div class="rating-circle" style="background: conic-gradient(#FFD54F ${ratingPercentage}deg, #E4E9EE 0deg);">
                <div class="rating-number">${avgRating}</div>
            </div>
            <div class="stars">
                <img src="../images/fivestars.png" alt="rating"/>
            </div>
            <p>from ${totalReviews} review${totalReviews !== 1 ? 's' : ''}</p>
        </div>
        <div class="rating-bars">
            ${[5, 4, 3, 2, 1].map(rating => {
                const count = ratingCounts[rating - 1];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return `
                    <div class="rating-bar">
                        <span>${rating}.0 <img src="../images/star_filled.png" alt="star"/></span>
                        <div class="bar">
                            <div class="fill" style="width:${percentage}%;"></div>
                        </div>
                        <p>${count}</p>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Display individual reviews
function displayIndividualReviews() {
    const reviewListCell = document.querySelector('.review-list-cell');
    if (!reviewListCell) return;
    
    const existingReviewItems = reviewListCell.querySelectorAll('.review-item');
    existingReviewItems.forEach(item => item.remove());
    
    const reviewsHTML = currentProduct.reviews.map((review, index) => `
        <div class="review-item">
            <div class="review-header">
                <div class="review-stars">
                    <img src="../images/${getStarImage(review.rating)}" alt="${review.rating} stars" />
                </div>
            </div>
            <p class="review-text"><strong>${escapeHtml(review.text)}</strong></p>
            <p class="review-meta">${review.date}</p>
            <div class="review-footer">
                <div class="review-user">
                    <img src="../images/avatar${(index % 4) + 1}.png" alt="${escapeHtml(review.user)}" />
                    <span>${escapeHtml(review.user)}</span>
                </div>
                <div class="review-actions">
                    <button class="thumb-up-btn">
                        <span><img src="../images/thumb_up.png" alt="like"/></span> 
                        <span class="like-count">${review.likes}</span>
                    </button>
                    <button class="thumb-down-btn">
                        <span><img src="../images/thumb_down.png" alt="dislike"/></span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    const reviewTabs = reviewListCell.querySelector('.review-tabs');
    if (reviewTabs) {
        reviewTabs.insertAdjacentHTML('afterend', reviewsHTML);
    } else {
        reviewListCell.insertAdjacentHTML('beforeend', reviewsHTML);
    }
}
// --- Pagination for reviews ---
const REVIEWS_PER_PAGE = 4;
let currentReviewPage = 1;

function renderReviewPagination() {
    const totalReviews = currentProduct.reviews.length;
    const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);
    const paginationContainer = document.querySelector('.review-pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    const createBtn = (text, page, disabled = false, active = false) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        if (disabled) btn.disabled = true;
        if (active) btn.classList.add('active');
        btn.addEventListener('click', () => {
            if (!disabled && page !== currentReviewPage) {
                currentReviewPage = page;
                displayReviewsForPage();
            }
        });
        return btn;
    };

    // ← Previous
    paginationContainer.appendChild(
        createBtn('← Previous', currentReviewPage - 1, currentReviewPage === 1)
    );

    // Số trang (rút gọn kiểu 1 2 3 ... 24)
    const totalToShow = 5;
    let start = Math.max(1, currentReviewPage - 2);
    let end = Math.min(totalPages, start + totalToShow - 1);
    if (end - start < totalToShow - 1) start = Math.max(1, end - totalToShow + 1);

    if (start > 1) {
        paginationContainer.appendChild(createBtn('1', 1));
        if (start > 2) paginationContainer.appendChild(document.createTextNode('...'));
    }

    for (let i = start; i <= end; i++) {
        paginationContainer.appendChild(createBtn(i, i, false, i === currentReviewPage));
    }

    if (end < totalPages) {
        if (end < totalPages - 1) paginationContainer.appendChild(document.createTextNode('...'));
        paginationContainer.appendChild(createBtn(totalPages, totalPages));
    }

    // Next →
    paginationContainer.appendChild(
        createBtn('Next →', currentReviewPage + 1, currentReviewPage === totalPages)
    );
}

function displayReviewsForPage() {
    const reviewListCell = document.querySelector('.review-list-cell');
    if (!reviewListCell) return;

    const start = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
    const end = start + REVIEWS_PER_PAGE;
    const reviewsToShow = currentProduct.reviews.slice(start, end);

    // Xoá review cũ
    reviewListCell.querySelectorAll('.review-item').forEach(item => item.remove());

    const reviewsHTML = reviewsToShow.map((review, index) => `
        <div class="review-item">
            <div class="review-header">
                <div class="review-stars">
                    <img src="../images/${getStarImage(review.rating)}" alt="${review.rating} stars" />
                </div>
            </div>
            <p class="review-text"><strong>${escapeHtml(review.text)}</strong></p>
            <p class="review-meta">${review.date}</p>
            <div class="review-footer">
                <div class="review-user">
                    <img src="../images/avatar${(index % 4) + 1}.png" alt="${escapeHtml(review.user)}" />
                    <span>${escapeHtml(review.user)}</span>
                </div>
                <div class="review-actions">
                    <button class="thumb-up-btn">
                        <span><img src="../images/thumb_up.png" alt="like"/></span> 
                        <span class="like-count">${review.likes}</span>
                    </button>
                    <button class="thumb-down-btn">
                        <span><img src="../images/thumb_down.png" alt="dislike"/></span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    const reviewTabs = reviewListCell.querySelector('.review-tabs');
    if (reviewTabs) {
        reviewTabs.insertAdjacentHTML('afterend', reviewsHTML);
    } else {
        reviewListCell.insertAdjacentHTML('beforeend', reviewsHTML);
    }

    renderReviewPagination();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get star image based on rating
function getStarImage(rating) {
    const starImages = {
        5: 'fivestars.png',
        4: 'fourstars.png',
        3: 'threestars.png',
        2: 'twostars.png',
        1: 'onestar.png'
    };
    return starImages[rating] || 'fivestars.png';
}

// Display related products
function displayRelatedProducts() {
    if (!productsData || !currentProduct) return;

    const currentCategory = currentProduct.category_id;
    const currentMaterial = currentProduct.attributes?.Material || '';
    const currentScore = currentProduct.green_score?.value || 0;

    // Lấy các sản phẩm cùng category (trừ chính nó)
    let relatedProducts = productsData.product.filter(p =>
        p.category_id === currentCategory && p.product_id !== currentProduct.product_id
    );

    // Nếu ít hơn 4 sản phẩm, bổ sung thêm
    if (relatedProducts.length < 4) {
        const remaining = 4 - relatedProducts.length;

        const extraProducts = productsData.product
            .filter(p =>
                p.product_id !== currentProduct.product_id &&
                p.category_id !== currentCategory &&
                (Math.abs(p.green_score.value - currentScore) <= 5 ||
                 (p.attributes?.Material && p.attributes.Material === currentMaterial))
            )
            .slice(0, remaining);

        relatedProducts = [...relatedProducts, ...extraProducts];
    }

    const productGrid = document.querySelector('.related_products .product-grid');
    if (!productGrid) return;
    relatedProductsList = relatedProducts;
    relatedCurrentPage = 1;
    displayRelatedProductsForPage();
    setupRelatedProductsClick();
}
// --- Pagination for related products ---
const RELATED_PER_PAGE = 4;
let relatedCurrentPage = 1;
let relatedProductsList = [];

function renderRelatedPagination() {
    const totalProducts = relatedProductsList.length;
    const totalPages = Math.ceil(totalProducts / RELATED_PER_PAGE);
    const paginationContainer = document.querySelector('.related-pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    const createBtn = (text, page, disabled = false, active = false) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.setAttribute('data-page', page);
        if (disabled) btn.disabled = true;
        if (active) btn.classList.add('active');
        return btn;
    };

    // Previous
    paginationContainer.appendChild(
        createBtn('← Previous', relatedCurrentPage - 1, relatedCurrentPage === 1)
    );

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationContainer.appendChild(
            createBtn(i, i, false, i === relatedCurrentPage)
        );
    }

    // Next
    paginationContainer.appendChild(
        createBtn('Next →', relatedCurrentPage + 1, relatedCurrentPage === totalPages)
    );

    // 🎯 Gán sự kiện click SAU KHI render xong
    paginationContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.getAttribute('data-page'));
            if (isNaN(page) || page < 1 || page > totalPages) return;
            relatedCurrentPage = page;
            displayRelatedProductsForPage(); // ✅ Hiển thị sản phẩm trang mới
        });
    });
}


function displayRelatedProductsForPage() {
    const start = (relatedCurrentPage - 1) * RELATED_PER_PAGE;
    const end = start + RELATED_PER_PAGE;
    const productsToShow = relatedProductsList.slice(start, end);

    const productGrid = document.querySelector('.related_products .product-grid');
    if (!productGrid) return;

    productGrid.innerHTML = productsToShow.map(product => {
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
                        <button class="btn-outline" onclick="addToCart('${product.product_id}', event)">Add to cart</button>
                        <button class="btn-fill" onclick="buyNow('${product.product_id}', event)">Buy now</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    setupRelatedProductsClick();
    renderRelatedPagination();
}
// Setup related products click
function setupRelatedProductsClick() {
    document.querySelectorAll('.related_products .product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't navigate if clicking on buttons
            if (!e.target.closest('button')) {
                const productId = this.dataset.productId;
                window.location.href = `04_PRODUCT_Detail.html?id=${productId}`;
            }
        });
    });
}

// Gallery navigation
function setupGalleryNavigation() {
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    const mainImage = document.querySelector('.gallery-main img');
    const thumbnails = document.querySelectorAll('.gallery-thumbnails img');
    
    if (!prevBtn || !nextBtn || !mainImage || thumbnails.length === 0) return;
    
    function updateGallery(index) {
        if (index < 0 || index >= thumbnails.length) return;
        
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
        mainImage.src = thumbnails[index].src;
        mainImage.alt = thumbnails[index].alt;
        currentImageIndex = index;
    }
    
    prevBtn.addEventListener('click', () => {
        const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : thumbnails.length - 1;
        updateGallery(newIndex);
    });
    
    nextBtn.addEventListener('click', () => {
        const newIndex = currentImageIndex < thumbnails.length - 1 ? currentImageIndex + 1 : 0;
        updateGallery(newIndex);
    });
}

// Setup thumbnail clicks
function setupThumbnailClicks() {
    const thumbnails = document.querySelectorAll('.gallery-thumbnails img');
    const mainImage = document.querySelector('.gallery-main img');
    
    if (!mainImage) return;
    
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            mainImage.src = thumb.src;
            mainImage.alt = thumb.alt;
            currentImageIndex = index;
        });
    });
}

// Quantity controls
function setupQuantityControls() {
    const qtyInput = document.querySelector('.quantity input');
    const qtyBtns = document.querySelectorAll('.qty-btn');
    
    if (!qtyInput || qtyBtns.length < 2) return;
    
    const minusBtn = qtyBtns[0];
    const plusBtn = qtyBtns[1];
    
    minusBtn.addEventListener('click', () => {
        let value = parseInt(qtyInput.value) || 1;
        if (value > 1) {
            qtyInput.value = value - 1;
        }
    });
    
    plusBtn.addEventListener('click', () => {
        let value = parseInt(qtyInput.value) || 1;
        const maxQty = currentProduct ? currentProduct.quantity_available : 999;
        if (value < maxQty) {
            qtyInput.value = value + 1;
        } else {
            alert(`Maximum available quantity is ${maxQty}`);
        }
    });
    
    qtyInput.addEventListener('input', () => {
        let value = parseInt(qtyInput.value);
        const maxQty = currentProduct ? currentProduct.quantity_available : 999;
        
        if (isNaN(value) || value < 1) {
            qtyInput.value = 1;
        } else if (value > maxQty) {
            qtyInput.value = maxQty;
            alert(`Maximum available quantity is ${maxQty}`);
        }
    });
    
    // Prevent non-numeric input
    qtyInput.addEventListener('keypress', (e) => {
        if (e.key && !/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });
}

// Add to cart function
function addToCart(productId, event) {
    // Prevent event propagation if called from button
    if (event) {
        event.stopPropagation();
    }
    
    const product = productId ? productsData.product.find(p => p.product_id === productId) : currentProduct;
    if (!product) {
        alert('Product not found!');
        return;
    }
    
    // Check if product is in stock
    if (product.quantity_available <= 0) {
        alert('Sorry, this product is out of stock!');
        return;
    }
    
    const qtyInput = document.querySelector('.quantity input');
    const sizeSelect = document.querySelector('#size');
    const colorSelect = document.querySelector('#color');
    
    const quantity = productId ? 1 : (qtyInput ? parseInt(qtyInput.value) || 1 : 1);
    const size = productId ? 'M' : (sizeSelect ? sizeSelect.value : 'M');
    const color = productId ? 'Default' : (colorSelect ? colorSelect.value : 'Default');
    
    // Validate quantity
    if (quantity > product.quantity_available) {
        alert(`Only ${product.quantity_available} items available!`);
        return;
    }
    
    // Get existing cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already in cart with same size and color
    const existingIndex = cart.findIndex(item => 
        item.product_id === product.product_id && 
        item.size === size && 
        item.color === color
    );
    
    const discountedPrice = calculateDiscountedPrice(product.price_original, product.promotion_code);
    
    if (existingIndex !== -1) {
        // Update quantity of existing item
        const newQuantity = cart[existingIndex].quantity + quantity;
        if (newQuantity > product.quantity_available) {
            alert(`Cannot add more. Maximum available quantity is ${product.quantity_available}`);
            return;
        }
        cart[existingIndex].quantity = newQuantity;
    } else {
        // Add new item to cart
        const productImage = product.review_images && product.review_images.length > 0 
            ? product.review_images[0] 
            : '../../dataset/product_images/placeholder.png';
        
        cart.push({
            product_id: product.product_id,
            name: product.product_name,
            price: discountedPrice,
            original_price: product.price_original,
            quantity: quantity,
            size: size,
            color: color,
            image: productImage,
            green_score: product.green_score.value
        });
    }
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show success message
    showAddToCartMessage(`✓ ${product.product_name} added to cart!`);
    
    // Update cart count in header if exists
    updateCartCount();
}

// Show add to cart message
function showAddToCartMessage(message) {
    // Remove existing message if any
    const existingMsg = document.querySelector('.cart-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create message element
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
    
    // Remove message after 3 seconds
    setTimeout(() => {
        msgDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Try to update cart badge in header
    const headerFrame = document.getElementById('header-frame');
    if (headerFrame && headerFrame.contentWindow) {
        headerFrame.contentWindow.postMessage({ 
            action: 'updateCartBadge',
            count: totalItems 
        }, '*');
    }
}

// Buy now function
function buyNow(productId, event) {
    // Prevent event propagation if called from button
    if (event) {
        event.stopPropagation();
    }
    
    addToCart(productId, event);
    
    // Redirect to cart page after short delay
    setTimeout(() => {
        window.location.href = './05_SHOPPING_CART.html';
    }, 500);
}

// Setup product action buttons
function setupProductActions() {
    const addToCartBtn = document.querySelector('.product-actions .btn-outline');
    const buyNowBtn = document.querySelector('.product-actions .btn-fill');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if (currentProduct && currentProduct.quantity_available > 0) {
                addToCart(null, null);
            } else {
                alert('Sorry, this product is out of stock!');
            }
        });
    }
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            if (currentProduct && currentProduct.quantity_available > 0) {
                buyNow(null, null);
            } else {
                alert('Sorry, this product is out of stock!');
            }
        });
    }
}

// Setup review action buttons
function setupReviewActions() {
    document.addEventListener('click', (e) => {
        const thumbBtn = e.target.closest('.review-actions button');
        if (thumbBtn) {
            // Toggle active state
            if (thumbBtn.classList.contains('active')) {
                thumbBtn.classList.remove('active');
            } else {
                const parent = thumbBtn.closest('.review-actions');
                if (parent) {
                    parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    thumbBtn.classList.add('active');
                    
                    // If it's a like button, increment count
                    if (thumbBtn.classList.contains('thumb-up-btn')) {
                        const likeCount = thumbBtn.querySelector('.like-count');
                        if (likeCount) {
                            const currentCount = parseInt(likeCount.textContent) || 0;
                            likeCount.textContent = currentCount + 1;
                        }
                    }
                }
            }
        }
    });
}

// Setup review filter
function setupReviewFilter() {
    const filterCheckboxes = document.querySelectorAll('.review-filter input[type="checkbox"]');
    
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // In a real application, you would filter reviews here
            console.log('Filter changed:', checkbox.checked);
        });
    });
}

// Setup review tabs
function setupReviewTabs() {
    const tabButtons = document.querySelectorAll('.review-tabs button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked tab
            button.classList.add('active');
            
            // In a real application, you would filter reviews based on tab
            console.log('Tab changed:', button.textContent);
        });
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading indicator
    console.log('Loading product details...');
    
    // Load data and initialize
    await loadData();
    
    // Setup all interactions
    setupGalleryNavigation();
    setupQuantityControls();
    setupProductActions();
    setupReviewActions();
    setupReviewFilter();
    setupReviewTabs();
    
    console.log('Product details loaded successfully');
});

// Header authentication handling
window.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("header-frame");
    if (!header) return;
    
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    header.src = isLoggedIn ? "../template/header.html" : "../template/header0.html";
    
    header.onload = () => {
        // Notify header about active navigation
        if (header.contentWindow) {
            header.contentWindow.postMessage({ activeNav: "nav-shop" }, "*");
        }
    };
});

// Handle messages from header and other windows
window.addEventListener("message", (e) => {
    if (!e.data || !e.data.action) return;
    
    const header = document.getElementById("header-frame");
    
    switch(e.data.action) {
        case "goToLogin":
            window.location.href = "00_LOGIN.html";
            break;
            
        case "goToSignup":
            window.location.href = "00_SIGNUP.html";
            break;
            
        case "loginSuccess":
        case "loggedIn":
            localStorage.setItem("isLoggedIn", "true");
            if (header) {
                header.src = "../template/header.html";
            }
            break;
            
        case "logout":
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("login_infor");
            localStorage.removeItem("cart");
            if (header) {
                header.src = "../template/header0.html";
            }
            // Optionally redirect to home
            // window.location.href = "01_HOME.html";
            break;
            
        case "goToCart":
            window.location.href = "05_CART.html";
            break;
            
        case "goToProfile":
            window.location.href = "06_PROFILE.html";
            break;
            
        default:
            console.log('Unknown action:', e.data.action);
    }
});

// Add CSS animations for cart message only
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
        margin-top:65px;
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
        font-size: 14px;
        letter-spacing: 0.3px;
    }
`;
document.head.appendChild(style);

// Utility function: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle window resize for responsive behavior
window.addEventListener('resize', debounce(() => {
    console.log('Window resized');
    // Add any resize-specific logic here
}, 250));

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
        // Refresh cart count when page becomes visible
        updateCartCount();
    }
});

// Handle before unload (optional - for saving state)
window.addEventListener('beforeunload', (e) => {
    // Save any pending changes to localStorage
    console.log('Page unloading');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to close modals (if any)
    if (e.key === 'Escape') {
        // Close any open modals
        console.log('Escape pressed');
    }
    
    // Arrow keys for gallery navigation
    if (e.key === 'ArrowLeft') {
        const prevBtn = document.querySelector('.gallery-prev');
        if (prevBtn) prevBtn.click();
    }
    
    if (e.key === 'ArrowRight') {
        const nextBtn = document.querySelector('.gallery-next');
        if (nextBtn) nextBtn.click();
    }
});

// Image lazy loading fallback
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Error handling for images
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.error('Image failed to load:', e.target.src);
        // Set fallback image
        e.target.src = '../../dataset/product_images/placeholder.png';
    }
}, true);

// Share product functionality
function shareProduct(platform) {
    if (!currentProduct) return;

    const productUrl = encodeURIComponent(window.location.href);
    const productName = encodeURIComponent(currentProduct.product_name);
    const productDesc = encodeURIComponent(currentProduct.description || "");

    let shareUrl = "";

    switch (platform) {
        case "facebook":
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${productUrl}&quote=${productName}%20-%20${productDesc}`;
            break;
        case "instagram":
            shareUrl = `https://www.instagram.com/ecofitclothes.shop/`;
            break;
        default:
            console.warn("Unsupported platform:", platform);
            return;
    }
    window.open(shareUrl, "_blank", "width=600,height=500");
}

// Add share button event listeners
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".product-share a[data-platform]").forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const platform = button.dataset.platform;
            shareProduct(platform);
        });
    });
});


// Add share button event listeners
document.addEventListener('DOMContentLoaded', () => {
    const shareButtons = document.querySelectorAll('.product-share a');
    shareButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const platform = button.href.includes('facebook') ? 'facebook' : 'instagram';
            shareProduct(platform);
        });
    });
});

// Print product details
function printProduct() {
    window.print();
}

// Add to wishlist (if feature exists)
function addToWishlist(productId) {
    const product = productId ? productsData.product.find(p => p.product_id === productId) : currentProduct;
    if (!product) return;
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
        alert('Please login to add items to wishlist');
        window.location.href = '00_LOGIN.html';
        return;
    }
    
    // Get existing wishlist
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    // Check if already in wishlist
    if (wishlist.some(item => item.product_id === product.product_id)) {
        alert('Product already in wishlist!');
        return;
    }
    
    // Add to wishlist
    wishlist.push({
        product_id: product.product_id,
        product_name: product.product_name,
        price: calculateDiscountedPrice(product.price_original, product.promotion_code),
        image: product.review_images && product.review_images.length > 0 ? product.review_images[0] : '',
        green_score: product.green_score.value
    });
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    showAddToCartMessage(`❤️ ${product.product_name} added to wishlist!`);
}

// Compare products (if feature exists)
function addToCompare(productId) {
    const product = productId ? productsData.product.find(p => p.product_id === productId) : currentProduct;
    if (!product) return;
    
    // Get existing compare list
    let compareList = JSON.parse(localStorage.getItem('compareList')) || [];
    
    // Limit to 4 products
    if (compareList.length >= 4) {
        alert('You can only compare up to 4 products at a time!');
        return;
    }
    
    // Check if already in compare list
    if (compareList.some(item => item.product_id === product.product_id)) {
        alert('Product already in compare list!');
        return;
    }
    
    // Add to compare list
    compareList.push({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price_original,
        attributes: product.attributes,
        green_score: product.green_score.value
    });
    
    localStorage.setItem('compareList', JSON.stringify(compareList));
    showAddToCartMessage(`⚖️ ${product.product_name} added to compare!`);
}

// Track product view for analytics
function trackProductView() {
    if (!currentProduct) return;
    
    const viewData = {
        product_id: currentProduct.product_id,
        product_name: currentProduct.product_name,
        category: getCategoryName(currentProduct.category_id),
        timestamp: new Date().toISOString()
    };
    
    // Store in session storage for analytics
    let viewHistory = JSON.parse(sessionStorage.getItem('viewHistory')) || [];
    viewHistory.push(viewData);
    
    // Keep only last 10 views
    if (viewHistory.length > 10) {
        viewHistory = viewHistory.slice(-10);
    }
    
    sessionStorage.setItem('viewHistory', JSON.stringify(viewHistory));
    console.log('Product view tracked:', viewData);
}

// Call tracking when product loads
if (currentProduct) {
    trackProductView();
}
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.querySelector(".add-to-cart-btn");
  if (!addBtn) return;

  addBtn.addEventListener("click", () => {
    const color = document.querySelector("#color")?.value || "Default";
    const size = document.querySelector("#size")?.value || "M";
    const quantity = parseInt(document.querySelector("#quantity")?.value) || 1;

    const productId = currentProduct.product_id;
    const productName = currentProduct.product_name;
    const price = currentProduct.price_discounted || currentProduct.price_original;
    const image =
      currentProduct.product_images?.[0] || "../images/Product_images/organic_cotton_tee.png";

    const item = {
      product_id: productId,
      product_name: productName,
      price: price,
      color: color,
      size: size,
      quantity: quantity,
      image: image,
    };

    if (typeof addToCart === "function") {
      addToCart(item);
      alert(`✅ Đã thêm vào giỏ: ${productName}\nMàu: ${color} | Size: ${size}`);
    } else {
      console.warn("⚠️ addToCart() function not found.");
    }
  });
});


// Export functions for use in HTML onclick attributes
window.addToCart = addToCart;
window.buyNow = buyNow;
window.shareProduct = shareProduct;
window.addToWishlist = addToWishlist;
window.addToCompare = addToCompare;
window.printProduct = printProduct;

console.log('Product detail script loaded successfully');