// Newsletter Subscribe Functionality
document.addEventListener("DOMContentLoaded", () => {
  const newsletterForm = document.querySelector(".newsletter__form");
  const emailInput = newsletterForm.querySelector("input[type='email']");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("❌ Please enter a valid email address!");
      emailInput.focus();
      return;
    }

    // Lưu email vào localStorage (hoặc có thể gửi API)
    let subscribedList = JSON.parse(localStorage.getItem("newsletterList")) || [];
    if (subscribedList.includes(email)) {
      alert("⚠️ You have already subscribed!");
    } else {
      subscribedList.push(email);
      localStorage.setItem("newsletterList", JSON.stringify(subscribedList));
      alert("✅ Thank you for subscribing to EcoFit updates!");
    }

    // Reset form
    emailInput.value = "";
  });
});
