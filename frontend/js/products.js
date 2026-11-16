let categories = [];
let suppliers = [];
let debounceTimer;

function debouncedLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadProducts, 300);
}

async function loadLookups() {
  categories = await api.get("/categories");
  suppliers = await api.get("/suppliers");

  const catFilter = document.getElementById("category-filter");
  categories.forEach((c) => {
    catFilter.insertAdjacentHTML("beforeend", `<option value="${c.id}">${escapeHtml(c.name)}</option>`);
  });

  const catField = document.getElementById("f-category");
  catField.innerHTML = `<option value="">—</option>` +
    categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

  const supField = document.getElementById("f-supplier");
  supField.innerHTML = `<option value="">—</option>` +
    suppliers.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
}

async function loadProducts() {
  const search = document.getElementById("search-input").value.trim();
  const categoryId = document.getElementById("category-filter").value;

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (categoryId) params.set("category_id", categoryId);

  try {
    const products = await api.get(`/products?${params.toString()}`);
    const tbody = document.getElementById("product-rows");

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="big">🥩</div>No products found.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = products.map((p) => {
      const low = p.stock_quantity <= p.reorder_level;
      return `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong>${p.sku ? `<div class="cell-muted" style="font-size:12px">${escapeHtml(p.sku)}</div>` : ""}</td>
          <td class="cell-muted">${escapeHtml(p.categories?.name || "—")}</td>
          <td class="cell-muted">${escapeHtml(p.unit)}</td>
          <td class="cell-num">${peso(p.price_per_unit)}</td>
          <td class="cell-num">${p.stock_quantity} ${escapeHtml(p.unit)}</td>
          <td>${low ? '<span class="badge badge-warn">Low stock</span>' : '<span class="badge badge-ok">In stock</span>'}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-ghost btn-sm" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    showToast(err.message, true);
  }
}

function openProductModal() {
  document.getElementById("product-form").reset();
  document.getElementById("product-id").value = "";
  document.getElementById("product-modal-title").textContent = "Add product";
  document.getElementById("f-reorder").value = 5;
  openModal("product-modal");
}

function editProduct(p) {
  document.getElementById("product-id").value = p.id;
  document.getElementById("f-name").value = p.name;
  document.getElementById("f-category").value = p.category_id || "";
  document.getElementById("f-supplier").value = p.supplier_id || "";
  document.getElementById("f-unit").value = p.unit;
  document.getElementById("f-sku").value = p.sku || "";
  document.getElementById("f-price").value = p.price_per_unit;
  document.getElementById("f-cost").value = p.cost_per_unit;
  document.getElementById("f-stock").value = p.stock_quantity;
  document.getElementById("f-reorder").value = p.reorder_level;
  document.getElementById("product-modal-title").textContent = "Edit product";
  openModal("product-modal");
}

async function deleteProduct(id) {
  if (!confirm("Delete this product? This cannot be undone.")) return;
  try {
    await api.del(`/products/${id}`);
    showToast("Product deleted");
    loadProducts();
  } catch (err) {
    showToast(err.message, true);
  }
}

document.getElementById("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("product-id").value;

  const payload = {
    name: document.getElementById("f-name").value,
    category_id: document.getElementById("f-category").value || null,
    supplier_id: document.getElementById("f-supplier").value || null,
    unit: document.getElementById("f-unit").value,
    sku: document.getElementById("f-sku").value || null,
    price_per_unit: parseFloat(document.getElementById("f-price").value || 0),
    cost_per_unit: parseFloat(document.getElementById("f-cost").value || 0),
    reorder_level: parseFloat(document.getElementById("f-reorder").value || 5),
  };

  if (!id) payload.stock_quantity = parseFloat(document.getElementById("f-stock").value || 0);

  try {
    if (id) {
      await api.put(`/products/${id}`, payload);
      showToast("Product updated");
    } else {
      await api.post("/products", payload);
      showToast("Product added");
    }
    closeModal("product-modal");
    loadProducts();
  } catch (err) {
    showToast(err.message, true);
  }
});

(async function init() {
  await loadLookups();
  await loadProducts();
})();
