document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const message = document.getElementById("message");
  const toggleClear = document.getElementById("toggleClear");
  const radios = document.getElementsByName("showPwd");

  // Xóa mật khẩu
  toggleClear.addEventListener("click", () => {
    password.value = "";
    password.focus();
  });

  // Radio hiện / ẩn mật khẩu
  function applyRadio() {
    const selected = Array.from(radios).find((r) => r.checked).value;
    password.type = selected === "show" ? "text" : "password";
  }

  radios.forEach((r) => r.addEventListener("change", applyRadio));

  // Đăng nhập demo
  document.getElementById("loginDemo").addEventListener("click", () => {
    username.value = "demo";
    password.value = "password123";
    radios[1].checked = true;
    applyRadio();
  });

  // Submit form
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    message.textContent = "";

    const u = username.value.trim();
    const p = password.value;

    if (!u) {
      message.style.color = "red";
      message.textContent = "Vui lòng nhập tài khoản";
      return;
    }
    if (!p) {
      message.style.color = "red";
      message.textContent = "Vui lòng nhập mật khẩu";
      return;
    }

    // Fake API login
    setTimeout(() => {
      if (u === "demo" && p === "password123") {
        message.style.color = "green";
        message.textContent = "Đăng nhập thành công!";
      } else {
        message.style.color = "red";
        message.textContent = "Sai tài khoản hoặc mật khẩu";
      }
    }, 600);
  });
});
