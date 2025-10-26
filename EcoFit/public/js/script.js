document.addEventListener("DOMContentLoaded", () => {
  // Social icons interaction
  document.querySelectorAll(".social svg").forEach((icon) => {
    icon.addEventListener("click", () => {
      console.log("Social icon clicked");
    });
  });

  // Navigation links interaction
  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.getAttribute("href") === "#") {
      link.addEventListener("click", (e) => e.preventDefault());
    }
  });

  // Footer items interaction
  document.querySelectorAll(".footer ul li").forEach((item) => {
    item.addEventListener("click", () => {
      console.log("Footer item clicked:", item.textContent);
    });
  });

  // Filter buttons functionality
  const filterButtons = document.querySelectorAll(".filter-btn");
  const blogCards = document.querySelectorAll(".blog-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.textContent.trim();

      blogCards.forEach((card) => {
        if (filter === "All Tags") {
          card.style.display = "block";
        } else {
          const shouldShow = Math.random() > 0.3;
          card.style.display = shouldShow ? "block" : "none";
        }
      });
      console.log(`Filter applied: ${filter}`);
    });
  });

  // Sort dropdown functionality
  const sortSelect = document.querySelector(".sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const sortBy = sortSelect.value;
      console.log(`Sort by: ${sortBy}`);
      const blogGrid = document.querySelector(".blog-grid");
      blogGrid.style.opacity = "0.7";
      setTimeout(() => {
        blogGrid.style.opacity = "1";
        console.log(`Cards sorted by: ${sortBy}`);
      }, 300);
    });
  }

  // Read more buttons
  document.querySelectorAll(".read-more-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      window.location.href = `Blog_detail.html?id=${id}`;
    });
  });

  // Blog content headings interaction
  const blogHeadings = document.querySelectorAll(".blog-content h2");
  blogHeadings.forEach((heading) => {
    heading.addEventListener("click", () => {
      console.log(`Heading clicked: ${heading.textContent}`);
    });
    heading.style.cursor = "pointer";
  });

  // Pagination
  const numbersContainer = document.querySelector(".pagination-numbers");
  const prevBtn = document.querySelector(".pagination-btn.prev");
  const nextBtn = document.querySelector(".pagination-btn.next");
  let currentPage = 1;
  const totalPages = 30;
  const windowSize = 3;

  // Store original titles when page first loads
  const originalTitles = [];
  const blogGrid = document.querySelector(".blog-grid");
  if (blogGrid) {
    const cards = blogGrid.querySelectorAll(".blog-card");
    cards.forEach((card) => {
      const titleElem = card.querySelector(".card-title");
      if (titleElem) {
        originalTitles.push(titleElem.textContent.trim());
      }
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
    const cards = blogGrid.querySelectorAll(".blog-card");

    // Base titles without page numbers
    const baseTitles = [
      "Sustainable Living Tips for Beginners",
      "How to Reduce Plastic Waste at Home",
      "The Benefits of Organic Gardening",
      "Eco-Friendly Cleaning Products Guide",
      "Understanding Carbon Footprints",
      "Green Transportation Alternatives",
      "Composting: A Complete Beginner's Guide",
      "Renewable Energy for Your Home",
      "Sustainable Fashion Choices",
      "Zero Waste Kitchen Essentials",
      "DIY Natural Cleaning Recipes",
      "Sustainable Travel Tips",
      "Eco-Friendly Pet Care",
      "Green Building Materials",
      "Solar Power for Beginners",
      "Organic Vegetable Gardening",
      "Reducing Food Waste at Home",
      "Sustainable Fashion Brands",
      "Electric Vehicle Guide",
      "Composting in Small Spaces",
    ];

    // Update card titles
    cards.forEach((card, index) => {
      const titleElem = card.querySelector(".card-title");
      if (titleElem) {
        const titleIndex = (page - 1) * 3 + index;
        const baseTitle = baseTitles[titleIndex % baseTitles.length];

        // Only add page number if NOT on page 1
        if (page === 1) {
          titleElem.textContent = baseTitle;
        } else {
          titleElem.textContent = `${baseTitle}`;
        }
      }
    });

    // Update blog content headings (if they exist on the page)
    const blogHeadings = document.querySelectorAll(".blog-content h2");
    if (blogHeadings.length > 0) {
      const headingTexts = ["Headline 1", "Headline 2", "Headline 3"];
      blogHeadings.forEach((heading, index) => {
        if (page === 1) {
          heading.textContent = headingTexts[index];
        } else {
          heading.textContent = `${headingTexts[index]}`;
        }
      });
    }

    // Update blog content paragraphs
    const blogParagraphs = document.querySelectorAll(".blog-content p");
    if (blogParagraphs.length > 0) {
      const paragraphTexts = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Feugiat pretium, nisi sed id id sed orci, tempor. Pellentesque egestas odio ante, accumsan cursus. Fermentum in bibendum aliquet vel vitae vero ut nibh. Leo feugiat enim enim vulputate cursus eu nisi pharetra.",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.",
      ];
      blogParagraphs.forEach((paragraph, index) => {
        paragraph.textContent =
          paragraphTexts[index] ||
          `Paragraph ${index + 1} content for page ${page}`;
      });
    }
  }

  // Initialize pagination
  updatePagination();

  // Search functionality
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");

  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", () => {
      const query = searchInput.value.trim();
      if (query) {
        console.log("Searching for:", query);
      }
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          console.log("Searching for:", query);
        }
      }
    });
  }

  // Header actions
  document.querySelectorAll(".icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      console.log("Header icon clicked");
    });
  });

  // Cart button
  const cartBtn = document.querySelector(".cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      console.log("Cart clicked");
    });
  }

  // User avatar
  const userAvatar = document.querySelector(".user-avatar");
  if (userAvatar) {
    userAvatar.addEventListener("click", () => {
      console.log("User avatar clicked");
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Card hover animations
  const cards = document.querySelectorAll(".blog-card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-8px)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });
  });

  // Blog content hover animation
  const blogContent = document.querySelector(".blog-content");
  if (blogContent) {
    const paragraphs = blogContent.querySelectorAll("p");
    paragraphs.forEach((p) => {
      p.addEventListener("mouseenter", () => {
        p.style.backgroundColor = "#f8f9fa";
        p.style.transition = "background-color 0.3s ease";
      });
      p.addEventListener("mouseleave", () => {
        p.style.backgroundColor = "transparent";
      });
    });
  }
});
