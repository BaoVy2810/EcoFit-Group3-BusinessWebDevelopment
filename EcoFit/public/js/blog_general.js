document.addEventListener("DOMContentLoaded", () => {
  // Pagination
  const numbersContainer = document.querySelector(".pagination-numbers");
  const prevBtn = document.querySelector(".pagination-btn.prev");
  const nextBtn = document.querySelector(".pagination-btn.next");
  let currentPage = 1;
  const totalPages = 30;
  const windowSize = 3;
  const postsPerPage = 9; // số bài mỗi trang
  let allPagesData = []; // chứa toàn bộ dữ liệu (dùng cho sorting)

  // Store ONLY page 1 original data ONCE at load
  const page1OriginalData = [];
  const blogGrid = document.querySelector(".blog-grid");

  if (blogGrid) {
    const cards = blogGrid.querySelectorAll(".blog-card");
    cards.forEach((card) => {
      const titleElem = card.querySelector(".card-title");
      const imgElem = card.querySelector(".card-image img");
      const excerptElem = card.querySelector(".card-excerpt");
      const dateElem = card.querySelector(".card-date");
      const tagElem = card.querySelector(".blog-tag");
      const dataId = card.getAttribute("data-id");

      page1OriginalData.push({
        title: titleElem ? titleElem.textContent.trim() : "",
        image: imgElem ? imgElem.getAttribute("src") : "",
        excerpt: excerptElem ? excerptElem.textContent.trim() : "",
        date: dateElem ? dateElem.textContent.trim() : "",
        tag: tagElem ? tagElem.textContent.trim() : "",
        category: card.getAttribute("data-category") || "",
        dataId: dataId || String(Array.from(cards).indexOf(card) + 1),
      });
      allPagesData.push({ ...page1OriginalData[page1OriginalData.length - 1] });
    });
  }

  function buildNumberButton(page, isActive = false) {
    const btn = document.createElement("button");
    btn.className = "pagination-number" + (isActive ? " active" : "");
    btn.textContent = String(page);
    btn.dataset.page = String(page);
    return btn;
  }

  function updatePagination() {
    if (!numbersContainer) return;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    numbersContainer.innerHTML = "";
    const start = currentPage;
    const end = Math.min(totalPages, start + windowSize - 1);

    for (let p = start; p <= end; p++) {
      numbersContainer.appendChild(buildNumberButton(p, p === start));
    }

    if (end < totalPages - 1) {
      const dots = document.createElement("span");
      dots.className = "pagination-dots";
      dots.textContent = "...";
      numbersContainer.appendChild(dots);
      numbersContainer.appendChild(buildNumberButton(totalPages));
    } else if (end === totalPages - 1) {
      numbersContainer.appendChild(buildNumberButton(totalPages));
    }

    prevBtn && (prevBtn.disabled = currentPage === 1);
    nextBtn && (nextBtn.disabled = currentPage === totalPages);
  }

  numbersContainer &&
    numbersContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.classList.contains("pagination-number")) {
        const page = Number(target.dataset.page || target.textContent || "1");
        if (!Number.isNaN(page)) {
          currentPage = page;
          updatePagination();
          simulatePageLoad(currentPage);
        }
      }
    });

  prevBtn &&
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage -= 1;
        updatePagination();
        simulatePageLoad(currentPage);
      }
    });

  nextBtn &&
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        updatePagination();
        simulatePageLoad(currentPage);
      }
    });

  function simulatePageLoad(page) {
    const blogGrid = document.querySelector(".blog-grid");
    if (!blogGrid) return;

    blogGrid.style.opacity = "0.5";
    blogGrid.style.transform = "translateY(10px)";

    setTimeout(() => {
      loadPageContent(page);
      blogGrid.style.opacity = "1";
      blogGrid.style.transform = "translateY(0)";
    }, 300);
  }

  function loadPageContent(page) {
    const blogGrid = document.querySelector(".blog-grid");
    if (!blogGrid) return;

    const cards = blogGrid.querySelectorAll(".blog-card");

    cards.forEach((card, index) => {
      // Lấy các phần tử bên trong thẻ bài viết
      const titleElem = card.querySelector(".card-title");
      const imgElem = card.querySelector(".card-image img");
      const excerptElem = card.querySelector(".card-excerpt");
      const dateElem = card.querySelector(".card-date");
      const tagElem = card.querySelector(".blog-tag");
      const linkBtn = card.querySelector(".card-link");

      if (page === 1) {
        // --- TRANG 1: KHÔI PHỤC DỮ LIỆU GỐC VÀ HIỂN THỊ THẺ ---
        card.style.display = "block"; // Hiển thị thẻ bài viết

        if (page1OriginalData[index]) {
          const original = page1OriginalData[index];

          if (titleElem) titleElem.textContent = original.title;
          if (excerptElem) excerptElem.textContent = original.excerpt;
          if (dateElem) dateElem.textContent = original.date;
          if (tagElem) tagElem.textContent = original.tag;

          if (imgElem && original.image) {
            imgElem.setAttribute("src", original.image);
            imgElem.src = original.image;
          }

          card.setAttribute("data-id", original.dataId);
          card.setAttribute("data-category", original.category);

          if (linkBtn) {
            linkBtn.setAttribute("data-id", original.dataId);
          }
        }
      } else {
        // --- TRANG 2 TRỞ ĐI: ẨN HẾT CÁC THẺ BÀI VIẾT (TRANG TRẮNG) ---
        card.style.display = "none";
      }
    });
  }

  // Handle card clicks with event delegation (works for dynamically updated cards)
  if (blogGrid) {
    blogGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".blog-card");
      const linkBtn = e.target.closest(".card-link");

      if (linkBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = linkBtn.getAttribute("data-id");
        if (id) {
          console.log(`Navigating to blog detail: ${id}`);
          window.location.href = `15_BLOG_DETAIL.html?id=${id}`;
        }
        return;
      }

      if (card) {
        const id = card.getAttribute("data-id");
        if (id) {
          console.log(`Navigating to blog detail: ${id}`);
          window.location.href = `15_BLOG_DETAIL.html?id=${id}`;
        }
      }
    });
  }

  // Filter buttons functionality
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");

      const cards = document.querySelectorAll(".blog-card");
      cards.forEach((card) => {
        if (filter === "all" || card.getAttribute("data-category") === filter) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  // Sort dropdown
  const sortSelect = document.querySelector(".sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const blogGrid = document.querySelector(".blog-grid");
      if (blogGrid) {
        blogGrid.style.opacity = "0.7";
        setTimeout(() => {
          blogGrid.style.opacity = "1";
        }, 300);
      }
    });
  }

  // Card hover animations
  if (blogGrid) {
    blogGrid.addEventListener(
      "mouseenter",
      (e) => {
        const card = e.target.closest(".blog-card");
        if (card) {
          card.style.transform = "translateY(-8px)";
          card.style.transition = "transform 0.3s ease";
        }
      },
      true
    );

    blogGrid.addEventListener(
      "mouseleave",
      (e) => {
        const card = e.target.closest(".blog-card");
        if (card) {
          card.style.transform = "translateY(0)";
        }
      },
      true
    );
  }

  // Search functionality
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", () => {
      const query = searchInput.value.trim();
      if (query) console.log("Searching:", query);
    });
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) console.log("Searching:", query);
      }
    });
  }

  // Initialize
  updatePagination();
});
