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
      // Remove active class from all buttons
      filterButtons.forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button
      btn.classList.add("active");

      const filter = btn.textContent.trim();

      // Filter blog cards
      blogCards.forEach((card) => {
        if (filter === "All Tags") {
          card.style.display = "block";
        } else {
          // For demo purposes, show/hide cards randomly based on filter
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

      // Simulate sorting animation
      const blogGrid = document.querySelector(".blog-grid");
      blogGrid.style.opacity = "0.7";

      setTimeout(() => {
        // In a real app, you would reorder the cards here
        blogGrid.style.opacity = "1";
        console.log(`Cards sorted by: ${sortBy}`);
      }, 300);
    });
  }

  // Read more buttons
  document.querySelectorAll(".read-more-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      console.log("Read more clicked");
      // In a real app, this would navigate to the full blog post
    });
  });

  // Blog content headings interaction
  const blogHeadings = document.querySelectorAll(".blog-content h2");
  blogHeadings.forEach((heading) => {
    heading.addEventListener("click", () => {
      console.log(`Heading clicked: ${heading.textContent}`);
      // In a real app, this could scroll to that section or highlight it
    });

    // Make headings look clickable
    heading.style.cursor = "pointer";
  });

  // Pagination functionality
  const paginationNumbers = document.querySelectorAll(".pagination-number");
  const prevBtn = document.querySelector(".pagination-btn.prev");
  const nextBtn = document.querySelector(".pagination-btn.next");

  let currentPage = 1;
  const totalPages = 30;

  // Update pagination buttons
  function updatePagination() {
    // Calculate which group of 5 pages to show
    const groupSize = 5;
    const currentGroup = Math.floor((currentPage - 1) / groupSize);
    const startPage = currentGroup * groupSize + 1;
    const endPage = Math.min(totalPages, startPage + 4);

    // Set pagination numbers for current group
    paginationNumbers.forEach((btn, index) => {
      const pageNum = startPage + index;
      if (pageNum <= totalPages) {
        btn.textContent = pageNum.toString();
        btn.style.display = "flex";
        btn.classList.remove("active");
      } else {
        btn.style.display = "none";
      }
    });

    // Set active page
    const activeIndex = currentPage - startPage;
    if (
      paginationNumbers[activeIndex] &&
      paginationNumbers[activeIndex].style.display !== "none"
    ) {
      paginationNumbers[activeIndex].classList.add("active");
    }

    // Update prev/next buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  // Handle pagination number clicks
  paginationNumbers.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      // Calculate the actual page number based on current group and button index
      const groupSize = 5;
      const currentGroup = Math.floor((currentPage - 1) / groupSize);
      const startPage = currentGroup * groupSize + 1;
      const pageNum = startPage + index;

      if (pageNum <= totalPages) {
        currentPage = pageNum;

        updatePagination();
        console.log(`Page ${currentPage} selected`);

        // Simulate page loading
        simulatePageLoad(currentPage);
      }
    });
  });

  // Handle prev button
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      updatePagination();
      console.log(`Previous page: ${currentPage}`);
      simulatePageLoad(currentPage);
    }
  });

  // Handle next button
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      updatePagination();
      console.log(`Next page: ${currentPage}`);
      simulatePageLoad(currentPage);
    }
  });

  // Simulate page loading for different pages
  function simulatePageLoad(page) {
    const blogGrid = document.querySelector(".blog-grid");

    // Add loading effect
    blogGrid.style.opacity = "0.5";
    blogGrid.style.transform = "translateY(10px)";

    setTimeout(() => {
      // Simulate different content for each page
      loadPageContent(page);
      blogGrid.style.opacity = "1";
      blogGrid.style.transform = "translateY(0)";
    }, 300);
  }

  // Load content for specific page
  function loadPageContent(page) {
    const blogGrid = document.querySelector(".blog-grid");
    const cards = blogGrid.querySelectorAll(".blog-card");

    // Update blog content headings based on page
    const blogHeadings = document.querySelectorAll(".blog-content h2");
    if (blogHeadings.length > 0) {
      const headingTexts = ["Headline 1", "Headline 2", "Headline 3"];
      blogHeadings.forEach((heading, index) => {
        heading.textContent = `${headingTexts[index]} - Page ${page}`;
      });
    }

    // Update blog content paragraphs based on page
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

    // Simulate different blog posts for each page
    cards.forEach((card, index) => {
      // Generate titles dynamically for 99 pages
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

      const titles = [];
      for (let page = 1; page <= 30; page++) {
        for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
          titles.push(
            `${
              baseTitles[(page * 3 + cardIndex) % baseTitles.length]
            } - Page ${page}`
          );
        }
      }

      const titleIndex = (page - 1) * 3 + index;
      const title = titles[titleIndex] || `Blog Post ${titleIndex + 1}`;
      card.querySelector(".card-title").textContent = title;
    });
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
        // In a real app, this would perform search
      }
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          console.log("Searching for:", query);
          // In a real app, this would perform search
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
      // In a real app, this would open cart
    });
  }

  // User avatar
  const userAvatar = document.querySelector(".user-avatar");
  if (userAvatar) {
    userAvatar.addEventListener("click", () => {
      console.log("User avatar clicked");
      // In a real app, this would open user menu
    });
  }

  // Smooth scroll for better UX (optional)
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

  // Add some interactive animations
  const cards = document.querySelectorAll(".blog-card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-8px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });
  });

  // Blog content sections hover animation
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
// READ MORE BUTTONS → Chuyển sang trang chi tiết
document.querySelectorAll(".read-more-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const id = e.target.getAttribute("data-id");
    // Điều hướng sang Blog_detail.html và gửi id qua URL
    window.location.href = `Blog_detail.html?id=${id}`;
  });
});


