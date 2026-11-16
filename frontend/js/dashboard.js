async function loadDashboard() {
  try {
    const data = await api.get("/dashboard/summary");

    document.getElementById("stat-today-sales").textContent = peso(data.today_sales);
    document.getElementById("stat-today-orders").textContent = data.today_order_count;
    document.getElementById("stat-products").textContent = data.total_products;
    document.getElementById("stat-low-stock").textContent = data.low_stock_count;

    const lowStockBody = document.getElementById("low-stock-rows");
    if (!data.low_stock_items.length) {
      lowStockBody.innerHTML = `<tr><td colspan="4" class="cell-muted">All products are well stocked. Nice.</td></tr>`;
    } else {
      lowStockBody.innerHTML = data.low_stock_items.map((p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td class="cell-num">${p.stock_quantity} ${escapeHtml(p.unit || "")}</td>
          <td class="cell-num cell-muted">${p.reorder_level}</td>
          <td><span class="badge badge-warn">Reorder soon</span></td>
        </tr>
      `).join("");
    }

    const ordersBody = document.getElementById("recent-orders-rows");
    if (!data.recent_orders.length) {
      ordersBody.innerHTML = `<tr><td colspan="5" class="cell-muted">No orders yet.</td></tr>`;
    } else {
      ordersBody.innerHTML = data.recent_orders.map((o) => `
        <tr>
          <td>${escapeHtml(o.order_number)}</td>
          <td>${escapeHtml(o.customers?.name || "Walk-in")}</td>
          <td>${statusBadge(o.status)}</td>
          <td class="cell-muted">${formatDate(o.order_date)}</td>
          <td class="cell-num">${peso(o.total_amount)}</td>
        </tr>
      `).join("");
    }
  } catch (err) {
    showToast(err.message, true);
  }
}

function statusBadge(status) {
  const map = {
    paid: "badge-ok", pending: "badge-warn",
    cancelled: "badge-danger", refunded: "badge-muted",
  };
  return `<span class="badge ${map[status] || "badge-muted"}">${escapeHtml(status)}</span>`;
}

loadDashboard();
