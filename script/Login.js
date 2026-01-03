import config from '../config/config.js';

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

    // Gọi API login
    const loginUrl = config.getUrl(config.endpoints.LOGIN);
    
    fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: u,
        password: p
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Đăng nhập thất bại');
      }
      return response.json();
    })
    .then(data => {
      message.style.color = "green";
      message.textContent = "Đăng nhập thành công!";
      
      // Lưu thông tin user và token
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
      
      console.log('Login success:', data);
      
      // Redirect đến Dashboard sau 1 giây
      setTimeout(() => {
        window.location.href = '../pages/Dashboard.html';
      }, 1000);
    })
    .catch(error => {
      message.style.color = "red";
      message.textContent = "Sai tài khoản hoặc mật khẩu";
      console.error('Login error:', error);
    });
  });
});
