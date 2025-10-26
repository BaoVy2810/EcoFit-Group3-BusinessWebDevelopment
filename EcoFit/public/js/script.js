document.addEventListener("DOMContentLoaded", () => {
  // Pagination
  const numbersContainer = document.querySelector(".pagination-numbers");
  const prevBtn = document.querySelector(".pagination-btn.prev");
  const nextBtn = document.querySelector(".pagination-btn.next");
  let currentPage = 1;
  const totalPages = 30;
  const windowSize = 3;

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

    // Generic data for pages 2+
    const genericTitles = [
      "Sustainable Living Tips for Beginners",
      "How to Reduce Plastic Waste at Home",
      "The Benefits of Organic Gardening",
      "Eco-Friendly Cleaning Products Guide",
      "Understanding Carbon Footprints",
      "Green Transportation Alternatives",
      "Composting: A Complete Beginner's Guide",
      "Renewable Energy for Your Home",
      "Sustainable Fashion Choices",
    ];

    const genericExcerpts = [
      "Discover simple ways to start your eco-friendly journey today.",
      "Practical tips for reducing single-use plastics in your daily life.",
      "Learn the benefits of growing your own organic vegetables.",
      "Find the best eco-friendly products for a cleaner home.",
      "Understand how your choices impact the environment.",
      "Explore sustainable ways to travel and commute.",
      "A step-by-step guide to starting your compost pile.",
      "Harness the power of renewable energy at home.",
      "Make sustainable fashion choices that look great.",
    ];

    const genericTags = [
      "Eco Habits",
      "Smart Shopping",
      "Community & Local",
      "Eco Habits",
      "Smart Shopping",
      "Sustainable Fashion",
      "Eco Habits",
      "Community & Local",
      "Greentech",
    ];

    const genericCategories = [
      "eco-habits",
      "smart-shopping",
      "community",
      "eco-habits",
      "smart-shopping",
      "fashion",
      "eco-habits",
      "community",
      "greentech",
    ];

    // Update each card
    cards.forEach((card, index) => {
      const titleElem = card.querySelector(".card-title");
      const imgElem = card.querySelector(".card-image img");
      const excerptElem = card.querySelector(".card-excerpt");
      const dateElem = card.querySelector(".card-date");
      const tagElem = card.querySelector(".blog-tag");
      const linkBtn = card.querySelector(".card-link");

      if (page === 1) {
        // RESTORE PAGE 1 ORIGINAL DATA
        if (page1OriginalData[index]) {
          const original = page1OriginalData[index];

          if (titleElem) titleElem.textContent = original.title;
          if (excerptElem) excerptElem.textContent = original.excerpt;
          if (dateElem) dateElem.textContent = original.date;
          if (tagElem) tagElem.textContent = original.tag;

          // IMPORTANT: Force reload original image
          if (imgElem && original.image) {
            imgElem.setAttribute("src", original.image);
            imgElem.src = original.image; // Double set to force refresh
          }

          card.setAttribute("data-id", original.dataId);
          card.setAttribute("data-category", original.category);

          if (linkBtn) {
            linkBtn.setAttribute("data-id", original.dataId);
          }
        }
      } else {
        // GENERATE NEW DATA FOR PAGE 2+
        const dataIndex =
          ((page - 2) * cards.length + index) % genericTitles.length;
        const newDataId = (page - 1) * cards.length + index + 1;

        // Update all attributes
        card.setAttribute("data-id", String(newDataId));
        card.setAttribute(
          "data-category",
          genericCategories[index % genericCategories.length]
        );

        if (linkBtn) {
          linkBtn.setAttribute("data-id", String(newDataId));
        }

        if (titleElem) {
          titleElem.textContent = `${genericTitles[dataIndex]}`;
        }

        // GENERATE NEW PLACEHOLDER IMAGE
        if (imgElem) {
          const colors = [
            "81c784/white",
            "66bb6a/white",
            "5cb85c/white",
            "4caf50/white",
            "43a047/white",
            "388e3c/white",
            "2e7d32/white",
            "1b5e20/white",
            "689f38/white",
          ];
          const colorIndex =
            ((page - 2) * cards.length + index) % colors.length;
          const placeholderNames = [
            "Eco+Tips",
            "Green+Life",
            "Organic+Farm",
            "Eco+Product",
            "Carbon+Free",
            "Green+Travel",
            "Smart+Compost",
            "Renewable+Energy",
            "Eco+Fashion",
          ];
          const placeholderText =
            placeholderNames[index % placeholderNames.length];
          const newSrc = `https://placehold.co/400x250/${colors[colorIndex]}?text=${placeholderText}`;

          imgElem.setAttribute("src", newSrc);
          imgElem.src = newSrc; // Force update
        }

        if (excerptElem) {
          excerptElem.textContent = genericExcerpts[dataIndex];
        }

        if (dateElem) {
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const day = (((page - 1) * 3 + index + 1) % 28) + 1;
          const monthIndex = ((page - 1) * 2 + index) % 12;
          dateElem.textContent = `${day} ${months[monthIndex]} 2025`;
        }

        if (tagElem) {
          tagElem.textContent = genericTags[index % genericTags.length];
        }
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
