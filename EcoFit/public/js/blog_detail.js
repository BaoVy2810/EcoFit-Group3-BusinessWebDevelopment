document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const blogId = parseInt(params.get("id")) || 1;

  // 🎨 Bộ sưu tập ảnh Unsplash cho từng section của blog
  // Format: { blogId: { sectionIndex: imageUrl } }
  const sectionImages = {
    1: {
      // Blog: 5 Easy Ways to Go Plastic-Free at Home
      0: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80", // Reusable containers
      1: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80", // Kitchen storage
      2: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80", // Reusable bottles
      3: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&q=80", // Natural cleaning
    },
    2: {
      // Blog: How to Choose Eco-Friendly Products
      0: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80", // Product lifecycle
      1: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80", // Labels and certifications
      2: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80", // Green shopping
    },
    3: {
      // Blog: Meet Our Green Partners
      0: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80", // Partnership/collaboration
      1: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80", // Sustainable brands
      2: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=800&q=80", // Local/global makers
    },
    4: {
      // Blog: The Green Routine
      0: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80", // Morning coffee/breakfast
      1: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80", // Midday shopping/reusable bags
      2: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80", // Evening home/relaxation
    },
    5: {
      // Blog: The Truth About Greenwashing
      0: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80", // Greenwashing intro
      1: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80", // Fake eco claims
      2: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80", // Genuine sustainability
    },
    6: {
      // Blog: Sustainable Fashion
      0: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80", // Fashion industry
      1: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80", // Clothing materials
      2: "https://images.unsplash.com/photo-1558769132-cb1aea8f5e6c?w=800&q=80", // Sustainable wardrobe
    },
    7: {
      // Blog: Zero-Waste Living
      0: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80", // Waste problem
      1: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80", // Simple swaps
      2: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80", // Zero-waste lifestyle
    },
    8: {
      // Blog: Power of Local
      0: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80", // Farmers market
      1: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&q=80", // Local food
      2: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", // Shop local
    },
    9: {
      // Blog: AI for Greener World
      0: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80", // AI technology
      1: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80", // Energy/sustainability
      2: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80", // Tech future
    },
  };

  fetch("../../dataset/blogs.json")
    .then((response) => {
      if (!response.ok) throw new Error("Không thể load file Blogs.json");
      return response.json();
    })
    .then((data) => {
      const blog = data.find((item) => item.id === blogId);

      if (!blog) {
        document.getElementById("blog-content").innerHTML =
          "<p>Blog not found 😢</p>";
        return;
      }

      // 🟢 Cập nhật tiêu đề và ngày đăng
      document.getElementById("blog-title").textContent = blog.title;
      document.getElementById("blog-date").textContent = blog.date;

      // 🖼️ Cập nhật hình ảnh blog
      const img = document.getElementById("blog-image");

      if (blog.image && blog.image.trim() !== "") {
        img.src = blog.image; // nếu blog có ảnh riêng trong JSON
      } else {
        img.src = "../../dataset/banner/blog_banner.png"; // banner mặc định
      }

      img.alt = blog.title;
      img.onerror = () => {
        console.warn("⚠️ Ảnh không tìm thấy:", img.src);
        // Fallback to default banner if image fails to load
        img.src = "../../dataset/banner/blog_banner.png";
      };

      // 🧾 Hiển thị nội dung blog với hình ảnh minh họa
      const contentContainer = document.getElementById("blog-content");
      contentContainer.innerHTML = "";

      blog.content.forEach((section, index) => {
        // Nếu section có heading, tạo h2
        if (section.heading) {
          const h2 = document.createElement("h2");
          h2.textContent = section.heading;
          h2.style.color = "#2e7d32";
          h2.style.marginTop = "40px";
          h2.style.marginBottom = "20px";
          h2.style.fontWeight = "700";
          contentContainer.appendChild(h2);
        }

        // 🎨 Thêm hình ảnh minh họa nếu có
        if (sectionImages[blogId] && sectionImages[blogId][index]) {
          const imgWrapper = document.createElement("div");
          imgWrapper.style.cssText =
            "margin: 25px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);";

          const sectionImg = document.createElement("img");
          sectionImg.src = sectionImages[blogId][index];
          sectionImg.alt = section.heading || "Blog illustration";
          sectionImg.style.cssText =
            "width: 100%; height: auto; display: block; object-fit: cover; max-height: 400px;";
          sectionImg.loading = "lazy"; // Lazy loading for performance

          // Fallback nếu ảnh không load được
          sectionImg.onerror = () => {
            console.warn("⚠️ Section image failed to load:", sectionImg.src);
            imgWrapper.style.display = "none";
          };

          imgWrapper.appendChild(sectionImg);
          contentContainer.appendChild(imgWrapper);
        }

        // Nội dung text
        const p = document.createElement("p");
        p.innerHTML = section.text;
        p.style.whiteSpace = "pre-line";
        p.style.lineHeight = "1.8";
        p.style.marginBottom = "30px";
        p.style.textAlign = "justify";
        p.style.color = "#333";
        contentContainer.appendChild(p);
      });
    })
    .catch((err) => {
      console.error("❌ Lỗi:", err);
      document.getElementById("blog-content").innerHTML =
        "<h2>Error loading blog data ⚠️</h2>";
    });
});
