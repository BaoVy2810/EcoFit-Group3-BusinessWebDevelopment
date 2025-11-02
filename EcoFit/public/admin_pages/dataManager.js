/**
 * ========================================
 * DATA MANAGER - CENTRAL DATA MANAGEMENT
 * ========================================
 * Quản lý tất cả dữ liệu từ localStorage
 * Chỉ load JSON một lần sau khi đăng nhập
 */

const DataManager = {
  // Danh sách các file JSON cần load
  DATA_SOURCES: {
    accounts: '../../dataset/accounts.json',
    products: '../../dataset/products.json',
    orders: '../../dataset/orders.json',
    blogs: '../../dataset/blogs.json',
    promotions: '../../dataset/promotions.json' 
  },

  // Storage keys
  STORAGE_KEYS: {
    accounts: 'accounts',
    products: 'products',
    orders: 'orders',
    blogs: 'blogs',
    promotions: 'promotions',
    isDataLoaded: 'isDataLoaded',
    dataLoadTime: 'dataLoadTime'
  },

  /**
   * Load tất cả dữ liệu từ JSON vào localStorage
   * Chỉ gọi một lần sau khi đăng nhập thành công
   */
  async loadAllData() {
    console.log('🔄 Starting to load all data...');
    
    try {
      // Load accounts
      console.log('📊 Loading accounts...');
      const accountsRes = await fetch(this.DATA_SOURCES.accounts);
      const accountsData = await accountsRes.json();
      localStorage.setItem(this.STORAGE_KEYS.accounts, JSON.stringify(accountsData));
      console.log('✅ Accounts loaded:', accountsData.profile.length, 'accounts');

      // Load products
      console.log('📦 Loading products...');
      const productsRes = await fetch(this.DATA_SOURCES.products);
      const productsData = await productsRes.json();
      localStorage.setItem(this.STORAGE_KEYS.products, JSON.stringify(productsData));
      console.log('✅ Products loaded:', productsData.product.length, 'products');

      // Load orders
      console.log('🛒 Loading orders...');
      const ordersRes = await fetch(this.DATA_SOURCES.orders);
      const ordersData = await ordersRes.json();
      localStorage.setItem(this.STORAGE_KEYS.orders, JSON.stringify(ordersData));
      console.log('✅ Orders loaded:', ordersData.orders.length, 'orders');

      // Load blogs
      console.log('📝 Loading blogs...');
      const blogsRes = await fetch(this.DATA_SOURCES.blogs);
      const blogsData = await blogsRes.json();
      // Add status field if not exists
      const blogsWithStatus = blogsData.map(blog => ({
        ...blog,
        status: blog.status || 'published'
      }));
      localStorage.setItem(this.STORAGE_KEYS.blogs, JSON.stringify(blogsWithStatus));
      console.log('✅ Blogs loaded:', blogsWithStatus.length, 'blogs');

      // Load promotions
      console.log('🎁 Loading promotions...');
      const promotionsRes = await fetch(this.DATA_SOURCES.promotions);
      const promotionsData = await promotionsRes.json();
      localStorage.setItem(this.STORAGE_KEYS.promotions, JSON.stringify(promotionsData));
      console.log('✅ Promotions loaded:', promotionsData.promotion.length, 'promotions');

      // Mark data as loaded
      localStorage.setItem(this.STORAGE_KEYS.isDataLoaded, 'true');
      localStorage.setItem(this.STORAGE_KEYS.dataLoadTime, new Date().toISOString());
      
      console.log('🎉 All data loaded successfully!');
      return true;

    } catch (error) {
      console.error('❌ Error loading data:', error);
      return false;
    }
  },

  /**
   * Kiểm tra xem dữ liệu đã được load chưa
   */
  isDataLoaded() {
    return localStorage.getItem(this.STORAGE_KEYS.isDataLoaded) === 'true';
  },

  /**
   * Lấy dữ liệu từ localStorage
   * @param {string} key - Tên key (accounts, products, orders, blogs, promotions)
   * @returns {object|null} Dữ liệu hoặc null nếu không tìm thấy
   */
  getData(key) {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS[key]);
      if (!data) {
        console.warn(`⚠️ No data found for key: ${key}`);
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error getting data for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Lưu dữ liệu vào localStorage
   * @param {string} key - Tên key (accounts, products, orders, blogs, promotions)
   * @param {object} value - Dữ liệu cần lưu
   * @returns {boolean} True nếu thành công
   */
  saveData(key, value) {
    try {
      localStorage.setItem(this.STORAGE_KEYS[key], JSON.stringify(value));
      console.log(`✅ Data saved for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving data for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Xóa tất cả dữ liệu (dùng khi logout)
   */
  clearAllData() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ All data cleared');
  },

  /**
   * Lấy thông tin về thời gian load data
   */
  getDataLoadInfo() {
    return {
      isLoaded: this.isDataLoaded(),
      loadTime: localStorage.getItem(this.STORAGE_KEYS.dataLoadTime),
      keys: Object.keys(this.STORAGE_KEYS).filter(key => 
        localStorage.getItem(this.STORAGE_KEYS[key]) !== null
      )
    };
  },

  // ========== HELPER METHODS FOR SPECIFIC DATA ==========

  /**
   * Lấy danh sách accounts
   */
  getAccounts() {
    const data = this.getData('accounts');
    return data ? data.profile : [];
  },

  /**
   * Lấy danh sách products
   */
  getProducts() {
    const data = this.getData('products');
    return data ? data.product : [];
  },

  /**
   * Lấy danh sách categories
   */
  getCategories() {
    const data = this.getData('products');
    return data ? data.category : [];
  },

  /**
   * Lấy danh sách orders
   */
  getOrders() {
    const data = this.getData('orders');
    return data ? data.orders : [];
  },

  /**
   * Lấy danh sách blogs
   */
  getBlogs() {
    return this.getData('blogs') || [];
  },

  /**
   * Lấy danh sách promotions
   */
  getPromotions() {
    const data = this.getData('promotions');
    return data ? data.promotion : [];
  },

  /**
   * Cập nhật accounts
   */
  saveAccounts(accounts) {
    const data = this.getData('accounts') || {};
    data.profile = accounts;
    return this.saveData('accounts', data);
  },

  /**
   * Cập nhật products
   */
  saveProducts(products, categories = null) {
    const data = this.getData('products') || {};
    data.product = products;
    if (categories) data.category = categories;
    return this.saveData('products', data);
  },

  /**
   * Cập nhật orders
   */
  saveOrders(orders) {
    const data = { orders };
    return this.saveData('orders', data);
  },

  /**
   * Cập nhật blogs
   */
  saveBlogs(blogs) {
    return this.saveData('blogs', blogs);
  },

  /**
   * Cập nhật promotions
   */
  savePromotions(promotions) {
    const data = { promotion: promotions };
    return this.saveData('promotions', data);
  }
};

// Export để sử dụng ở các file khác
window.DataManager = DataManager;