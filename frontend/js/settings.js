function switchTab(tab) {
  document.querySelectorAll(".tab-panel").forEach((el) => (el.style.display = "none"));
  document.getElementById(`tab-${tab}`).style.display = "block";
  document.querySelectorAll(".tab-btn").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
}

/* ---------------- Categories ---------------- */
async function loadCategories() {
  try {
    const categories = await api.get("/categories");
    const tbody = document.getElementById("category-rows");
    if (!categories.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="cell-muted">No categories yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = categories.map((c) => `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td class="cell-muted">${escapeHtml(c.description || "—")}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" onclick='editCategory(${JSON.stringify(c).replace(/'/g, "&#39;")})'>Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (err) { showToast(err.message, true); }
}

function openCategoryModal() {
  document.getElementById("category-form").reset();
  document.getElementById("category-id").value = "";
  document.getElementById("category-modal-title").textContent = "Add category";
  openModal("category-modal");
}
function editCategory(c) {
  document.getElementById("category-id").value = c.id;
  document.getElementById("cat-name").value = c.name;
  document.getElementById("cat-desc").value = c.description || "";
  document.getElementById("category-modal-title").textContent = "Edit category";
  openModal("category-modal");
}
async function deleteCategory(id) {
  if (!confirm("Delete this category?")) return;
  try { await api.del(`/categories/${id}`); showToast("Category deleted"); loadCategories(); }
  catch (err) { showToast(err.message, true); }
}
document.getElementById("category-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("category-id").value;
  const payload = { name: document.getElementById("cat-name").value, description: document.getElementById("cat-desc").value || null };
  try {
    if (id) await api.put(`/categories/${id}`, payload); else await api.post("/categories", payload);
    showToast("Category saved"); closeModal("category-modal"); loadCategories();
  } catch (err) { showToast(err.message, true); }
});

/* ---------------- Suppliers ---------------- */
async function loadSuppliers() {
  try {
    const suppliers = await api.get("/suppliers");
    const tbody = document.getElementById("supplier-rows");
    if (!suppliers.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="cell-muted">No suppliers yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = suppliers.map((s) => `
      <tr>
        <td><strong>${escapeHtml(s.name)}</strong></td>
        <td class="cell-muted">${escapeHtml(s.contact_person || "—")}</td>
        <td class="cell-muted">${escapeHtml(s.phone || "—")}</td>
        <td class="cell-muted">${escapeHtml(s.email || "—")}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" onclick='editSupplier(${JSON.stringify(s).replace(/'/g, "&#39;")})'>Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteSupplier('${s.id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (err) { showToast(err.message, true); }
}

function openSupplierModal() {
  document.getElementById("supplier-form").reset();
  document.getElementById("supplier-id").value = "";
  document.getElementById("supplier-modal-title").textContent = "Add supplier";
  openModal("supplier-modal");
}
function editSupplier(s) {
  document.getElementById("supplier-id").value = s.id;
  document.getElementById("sup-name").value = s.name;
  document.getElementById("sup-contact").value = s.contact_person || "";
  document.getElementById("sup-phone").value = s.phone || "";
  document.getElementById("sup-email").value = s.email || "";
  document.getElementById("sup-address").value = s.address || "";
  document.getElementById("supplier-modal-title").textContent = "Edit supplier";
  openModal("supplier-modal");
}
async function deleteSupplier(id) {
  if (!confirm("Delete this supplier?")) return;
  try { await api.del(`/suppliers/${id}`); showToast("Supplier deleted"); loadSuppliers(); }
  catch (err) { showToast(err.message, true); }
}
document.getElementById("supplier-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("supplier-id").value;
  const payload = {
    name: document.getElementById("sup-name").value,
    contact_person: document.getElementById("sup-contact").value || null,
    phone: document.getElementById("sup-phone").value || null,
    email: document.getElementById("sup-email").value || null,
    address: document.getElementById("sup-address").value || null,
  };
  try {
    if (id) await api.put(`/suppliers/${id}`, payload); else await api.post("/suppliers", payload);
    showToast("Supplier saved"); closeModal("supplier-modal"); loadSuppliers();
  } catch (err) { showToast(err.message, true); }
});

/* ---------------- Employees ---------------- */
async function loadEmployees() {
  try {
    const employees = await api.get("/employees");
    const tbody = document.getElementById("employee-rows");
    if (!employees.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="cell-muted">No staff yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = employees.map((e) => `
      <tr>
        <td><strong>${escapeHtml(e.name)}</strong></td>
        <td class="cell-muted">${escapeHtml(e.role)}</td>
        <td class="cell-muted">${escapeHtml(e.phone || "—")}</td>
        <td>${e.is_active ? '<span class="badge badge-ok">Active</span>' : '<span class="badge badge-muted">Inactive</span>'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" onclick='editEmployee(${JSON.stringify(e).replace(/'/g, "&#39;")})'>Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${e.id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (err) { showToast(err.message, true); }
}

function openEmployeeModal() {
  document.getElementById("employee-form").reset();
  document.getElementById("emp-id").value = "";
  document.getElementById("employee-modal-title").textContent = "Add staff";
  openModal("employee-modal");
}
function editEmployee(e) {
  document.getElementById("emp-id").value = e.id;
  document.getElementById("emp-name").value = e.name;
  document.getElementById("emp-role").value = e.role;
  document.getElementById("emp-phone").value = e.phone || "";
  document.getElementById("emp-email").value = e.email || "";
  document.getElementById("employee-modal-title").textContent = "Edit staff";
  openModal("employee-modal");
}
async function deleteEmployee(id) {
  if (!confirm("Delete this staff member?")) return;
  try { await api.del(`/employees/${id}`); showToast("Staff member deleted"); loadEmployees(); }
  catch (err) { showToast(err.message, true); }
}
document.getElementById("employee-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("emp-id").value;
  const payload = {
    name: document.getElementById("emp-name").value,
    role: document.getElementById("emp-role").value,
    phone: document.getElementById("emp-phone").value || null,
    email: document.getElementById("emp-email").value || null,
  };
  try {
    if (id) await api.put(`/employees/${id}`, payload); else await api.post("/employees", payload);
    showToast("Staff saved"); closeModal("employee-modal"); loadEmployees();
  } catch (err) { showToast(err.message, true); }
});

loadCategories();
loadSuppliers();
loadEmployees();
