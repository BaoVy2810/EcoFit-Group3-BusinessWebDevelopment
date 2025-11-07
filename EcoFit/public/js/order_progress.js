document.addEventListener("DOMContentLoaded", () => {
  const progressContainer = document.querySelector(".order-progress");
  if (!progressContainer) return;

  let currentStep = 1;
  const totalSteps = 5;
  const stepDelay = 3000;

  function updateProgress(step) {
    const steps = progressContainer.querySelectorAll(".step");

    steps.forEach((stepElement, index) => {
      const circle = stepElement.querySelector(".circle");
      const stepNumber = index + 1;
      stepElement.classList.remove("done", "active");

      if (stepNumber < step) {
        stepElement.classList.add("done");
        circle.innerHTML = "&#10003;";
      } else if (stepNumber === step) {
        stepElement.classList.add("active");
        circle.textContent = stepNumber;
      } else {
        circle.textContent = stepNumber;
      }
    });
    if (step === totalSteps) {
      steps.forEach((el) => {
        el.classList.add("done");
        el.querySelector(".circle").innerHTML = "&#10003;";
      });
    }
    progressContainer.setAttribute("data-step", step);
  }
  updateProgress(currentStep);
  const progressInterval = setInterval(() => {
    currentStep++;
    if (currentStep <= totalSteps) {
      updateProgress(currentStep);
    } else {
      clearInterval(progressInterval);
      console.log("✅ Order tracking completed!");
    }
  }, stepDelay);
  window.orderProgressInterval = progressInterval;
});

function injectProgressStyles() {
  if (document.getElementById("order-progress-styles")) return;

  const style = document.createElement("style");
  style.id = "order-progress-styles";
  style.textContent = `
    .order-progress {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 30px 0;
      position: relative;
      padding: 0 20px;
    }
    .order-progress::before {
      content: '';
      position: absolute;
      top: 25px;
      left: 20px;
      right: 20px;
      height: 4px;
      background: #ddd;
      z-index: 0;
      transition: background 0.5s ease;
    }
    .order-progress .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 1;
      position: relative;
      transition: all 0.3s ease;
    }
    .order-progress .step .circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
      background: #ccc;
      color: #fff;
      margin-bottom: 10px;
      transition: all 0.3s ease;
    }
    .order-progress .step .label {
      font-size: 12px;
      font-weight: 600;
      color: #999;
      text-align: center;
      transition: color 0.3s ease;
    }
    .order-progress .step.done .circle {
      background: linear-gradient(135deg, #69bd76 0%, #3da547 100%);
      animation: scaleIn 0.3s ease;
    }
    .order-progress .step.done .label {
      color: #3da547;
    }
    .order-progress .step.active .circle {
      background: #ffc107;
      animation: pulse 1.5s ease infinite;
    }
    .order-progress .step.active .label {
      color: #ffc107;
      font-weight: 700;
    }
    @keyframes scaleIn {
      0% { transform: scale(0.8); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 10px rgba(255, 193, 7, 0);
      }
    }
    .order-progress[data-step="1"]::before {
      background: linear-gradient(to right, #69bd76 0%, #3da547 0%, #ddd 0%);
    }
    .order-progress[data-step="2"]::before {
      background: linear-gradient(to right, #69bd76 25%, #3da547 25%, #ddd 25%);
    }
    .order-progress[data-step="3"]::before {
      background: linear-gradient(to right, #69bd76 50%, #3da547 50%, #ddd 50%);
    }
    .order-progress[data-step="4"]::before {
      background: linear-gradient(to right, #69bd76 75%, #3da547 75%, #ddd 75%);
    }
    .order-progress[data-step="5"]::before {
      background: linear-gradient(135deg, #69bd76 0%, #3da547 100%);
    }
  `;
  document.head.appendChild(style);
}
injectProgressStyles();