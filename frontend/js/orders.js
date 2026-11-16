let orderProducts = [];
let lineCount = 0;

const STATUS_BADGE = {
  paid: "badge-ok", pending: "badge-warn",
  cancelled: "badge-danger", refunded: "badge-muted",
};

async function loadOrders() {
  const status = document.getElementById("status-filter").value;
  const params = status ? `?status=${status}` : "";

  try {
    const orders = await api.get(`/orders${params}`);
    const tbody = document.getElementById("order-rows");

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="big">🧾</div>No orders yet.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map((o) => `
      <tr>
        <td><strong>${escapeHtml(o.order_number)}</strong></td>
        <td>${escapeHtml(o.customers?.name || "Walk-in")}</td>
        <td class="cell-muted">${escapeHtml(o.employees?.name || "—")}</td>
        <td><span class="badge ${STATUS_BADGE[o.status] || "badge-muted"}">${escapeHtml(o.status)}</span></td>
        <td class="cell-muted">${formatDate(o.order_date)}</td>
        <td class="cell-num">${peso(o.total_amount)}</td>
      </tr>
    `).join("");
  } catch (err) {
    showToast(err.message, true);
  }
}

async function loadLookupsForOrder() {
  const [customers, employees, products] = await Promise.all([
    api.get("/customers"), api.get("/employees"), api.get("/products"),
  ]);
  orderProducts = products;

  const custSelect = document.getElementById("o-customer");
  custSelect.innerHTML = `<option value="">Walk-in customer</option>` +
    customers.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

  const empSelect = document.getElementById("o-employee");
  empSelect.innerHTML = `<option value="">—</option>` +
    employees.map((e) => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join("");
}

function addOrderLine() {
  lineCount++;
  const id = `line-${lineCount}`;
  const container = document.getElementById("order-lines");

  const options = orderProducts.map((p) =>
    `<option value="${p.id}" data-price="${p.price_per_unit}">${escapeHtml(p.name)} — ${peso(p.price_per_unit)}/${escapeHtml(p.unit)}</option>`
  ).join("");

  const row = document.createElement("div");
  row.className = "order-line";
  row.id = id;
  row.innerHTML = `
    <select class="input" style="flex:2" onchange="recalcTotal()" data-role="product">${options}</select>
    <input class="input" style="flex:1" type="number" min="0.01" step="0.01" value="1" data-role="qty" oninput="recalcTotal()">
    <span class="cell-muted" style="flex:1" data-role="linetotal">₱0.00</span>
    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('${id}').remove(); recalcTotal();">✕</button>
  `;
  container.appendChild(row);
  recalcTotal();
}

function recalcTotal() {
  let total = 0;
  document.querySelectorAll(".order-line").forEach((row) => {
    const select = row.querySelector('[data-role="product"]');
    const qtyInput = row.querySelector('[data-role="qty"]');
    const price = parseFloat(select.selectedOptions[0]?.dataset.price || 0);
    const qty = parseFloat(qtyInput.value || 0);
    const lineTotal = price * qty;
    row.querySelector('[data-role="linetotal"]').textContent = peso(lineTotal);
    total += lineTotal;
  });
  document.getElementById("order-total").textContent = peso(total);
}

function openOrderModal() {
  document.getElementById("order-form").reset();
  document.getElementById("order-lines").innerHTML = "";
  lineCount = 0;
  addOrderLine();
  openModal("order-modal");
}

document.getElementById("order-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const items = [...document.querySelectorAll(".order-line")].map((row) => {
    const select = row.querySelector('[data-role="product"]');
    const qty = parseFloat(row.querySelector('[data-role="qty"]').value);
    return {
      product_id: select.value,
      quantity: qty,
      unit_price: parseFloat(select.selectedOptions[0]?.dataset.price || 0),
    };
  }).filter((i) => i.product_id && i.quantity > 0);

  if (!items.length) {
    showToast("Add at least one item", true);
    return;
  }

  const payload = {
    customer_id: document.getElementById("o-customer").value || null,
    employee_id: document.getElementById("o-employee").value || null,
    payment_method: document.getElementById("o-payment").value,
    status: document.getElementById("o-status").value,
    items,
  };

  try {
    await api.post("/orders", payload);
    showToast("Order placed");
    closeModal("order-modal");
    await loadLookupsForOrder();
    await loadOrders();
  } catch (err) {
    showToast(err.message, true);
  }
});

(async function init() {
  await loadLookupsForOrder();
  await loadOrders();
})();
