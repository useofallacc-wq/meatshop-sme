let debounceTimer;
function debouncedLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadCustomers, 300);
}

async function loadCustomers() {
  const search = document.getElementById("search-input").value.trim();
  const params = search ? `?search=${encodeURIComponent(search)}` : "";

  try {
    const customers = await api.get(`/customers${params}`);
    const tbody = document.getElementById("customer-rows");

    if (!customers.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="big">👤</div>No customers found.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = customers.map((c) => `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td class="cell-muted">${escapeHtml(c.phone || "—")}</td>
        <td class="cell-muted">${escapeHtml(c.email || "—")}</td>
        <td class="cell-muted">${escapeHtml(c.address || "—")}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" onclick='editCustomer(${JSON.stringify(c).replace(/'/g, "&#39;")})'>Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    showToast(err.message, true);
  }
}

function openCustomerModal() {
  document.getElementById("customer-form").reset();
  document.getElementById("customer-id").value = "";
  document.getElementById("customer-modal-title").textContent = "Add customer";
  openModal("customer-modal");
}

function editCustomer(c) {
  document.getElementById("customer-id").value = c.id;
  document.getElementById("c-name").value = c.name;
  document.getElementById("c-phone").value = c.phone || "";
  document.getElementById("c-email").value = c.email || "";
  document.getElementById("c-address").value = c.address || "";
  document.getElementById("c-notes").value = c.notes || "";
  document.getElementById("customer-modal-title").textContent = "Edit customer";
  openModal("customer-modal");
}

async function deleteCustomer(id) {
  if (!confirm("Delete this customer?")) return;
  try {
    await api.del(`/customers/${id}`);
    showToast("Customer deleted");
    loadCustomers();
  } catch (err) {
    showToast(err.message, true);
  }
}

document.getElementById("customer-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("customer-id").value;
  const payload = {
    name: document.getElementById("c-name").value,
    phone: document.getElementById("c-phone").value || null,
    email: document.getElementById("c-email").value || null,
    address: document.getElementById("c-address").value || null,
    notes: document.getElementById("c-notes").value || null,
  };

  try {
    if (id) {
      await api.put(`/customers/${id}`, payload);
      showToast("Customer updated");
    } else {
      await api.post("/customers", payload);
      showToast("Customer added");
    }
    closeModal("customer-modal");
    loadCustomers();
  } catch (err) {
    showToast(err.message, true);
  }
});

loadCustomers();
