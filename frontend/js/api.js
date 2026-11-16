// API_BASE is defined in config.js (loaded before this file in every page).

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let body;
  try {
    body = await res.json();
  } catch (e) {
    throw new Error("Could not reach the API. Is the Flask server running?");
  }

  if (!res.ok || body.success === false) {
    throw new Error(body.message || "Something went wrong");
  }
  return body.data;
}

const api = {
  get: (path) => apiRequest(path),
  post: (path, data) => apiRequest(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) => apiRequest(path, { method: "PUT", body: JSON.stringify(data) }),
  del: (path) => apiRequest(path, { method: "DELETE" }),
};

// ---------- Small shared UI helpers ----------

function showToast(message, isError = false) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${isError ? "error" : ""}`;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function peso(amount) {
  const n = Number(amount || 0);
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// Highlight the current page's nav link
document.addEventListener("DOMContentLoaded", () => {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.getAttribute("href") === current) link.classList.add("active");
  });
});
