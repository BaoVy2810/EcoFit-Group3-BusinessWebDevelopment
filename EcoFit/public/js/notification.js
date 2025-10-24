fetch("../../dataset/notification.json")
  .then((res) => res.json())
  .then((data) => renderSections(data))
  .catch((err) => console.error(err));

function renderSections(data) {
  const container = document.getElementById("notificationContainer");
  data.sections.forEach((section) => {
    const div = document.createElement("div");
    div.className = "section-card";
    div.innerHTML = `
      <div class="section-head">
        <h5>${section.title}</h5>
        <a href="#" class="text-success small toggle-all" data-id="${
          section.id
        }">Toggle all</a>
      </div>
      <p class="text-muted mb-2">${section.subtitle || ""}</p>
      <div>
        ${section.items
          .map(
            (item) => `
          <div class="form-check">
            <input class="form-check-input notif-item" type="checkbox" id="${item.id}">
            <label class="form-check-label fw-semibold" for="${item.id}">${item.name}</label>
            <div class="desc">${item.desc}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
    container.appendChild(div);
  });

  // Save bar
  const save = document.createElement("div");
  save.className = "save-bar";
  save.innerHTML = `<button class="save-btn" id="saveBtn">Update Email Notifications</button>`;
  container.appendChild(save);

  // Toggle all
  document.querySelectorAll(".toggle-all").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = e.target.dataset.id;
      const group = document.querySelectorAll(
        `#notificationContainer [data-id="${id}"] ~ div .notif-item`
      );
      const allChecked = [...group].every((cb) => cb.checked);
      group.forEach((cb) => (cb.checked = !allChecked));
    });
  });

  // Save
  document.getElementById("saveBtn").addEventListener("click", () => {
    const checked = [...document.querySelectorAll(".notif-item")]
      .filter((cb) => cb.checked)
      .map((cb) => cb.id);
    alert(
      "Saved!\n" +
        (checked.length ? checked.join("\n") : "No notifications selected")
    );
  });
}
