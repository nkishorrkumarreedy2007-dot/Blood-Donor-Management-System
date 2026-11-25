const API = "/api";
const $ = id => document.getElementById(id);
let selectedGroup = "All";
let donorsCache = [];

$("year").textContent = new Date().getFullYear();

async function api(url, options = {}) {
  const response = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

async function loadStats() {
  const stats = await api("/stats");
  $("totalDonors").textContent = stats.total;
  $("availableDonors").textContent = stats.available;
}

function renderDonors(donors) {
  donorsCache = donors;
  const availableOnly = $("availabilityFilter").value === "available";
  const shown = availableOnly ? donors.filter(d => d.available) : donors;
  $("resultCount").textContent = `${shown.length} donor${shown.length === 1 ? "" : "s"}`;
  if (!shown.length) {
    $("donorTable").innerHTML = '<tr><td colspan="6" class="empty">No donors found. Try another search or register a donor.</td></tr>';
    return;
  }
  $("donorTable").innerHTML = shown.map(d => `
    <tr>
      <td><div class="donor-name"><span class="donor-avatar">${escapeHtml(d.name.charAt(0).toUpperCase())}</span>${escapeHtml(d.name)}</div></td>
      <td><span class="blood-pill">${escapeHtml(d.bloodGroup)}</span></td>
      <td>${escapeHtml(d.phone)}${d.email ? `<br><span style="color:#999">${escapeHtml(d.email)}</span>` : ""}</td>
      <td>${escapeHtml(d.city)}</td>
      <td><span class="status ${d.available ? "" : "off"}">${d.available ? "● Available" : "○ Unavailable"}</span></td>
      <td><button class="action-btn" data-edit="${escapeHtml(d.id)}">Edit</button><button class="action-btn" data-delete="${escapeHtml(d.id)}">Delete</button></td>
    </tr>`).join("");
}

async function loadDonors() {
  const params = new URLSearchParams();
  if (selectedGroup !== "All") params.set("bloodGroup", selectedGroup);
  const search = $("searchInput").value.trim();
  if (search) params.set("search", search);
  renderDonors(await api(`/donors?${params.toString()}`));
}

async function refresh() {
  try {
    await Promise.all([loadStats(), loadDonors()]);
  } catch (error) {
    $("donorTable").innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(error.message)}. Please refresh the page.</td></tr>`;
  }
}

$("bloodGroups").addEventListener("click", event => {
  const button = event.target.closest("[data-group]");
  if (!button) return;
  selectedGroup = button.dataset.group;
  document.querySelectorAll(".group-chip").forEach(chip => chip.classList.toggle("active", chip === button));
  loadDonors().catch(showError);
});

let searchTimer;
$("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadDonors().catch(showError), 250);
});
$("availabilityFilter").addEventListener("change", () => renderDonors(donorsCache));

$("donorTable").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const donor = donorsCache.find(d => d.id === editButton.dataset.edit);
    if (donor) beginEdit(donor);
  }
  if (deleteButton) {
    const donor = donorsCache.find(d => d.id === deleteButton.dataset.delete);
    if (!donor || !confirm(`Delete the donor record for ${donor.name}?`)) return;
    try {
      await api(`/donors/${encodeURIComponent(donor.id)}`, { method: "DELETE" });
      await refresh();
    } catch (error) { showError(error); }
  }
});

function showMessage(message, isError = false) {
  $("formMessage").textContent = message;
  $("formMessage").classList.toggle("error", isError);
}
function showError(error) { showMessage(error.message || "An error occurred", true); }

function beginEdit(donor) {
  $("donorId").value = donor.id;
  ["name", "age", "gender", "bloodGroup", "phone", "email", "city", "address"].forEach(key => $(key).value = donor[key] ?? "");
  $("available").checked = donor.available;
  $("formTitle").textContent = "Update donor details";
  $("submitBtn").innerHTML = "Save changes <span>→</span>";
  $("cancelEdit").classList.remove("hidden");
  showMessage("");
  $("register").scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
  $("donorForm").reset();
  $("donorId").value = "";
  $("available").checked = true;
  $("formTitle").textContent = "Donor registration";
  $("submitBtn").innerHTML = "Register donor <span>→</span>";
  $("cancelEdit").classList.add("hidden");
  showMessage("");
}
$("cancelEdit").addEventListener("click", resetForm);

$("donorForm").addEventListener("submit", async event => {
  event.preventDefault();
  const id = $("donorId").value;
  const payload = {
    name: $("name").value.trim(),
    age: Number($("age").value),
    gender: $("gender").value,
    bloodGroup: $("bloodGroup").value,
    phone: $("phone").value.trim(),
    email: $("email").value.trim(),
    city: $("city").value.trim(),
    address: $("address").value.trim(),
    available: $("available").checked
  };
  $("submitBtn").disabled = true;
  showMessage(id ? "Updating donor..." : "Registering donor...");
  try {
    await api(id ? `/donors/${encodeURIComponent(id)}` : "/donors", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    resetForm();
    showMessage(id ? "Donor updated successfully." : "Donor registered successfully.");
    await refresh();
    $("donors").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showError(error);
  } finally {
    $("submitBtn").disabled = false;
  }
});

refresh();
