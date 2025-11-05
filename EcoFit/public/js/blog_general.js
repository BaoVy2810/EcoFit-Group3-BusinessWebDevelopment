/**
 * blog_general.js
 * Pagination updated: default to single page shown.
 * If you later set more pages (via data-total-pages on the numbers container
 * or by calling window.setBlogTotalPages(n)) JS will render numbers and enable Next/Prev.
 */

document.addEventListener("DOMContentLoaded", () => {
  const blogGrid = document.querySelector(".blog-grid");
  const numbersContainer = document.getElementById("pagination-numbers");
  const prevBtn = document.getElementById("pagination-prev");
  const nextBtn = document.getElementById("pagination-next");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const sortSelect = document.querySelector(".sort-select");
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");

  // current page state
  let currentPage = 1;

  // totalPages: default read from data attribute (fallback to 1)
  function readInitialTotalPages() {
    if (!numbersContainer) return 1;
    const attr = numbersContainer.getAttribute("data-total-pages");
    const n = Number(attr);
    return Number.isFinite(n) && n >= 1 ? Math.max(1, Math.floor(n)) : 1;
  }
  let totalPages = readInitialTotalPages();

  // Cache page-1 original data for restore
  const page1OriginalData = [];
  const blogCards = blogGrid
    ? Array.from(blogGrid.querySelectorAll(".blog-card"))
    : [];

  if (blogGrid) {
    blogCards.forEach((card, idx) => {
      const titleElem = card.querySelector(".card-title");
      const imgElem = card.querySelector(".card-image img");
      const excerptElem = card.querySelector(".card-excerpt");
      const dateElem = card.querySelector(".card-date");
      const tagElem = card.querySelector(".blog-tag");
      const dataId = card.getAttribute("data-id") || String(idx + 1);

      page1OriginalData.push({
        title: titleElem ? titleElem.textContent.trim() : "",
        image: imgElem ? imgElem.getAttribute("src") : "",
        excerpt: excerptElem ? excerptElem.textContent.trim() : "",
        date: dateElem ? dateElem.textContent.trim() : "",
        tag: tagElem ? tagElem.textContent.trim() : "",
        category: card.getAttribute("data-category") || "",
        dataId,
      });
    });
  }

  // builders
  function buildNumberButton(page, isActive = false) {
    const btn = document.createElement("button");
    btn.className = "pagination-number" + (isActive ? " active" : "");
    btn.textContent = String(page);
    btn.dataset.page = String(page);
    return btn;
  }

  function buildDots() {
    const span = document.createElement("span");
    span.className = "pagination-dots";
    span.textContent = "...";
    return span;
  }

  // Update pagination UI according to totalPages and currentPage
  function updatePagination() {
    if (!numbersContainer) return;

    // clamp currentPage
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // Prev/Next state
    if (prevBtn) {
      prevBtn.disabled = currentPage === 1 || totalPages === 1;
      prevBtn.setAttribute(
        "aria-disabled",
        prevBtn.disabled ? "true" : "false"
      );
    }
    if (nextBtn) {
      nextBtn.disabled = currentPage === totalPages || totalPages === 1;
      nextBtn.setAttribute(
        "aria-disabled",
        nextBtn.disabled ? "true" : "false"
      );
    }

    // If only one page, render single active button and exit
    numbersContainer.innerHTML = "";
    if (totalPages === 1) {
      numbersContainer.appendChild(buildNumberButton(1, true));
      return;
    }

    // If more than one page, render smart pagination:
    const SMALL_THRESHOLD = 7;
    if (totalPages <= SMALL_THRESHOLD) {
      for (let p = 1; p <= totalPages; p++) {
        numbersContainer.appendChild(buildNumberButton(p, p === currentPage));
      }
      return;
    }

    // Many pages pattern
    const nearStart = currentPage <= 4;
    const nearEnd = currentPage >= totalPages - 3;

    numbersContainer.appendChild(buildNumberButton(1, currentPage === 1));

    if (nearStart) {
      for (let p = 2; p <= 4; p++) {
        numbersContainer.appendChild(buildNumberButton(p, p === currentPage));
      }
      numbersContainer.appendChild(buildDots());
      numbersContainer.appendChild(
        buildNumberButton(totalPages, currentPage === totalPages)
      );
      return;
    }

    if (nearEnd) {
      numbersContainer.appendChild(buildDots());
      for (let p = totalPages - 3; p <= totalPages; p++) {
        numbersContainer.appendChild(buildNumberButton(p, p === currentPage));
      }
      return;
    }

    // middle
    numbersContainer.appendChild(buildDots());
    for (let p = currentPage - 1; p <= currentPage + 1; p++) {
      numbersContainer.appendChild(buildNumberButton(p, p === currentPage));
    }
    numbersContainer.appendChild(buildDots());
    numbersContainer.appendChild(
      buildNumberButton(totalPages, currentPage === totalPages)
    );
  }

  // Expose a simple API to change total pages dynamically
  window.setBlogTotalPages = (n) => {
    const nn = Number(n);
    if (!Number.isFinite(nn) || nn < 1) return false;
    totalPages = Math.max(1, Math.floor(nn));
    // persist to DOM attribute so any server-side or later code sees it
    if (numbersContainer)
      numbersContainer.setAttribute("data-total-pages", String(totalPages));
    // If currentPage now > totalPages, clamp
    if (currentPage > totalPages) currentPage = totalPages;
    updatePagination();
    loadPageContent(currentPage);
    return true;
  };

  // Simulated page load (small transition)
  function simulatePageLoad(page) {
    if (!blogGrid) return;
    blogGrid.style.transition = "transform 0.32s ease, opacity 0.32s ease";
    blogGrid.style.opacity = "0.5";
    blogGrid.style.transform = "translateY(10px)";

    setTimeout(() => {
      loadPageContent(page);
      blogGrid.style.opacity = "1";
      blogGrid.style.transform = "translateY(0)";
    }, 300);
  }

  // Load page content: page 1 restores originals; page >=2 hides cards (blank pages)
  function loadPageContent(page) {
    if (!blogGrid) return;
    const cards = Array.from(blogGrid.querySelectorAll(".blog-card"));

    cards.forEach((card, index) => {
      const titleElem = card.querySelector(".card-title");
      const imgElem = card.querySelector(".card-image img");
      const excerptElem = card.querySelector(".card-excerpt");
      const dateElem = card.querySelector(".card-date");
      const tagElem = card.querySelector(".blog-tag");
      const linkBtn = card.querySelector(".card-link");

      if (page === 1) {
        card.style.display = "block";
        const original = page1OriginalData[index];
        if (original) {
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

          if (linkBtn) linkBtn.setAttribute("data-id", original.dataId);
        }
      } else {
        // page >= 2: blank/hidden
        card.style.display = "none";
      }
    });
  }

  // Event handlers
  if (numbersContainer) {
    numbersContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.classList.contains("pagination-number")) {
        const page = Number(target.dataset.page || target.textContent || "1");
        if (
          !Number.isNaN(page) &&
          page >= 1 &&
          page <= totalPages &&
          page !== currentPage
        ) {
          currentPage = page;
          updatePagination();
          simulatePageLoad(currentPage);
        }
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage -= 1;
        updatePagination();
        simulatePageLoad(currentPage);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        updatePagination();
        simulatePageLoad(currentPage);
      }
    });
  }

  // Card clicks delegation
  if (blogGrid) {
    blogGrid.addEventListener("click", (e) => {
      const linkBtn = e.target.closest(".card-link");
      if (linkBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = linkBtn.getAttribute("data-id");
        if (id) window.location.href = `15_BLOG_DETAIL.html?id=${id}`;
        return;
      }
      const card = e.target.closest(".blog-card");
      if (card) {
        const id = card.getAttribute("data-id");
        if (id) window.location.href = `15_BLOG_DETAIL.html?id=${id}`;
      }
    });
  }

  // Filters
  if (filterButtons && filterButtons.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.getAttribute("data-filter");
        blogCards.forEach((card) => {
          if (
            filter === "all" ||
            card.getAttribute("data-category") === filter
          ) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  }

  // Sort select visual effect
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      if (blogGrid) {
        blogGrid.style.opacity = "0.7";
        setTimeout(() => (blogGrid.style.opacity = "1"), 300);
      }
    });
  }

  // Search (console)
  if (searchBtn && searchInput) {
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
  loadPageContent(currentPage);
});
