document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector('.form-control[placeholder="Seach product"]');
  
  // 🟢 Khi người dùng nhấn Enter để tìm kiếm
  if (searchInput) {
    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const keyword = searchInput.value.trim();
        if (keyword !== "") {
          localStorage.setItem("searchKeyword", keyword);
          window.location.href = "../pages/03_PRODUCT_SearchFilter.html";
        }
      }
    });
  }

  // 🟢 Nếu đang ở trang SearchFilter thì lấy keyword và lọc
  const currentPage = window.location.pathname.split("/").pop();
  if (currentPage === "03_PRODUCT_SearchFilter.html") {
    const keyword = localStorage.getItem("searchKeyword") || "";
    const searchBox = document.querySelector('.form-control[placeholder="Seach product"]');

    if (searchBox) searchBox.value = keyword;

    if (keyword) performSearch(keyword);
  }

  // 🟢 Hàm thực hiện tìm kiếm
  function performSearch(keyword) {
    const normalized = keyword.toLowerCase();
    const products = document.querySelectorAll(".product-homecard, .product-card");
    let found = 0;

    // Ẩn thông báo cũ (nếu có)
    const oldMessage = document.getElementById("no-result-message");
    if (oldMessage) oldMessage.remove();

    products.forEach(product => {
      const name = product.textContent.toLowerCase();
      if (name.includes(normalized)) {
        product.style.display = "block";
        found++;
      } else {
        product.style.display = "none";
      }
    });

    // 🟣 Nếu không tìm thấy kết quả
    if (found === 0) {
      const container = document.querySelector(".product-grid") || document.body;
      const message = document.createElement("p");
      message.id = "no-result-message";
      message.textContent = `Không tìm thấy sản phẩm nào cho "${keyword}"`;
      message.style.textAlign = "center";
      message.style.color = "black";
      message.style.marginTop = "50px";
      message.style.fontSize = "18px";
      container.appendChild(message);
    }
  }
});