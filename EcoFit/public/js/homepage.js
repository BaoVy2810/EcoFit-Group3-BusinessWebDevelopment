//HERO BANNER SLIDER FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {
  const heroSection = document.querySelector(".hero");
  const heroText = document.querySelector(".hero__bottom-left p");
  const leftBtn = document.querySelectorAll(".hero__arrow")[0];
  const rightBtn = document.querySelectorAll(".hero__arrow")[1];

  // Dữ liệu slide
  const slides = [
    {
      img: "../images/hero_windfarm.png",
      text: "Sustainable living starts with smart choices."
    },
    {
      img: "../images/hero_solar.png",
      text: "Harnessing the power of the sun for a cleaner tomorrow."
    },
    {
      img: "../images/hero_recycling.png",
      text: "Turning waste into opportunity — one product at a time."
    }
  ];

  let currentSlide = 0;

  // Hàm đổi slide
  function updateHero() {
    const slide = slides[currentSlide];
    heroSection.style.backgroundImage = `url('${slide.img}')`;
    heroText.textContent = slide.text;

    // Hiệu ứng mờ mượt
    heroSection.style.transition = "background-image 0.8s ease-in-out";
  }

  // Sự kiện bấm nút
  leftBtn.addEventListener("click", () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateHero();
  });

  rightBtn.addEventListener("click", () => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateHero();
  });

  // Khởi tạo slide đầu tiên
  updateHero();
});
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
