let allProducts = [];

const TYPE_LABEL = {
  stock_in: "Stock in", stock_out: "Stock out",
  sale: "Sale", waste: "Waste", adjustment: "Adjustment",
};
const TYPE_BADGE = {
  stock_in: "badge-ok", stock_out: "badge-warn",
  sale: "badge-muted", waste: "badge-danger", adjustment: "badge-warn",
};

async function loadProductOptions() {
  allProducts = await api.get("/products");
  const select = document.getElementById("s-product");
  select.innerHTML = allProducts.map((p) =>
    `<option value="${p.id}">${escapeHtml(p.name)} (${p.stock_quantity} ${escapeHtml(p.unit)} on hand)</option>`
  ).join("");
}

async function loadLogs() {
  try {
    const logs = await api.get("/inventory");
    const tbody = document.getElementById("log-rows");

    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="big">📦</div>No stock movements recorded yet.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map((l) => `
      <tr>
        <td class="cell-muted">${formatDate(l.created_at)}</td>
        <td>${escapeHtml(l.products?.name || "—")}</td>
        <td><span class="badge ${TYPE_BADGE[l.change_type] || "badge-muted"}">${TYPE_LABEL[l.change_type] || l.change_type}</span></td>
        <td class="cell-num">${l.quantity} ${escapeHtml(l.products?.unit || "")}</td>
        <td class="cell-muted">${escapeHtml(l.reason || "—")}</td>
      </tr>
    `).join("");
  } catch (err) {
    showToast(err.message, true);
  }
}

function openStockModal() {
  document.getElementById("stock-form").reset();
  openModal("stock-modal");
}

document.getElementById("stock-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    product_id: document.getElementById("s-product").value,
    change_type: document.getElementById("s-type").value,
    quantity: parseFloat(document.getElementById("s-qty").value),
    reason: document.getElementById("s-reason").value || null,
  };

  try {
    await api.post("/inventory", payload);
    showToast("Stock movement recorded");
    closeModal("stock-modal");
    await loadProductOptions();
    await loadLogs();
  } catch (err) {
    showToast(err.message, true);
  }
});

(async function init() {
  await loadProductOptions();
  await loadLogs();
})();
