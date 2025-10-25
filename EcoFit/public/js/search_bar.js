document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector('.form-control[placeholder="Seach product"]');
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
  const currentPage = window.location.pathname.split("/").pop();
  if (currentPage === "03_PRODUCT_SearchFilter.html") {
    const keyword = localStorage.getItem("searchKeyword") || "";
    const searchBox = document.querySelector('.form-control[placeholder="Seach product"]');
    if (searchBox) searchBox.value = keyword;
    if (keyword) performSearch(keyword);
  }
  function performSearch(keyword) {
    const normalized = keyword.toLowerCase();
    const products = document.querySelectorAll(".product-homecard, .product-card");
    let found = 0;

    products.forEach(product => {
      const name = product.textContent.toLowerCase();
      if (name.includes(normalized)) {
        product.style.display = "block";
        found++;
      } else {
        product.style.display = "none";
      }
    });
    if (found === 0) {
      const container = document.querySelector(".product-grid") || document.body;
      const message = document.createElement("p");
      message.textContent = `No results found for "${keyword}"`;
      message.style.textAlign = "center";
      message.style.color = "black";
      message.style.marginTop = "50px";
      container.appendChild(message);
    }
  }
});