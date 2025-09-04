/* ==================== Utilities ==================== */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}
function read(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
  if (location.pathname.includes("admin-dashboard.html")) updateDashboardCounts();
}
/* One-time / on-load migration to add missing IDs and link listings */
function ensureDataIntegrity() {
  let students = read("students");
  let listings = read("listings");
  let touchedStudents = false;
  let touchedListings = false;

  // Ensure every student has a stable id
  students.forEach(s => {
    if (!s.id) {
      s.id = uid();
      touchedStudents = true;
    }
  });
  if (touchedStudents) write("students", students);

  // Ensure listings carry sellerId when we can infer it
  listings.forEach(l => {
    if (!l.sellerId && l.seller) {
      const owner = students.find(s => s.email === l.seller);
      if (owner) {
        l.sellerId = owner.id;
        touchedListings = true;
      }
    }
  });
  if (touchedListings) write("listings", listings);

  // Backfill studentId in localStorage for currently logged-in user
  const email = localStorage.getItem("studentLoggedIn");
  const currentId = localStorage.getItem("studentId");
  if (!currentId && email) {
    const me = students.find(s => s.email === email);
    if (me?.id) localStorage.setItem("studentId", me.id);
  }
}

/* ==================== Admin Auth ==================== */
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

function adminLogin() {
  const user = document.getElementById('adminUser')?.value;
  const pass = document.getElementById('adminPass')?.value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem('adminLoggedIn', 'true');
    location.href = 'admin-dashboard.html';
  } else alert('Invalid admin credentials');
}

function adminAuthGuard() {
  if (location.pathname.endsWith('admin-login.html')) return;
  if (localStorage.getItem('adminLoggedIn') !== 'true') {
    location.href = 'admin-login.html';
  }
}

function logoutAdmin() {
  localStorage.removeItem('adminLoggedIn');
  location.href = 'admin-login.html';
}

/* ==================== Student Auth ==================== */
function studentSignup(e) {
  e.preventDefault();
  const name = document.getElementById("signupName")?.value.trim();
  const uniId = document.getElementById("signupUniId")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const pass = document.getElementById("signupPass")?.value;

  if (!name || !uniId || !email || !pass) {
    alert("Fill all signup fields");
    return;
  }

  let students = read("students");
  if (students.some(s => s.email === email)) {
    alert("Email already registered.");
    return;
  }

  students.push({ id: uid(), name, uniId, email, pass, blocked: false });
  write("students", students);

  alert("Signup successful! Please login.");
  location.href = "login.html";
}

function studentLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail")?.value.trim();
  const pass = document.getElementById("loginPass")?.value;

  let students = read("students");
  const user = students.find(s => s.email === email && s.pass === pass);

  if (!user) {
    alert("Invalid credentials!");
    return;
  }
  if (user.blocked) {
    alert("Your account has been blocked by admin.");
    return;
  }

  localStorage.setItem("studentLoggedIn", email);
  if (user.id) localStorage.setItem("studentId", user.id);
  alert("Login successful!");
  location.href = "indexs.html";
}

function logoutStudent() {
  localStorage.removeItem("studentLoggedIn");
  localStorage.removeItem("studentId");
  alert("You have been logged out.");
  location.href = "indexs.html";
}

function isStudentLoggedIn() {
  return !!localStorage.getItem("studentLoggedIn");
}

/* ==================== Navbar ==================== */
function updateNavbar() {
  const studentPages = ["indexs.html", "add-product.html", "cart.html", "profile.html", "browse.html"];
  if (!studentPages.some(p => location.pathname.includes(p))) return;

  const nav = document.querySelector("header nav");
  if (!nav) return;

  const loggedIn = isStudentLoggedIn();
  nav.innerHTML = "";

  // Always show Home link first
  nav.innerHTML += `<a href="indexs.html">Home</a>`;

  // Common links
  nav.innerHTML += `<a href="add-product.html" id="addProductLink">Add Product</a>`;
  nav.innerHTML += `<a href="cart.html" id="cartLink">Cart</a>`;

  if (loggedIn) {
    nav.innerHTML += `<a href="profile.html">Profile</a>`;
    nav.innerHTML += `<a href="#" id="logoutLink">Logout</a>`;
    document.getElementById("logoutLink")?.addEventListener("click", e => {
      e.preventDefault();
      logoutStudent();
    });
  } else {
    nav.innerHTML += `
      <div class="dropdown">
        <button class="dropbtn">Login ⮟</button>
        <div class="dropdown-content">
          <a href="login.html">Login as User</a>
          <a href="admin-login.html">Login as Admin</a>
        </div>
      </div>
      <a href="signup.html">Signup</a>
    `;
  }
}

/* ==================== Guards ==================== */
function addActionGuards() {
  const addLink = document.getElementById("addProductLink");
  addLink?.addEventListener("click", e => {
    if (!isStudentLoggedIn()) {
      e.preventDefault();
      alert("Please login first to add a product.");
      location.href = "login.html";
    }
  });

  const cartLink = document.getElementById("cartLink");
  cartLink?.addEventListener("click", e => {
    if (!isStudentLoggedIn()) {
      e.preventDefault();
      alert("Please login first to view your cart.");
      location.href = "login.html";
    }
  });
}

/* ==================== Add Product ==================== */
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
  addProductForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (!isStudentLoggedIn()) {
      alert("You must be logged in to add a product.");
      location.href = "login.html";
      return;
    }

    const seller = localStorage.getItem('studentLoggedIn');
    const sellerId = localStorage.getItem('studentId') || null;
    const title = document.getElementById('prodTitle').value.trim();
    const category = document.getElementById('prodCategory').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const price = document.getElementById('prodPrice').value;
    const condition = document.getElementById('prodCondition').value;
    const file = document.getElementById('prodImage').files?.[0];

    if (!title || !category || !price) { alert('Fill Title, Category and Price'); return; }
    if (!file) { alert('Upload an image'); return; }

    const reader = new FileReader();
    reader.onload = function(evt) {
      const imgData = evt.target.result;
      const listings = read('listings');
      listings.push({
        id: uid(),
        title, category, desc, price,
        condition,
        seller,           // email (legacy + display)
        sellerId,         // stable link to user
        status: 'Pending',
        image: imgData,
        createdAt: new Date().toISOString()
      });
      write('listings', listings);
      alert('Product submitted! It will be visible after admin approval.');
      location.href = 'indexs.html';
    };
    reader.readAsDataURL(file);
  });
}

/* ==================== Admin Listings ==================== */
function loadListingsAdmin() {
  const listings = read('listings');
  const tbody = document.querySelector('#listingsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (listings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No listings found.</td></tr>';
    return;
  }

  listings.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.image ? `<img src="${item.image}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">` : '—'}</td>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.seller || '')}</td>
      <td>${escapeHtml(item.price)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.condition)}</td>
      <td>${item.status}</td>
      <td>
        <button class="approveBtn">✅ Approve</button>
        <button class="rejectBtn">🚫 Reject</button>
        <button class="deleteBtn">🗑️ Delete</button>
      </td>
    `;
    tbody.appendChild(tr);

    tr.querySelector('.approveBtn')?.addEventListener('click', () => approveListing(item.id));
    tr.querySelector('.rejectBtn')?.addEventListener('click', () => markRejected(item.id));
    tr.querySelector('.deleteBtn')?.addEventListener('click', () => deleteListing(item.id));

    if (item.status === 'Approved') tr.querySelector('.approveBtn').style.display = 'none';
    if (item.status !== 'Approved') tr.querySelector('.rejectBtn').style.display = 'none';
  });
}

/* ==================== Admin Approved Listings ==================== */
function loadApprovedAdmin() {
  const listings = read('listings').filter(l => l.status === 'Approved');
  const tbody = document.querySelector('#approvedTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (listings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No approved listings.</td></tr>';
    return;
  }

  listings.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.image ? `<img src="${item.image}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">` : '—'}</td>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.seller || '')}</td>
      <td>${escapeHtml(item.price)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.condition)}</td>
      <td><button class="deleteBtn">🗑️ Delete</button></td>
    `;
    tbody.appendChild(tr);

    tr.querySelector('.deleteBtn')?.addEventListener('click', () => deleteListing(item.id));
  });
}

/* ==================== Admin Users ==================== */
function loadUsersAdmin() {
  const users = read("students");
  const listings = read("listings");
  const tbody = document.querySelector("#usersTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (users.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No registered students.</td></tr>";
    return;
  }

  users.forEach((user, idx) => {
    const totalListings = listings.filter(l => (l.sellerId && l.sellerId === user.id) || (!l.sellerId && l.seller === user.email)).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.uniId)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${totalListings}</td>
      <td>
        <button onclick="toggleBlockUser(${idx})">${user.blocked ? "Unblock" : "Block"}</button>
        <button onclick="deleteUser(${idx})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function toggleBlockUser(index) {
  let users = read("students");
  users[index].blocked = !users[index].blocked;
  write("students", users);
  loadUsersAdmin();
}

function deleteUser(index) {
  let users = read("students");
  users.splice(index, 1);
  write("students", users);
  loadUsersAdmin();
}

/* ==================== Home / Featured Listings ==================== */
function loadFeaturedListings(filter = "All") {
  const listings = read('listings').filter(l => l.status === 'Approved');
  const container = document.getElementById('featured');
  if (!container) return;
  container.innerHTML = '';

  const filteredListings = listings.filter(item => {
    if (filter === "All") return true;
    return item.category?.toLowerCase() === filter.toLowerCase();
  });

  if (filteredListings.length === 0) {
    container.innerHTML = '<p>No products found.</p>';
    return;
  }

  filteredListings.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${item.image}" />
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.desc)}</p>
      <p>Price: $${escapeHtml(item.price)}</p>
      <p>Condition: ${escapeHtml(item.condition)}</p>
      <p>Seller: ${escapeHtml(item.seller || '')}</p>
      <button class="addCartBtn">🛒 Add to Cart</button>
    `;
    container.appendChild(card);

    card.querySelector(".addCartBtn").addEventListener("click", () => addToCart(item));
  });
}

/* ==================== CATEGORY FILTER ==================== */
function setupCategoryFilter() {
  const categoryCards = document.querySelectorAll(".category-cards .card");
  categoryCards.forEach(card => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      loadFeaturedListings(category);

      categoryCards.forEach(c => c.style.border = "none");
      card.style.border = "2px solid #f39c12";
    });
  });
}

/* ==================== Cart Functions ==================== */
function addToCart(item) {
  if (!isStudentLoggedIn()) {
    alert("Please login to add to cart.");
    location.href = "login.html";
    return;
  }
  let cart = read("cart");
  cart.push({
    cartId: uid(),
    itemId: item.id,
    title: item.title,
    price: parseFloat(item.price),
    seller: item.seller,
    buyer: localStorage.getItem("studentLoggedIn"),
    date: new Date().toISOString()
  });
  write("cart", cart);
  alert("Item added to cart!");
}

function loadCart() {
  const cart = read("cart");
  const table = document.getElementById("cartTable");
  const totalEl = document.getElementById("cartTotal");
  if (!table) return;

  table.innerHTML = "<tr><th>Item</th><th>Price</th><th>Seller</th><th>Action</th></tr>";

  let total = 0;
  cart.forEach((c, idx) => {
    total += c.price;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(c.title)}</td>
      <td>$${c.price}</td>
      <td>${escapeHtml(c.seller)}</td>
      <td><button onclick="removeFromCart(${idx})">❌ Remove</button></td>
    `;
    table.appendChild(tr);
  });
  totalEl.textContent = total.toFixed(2);
}

function removeFromCart(idx) {
  let cart = read("cart");
  cart.splice(idx, 1);
  write("cart", cart);
  loadCart();
}

function placeOrder() {
  let cart = read("cart");
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }
  let orders = read("orders");
  cart.forEach(c => {
    orders.push({
      orderId: uid(),
      title: c.title,
      amount: c.price,
      buyer: c.buyer,
      seller: c.seller,
      date: new Date().toLocaleString()
    });
  });
  write("orders", orders);
  localStorage.removeItem("cart");
  alert("Order placed successfully!");
  location.href = "indexs.html";
}

/* ==================== Admin Orders ==================== */
function loadOrdersAdmin() {
  const orders = read("orders");
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (orders.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No orders placed yet.</td></tr>";
    return;
  }

  orders.forEach((o, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(o.title)}</td>
      <td>${escapeHtml(o.buyer)}</td>
      <td>${escapeHtml(o.seller)}</td>
      <td>$${o.amount}</td>
      <td>${o.date}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==================== Helper ==================== */
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

/* ==================== Dashboard Counts ==================== */
function updateDashboardCounts() {
  const students = read('students');
  const listings = read('listings');
  const orders = read('orders');

  const totalStudentsEl = document.getElementById('totalStudents');
  const totalListingsEl = document.getElementById('totalListings');
  const pendingItemsEl = document.getElementById('pendingItems');
  const ordersPlacedEl = document.getElementById('ordersPlaced');

  const approvedListings = listings.filter(l => l.status === 'Approved');
  const notApprovedListings = listings.filter(l => l.status !== 'Approved');

  if (totalStudentsEl) totalStudentsEl.textContent = students.length;
  if (totalListingsEl) totalListingsEl.textContent = approvedListings.length;
  if (pendingItemsEl) pendingItemsEl.textContent = notApprovedListings.length;
  if (ordersPlacedEl) ordersPlacedEl.textContent = orders.length;
}

/* ==================== Listing Actions ==================== */
function approveListing(id) {
  const listings = read('listings');
  const idx = listings.findIndex(l => l.id === id);
  if (idx === -1) return;
  listings[idx].status = 'Approved';
  write('listings', listings);
  loadListingsAdmin();
  loadApprovedAdmin();
  loadFeaturedListings();
}

function markRejected(id) {
  const listings = read('listings');
  const idx = listings.findIndex(l => l.id === id);
  if (idx === -1) return;
  listings[idx].status = 'Rejected';
  write('listings', listings);
  loadListingsAdmin();
}

function deleteListing(id) {
  let listings = read('listings');
  listings = listings.filter(l => l.id !== id);
  write('listings', listings);
  loadListingsAdmin();
  loadApprovedAdmin();
  loadFeaturedListings();
}

/* ==================== Profile Section ==================== */
function loadProfile() {
  const loggedInEmail = localStorage.getItem("studentLoggedIn");
  const loggedInId = localStorage.getItem("studentId");

  if (!loggedInEmail && !loggedInId) {
    alert("Please login to view your profile.");
    location.href = "login.html";
    return;
  }

  const students = read("students");
  let user = null;
  if (loggedInId) user = students.find(s => s.id === loggedInId);
  if (!user && loggedInEmail) user = students.find(s => s.email === loggedInEmail);
  if (!user) {
    alert("Your account couldn't be found. Please log in again.");
    logoutStudent();
    return;
  }

  // Ensure localStorage has the current id
  if (user.id && localStorage.getItem("studentId") !== user.id) {
    localStorage.setItem("studentId", user.id);
  }

  document.getElementById("profileName").value = user.name || "";
  document.getElementById("profileUniId").value = user.uniId || "";
  document.getElementById("profileEmail").value = user.email || "";

  loadStudentListings(user);
}

function updateProfile(e) {
  e.preventDefault();

  const students = read("students");
  const loggedInId = localStorage.getItem("studentId");
  const loggedInEmail = localStorage.getItem("studentLoggedIn");

  let userIdx = -1;
  if (loggedInId) userIdx = students.findIndex(s => s.id === loggedInId);
  if (userIdx === -1 && loggedInEmail) userIdx = students.findIndex(s => s.email === loggedInEmail);
  if (userIdx === -1) {
    alert("Profile not found. Please re-login.");
    return;
  }

  const newName = document.getElementById("profileName").value.trim();
  const newUniId = document.getElementById("profileUniId").value.trim();

  if (!newName || !newUniId) {
    alert("Name and University ID are required.");
    return;
  }

  students[userIdx].name = newName;
  students[userIdx].uniId = newUniId;
  // Email is kept constant; it's the account key in this app.

  write("students", students);
  alert("Profile updated successfully!");

  // Refresh UI + my listings
  loadProfile();

  // Nudge other tabs (admin pages) to refresh
  localStorage.setItem("students_touch", Date.now().toString());
}

function loadStudentListings(userOrEmail) {
  const userId = typeof userOrEmail === "string" ? localStorage.getItem("studentId") : userOrEmail.id;
  const email = typeof userOrEmail === "string" ? userOrEmail : userOrEmail.email;

  const listings = read("listings").filter(l =>
    (l.sellerId && userId && l.sellerId === userId) ||
    (!l.sellerId && email && l.seller === email)
  );

  const table = document.getElementById("studentListings");
  if (!table) return;

  table.innerHTML = "<tr><th>Title</th><th>Price</th><th>Status</th></tr>";

  if (listings.length === 0) {
    table.innerHTML += "<tr><td colspan='3'>No listings yet.</td></tr>";
    return;
  }

  listings.forEach(l => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(l.title)}</td>
      <td>$${escapeHtml(l.price)}</td>
      <td>${escapeHtml(l.status)}</td>
    `;
    table.appendChild(tr);
  });
}

const profileForm = document.getElementById("profileForm");
if (profileForm) {
  profileForm.addEventListener("submit", updateProfile);
}

/* ==================== Make Functions Global ==================== */
window.approveListing = approveListing;
window.markRejected = markRejected;
window.deleteListing = deleteListing;
window.studentLogin = studentLogin;
window.studentSignup = studentSignup;
window.loadUsersAdmin = loadUsersAdmin;
window.toggleBlockUser = toggleBlockUser;
window.deleteUser = deleteUser;
window.removeFromCart = removeFromCart;
window.placeOrder = placeOrder;
window.loadOrdersAdmin = loadOrdersAdmin;

/* ==================== Cross-tab refresh for admin pages ==================== */
window.addEventListener("storage", () => {
  try { loadUsersAdmin(); } catch(e) {}
  try { updateDashboardCounts(); } catch(e) {}
  try { loadListingsAdmin(); } catch(e) {}
  try { loadApprovedAdmin(); } catch(e) {}
});

/* ==================== On Page Load ==================== */
window.addEventListener('load', () => {
  try { ensureDataIntegrity(); } catch(e) {}
  try { loadListingsAdmin(); } catch(e) {}
  try { loadApprovedAdmin(); } catch(e) {}
  try { loadFeaturedListings(); } catch(e) {}
  try { updateNavbar(); } catch(e) {}
  try { addActionGuards(); } catch(e) {}
  try { updateDashboardCounts(); } catch(e) {}
  try { setupCategoryFilter(); } catch(e) {}
  try { if (location.pathname.includes("profile.html")) loadProfile(); } catch(e) {}
});
