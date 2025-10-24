document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const blogId = parseInt(params.get("id")) || 1;

<<<<<<< HEAD
  fetch("blogs.json")
=======
  fetch("../../dataset/blogs.json")
>>>>>>> 3a61038bf8eb4c62351af2a6cdfaf9b8767ab9e8
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
<<<<<<< HEAD
      img.src = blog.image;
      img.alt = blog.title;
      img.onerror = () => console.warn("⚠️ Ảnh không tìm thấy:", img.src);
=======
      // Sử dụng blog_banner.png mặc định vì tất cả blog đều dùng chung banner
      img.src = `../../../src/blog_banner.png`;
      img.alt = blog.title;
>>>>>>> 3a61038bf8eb4c62351af2a6cdfaf9b8767ab9e8

      // 🧾 Hiển thị nội dung blog
      const contentContainer = document.getElementById("blog-content");
      contentContainer.innerHTML = "";

      blog.content.forEach((section) => {
        const h2 = document.createElement("h2");
        h2.textContent = section.heading;
        h2.style.color = "#2e7d32";
        h2.style.marginTop = "25px";

        const p = document.createElement("p");
        // ✅ Dùng innerHTML để hiển thị đầy đủ định dạng & xuống dòng
        p.innerHTML = section.text;
        p.style.whiteSpace = "pre-line"; // ✅ giữ nguyên ngắt dòng nếu có
        p.style.lineHeight = "1.6";
        p.style.marginBottom = "20px";

        contentContainer.appendChild(h2);
        contentContainer.appendChild(p);
      });
    })
    .catch((err) => {
      console.error("❌ Lỗi:", err);
      document.getElementById("blog-content").innerHTML =
        "<h2>Error loading blog data ⚠️</h2>";
    });
});
