const apiUrl = "http://localhost:5000/api";
let currentUser = null;
let currentReportType = "person";
let currentFilter = "all";

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  if (token && user) {
    currentUser = JSON.parse(user);
    showApp();
  } else {
    showAuth();
  }
}

function showAuth() {
  document.getElementById("authSection").style.display = "block";
  document.getElementById("appSection").style.display = "none";
}

function showApp() {
  document.getElementById("authSection").style.display = "none";
  document.getElementById("appSection").style.display = "block";
  document.getElementById("userName").textContent = `Welcome, ${currentUser.name}`;
  loadReports();
}

// Auth Tab Switching
function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = document.querySelectorAll(".tab-btn");
  
  tabs.forEach(btn => btn.classList.remove("active"));
  
  if (tab === "login") {
    loginForm.style.display = "flex";
    registerForm.style.display = "none";
    tabs[0].classList.add("active");
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "flex";
    tabs[1].classList.add("active");
  }
}

// Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  
  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;
      showApp();
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// Register
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const phone = document.getElementById("registerPhone").value;
  const password = document.getElementById("registerPassword").value;
  
  try {
    const res = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;
      showApp();
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
});

// Logout
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  currentUser = null;
  showAuth();
}

// Report Type Selection
function selectReportType(type) {
  currentReportType = type;
  const buttons = document.querySelectorAll(".type-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
  
  const personFields = document.getElementById("personFields");
  const itemFields = document.getElementById("itemFields");
  const formTitle = document.getElementById("formTitle");
  
  if (type === "person") {
    personFields.style.display = "block";
    itemFields.style.display = "none";
    formTitle.textContent = "Report Missing Person";
  } else {
    personFields.style.display = "none";
    itemFields.style.display = "block";
    formTitle.textContent = "Report Lost Item";
  }
}

// Submit Report
document.getElementById("reportForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append("reportType", currentReportType);
  formData.append("name", document.getElementById("name").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("location", document.getElementById("location").value);
  formData.append("contactName", currentUser.name);
  formData.append("contactPhone", currentUser.phone);
  formData.append("contactEmail", currentUser.email);
  
  const imageFile = document.getElementById("image").files[0];
  if (imageFile) {
    formData.append("image", imageFile);
  }
  
  // Add type-specific fields
  if (currentReportType === "person") {
    const age = document.getElementById("age").value;
    const lastSeenLocation = document.getElementById("lastSeenLocation").value;
    const lastSeenDate = document.getElementById("lastSeenDate").value;
    const clothingDescription = document.getElementById("clothingDescription").value;
    
    if (age) formData.append("age", age);
    if (lastSeenLocation) formData.append("lastSeenLocation", lastSeenLocation);
    if (lastSeenDate) formData.append("lastSeenDate", lastSeenDate);
    if (clothingDescription) formData.append("clothingDescription", clothingDescription);
  } else {
    const category = document.getElementById("category").value;
    const color = document.getElementById("color").value;
    
    if (category) formData.append("category", category);
    if (color) formData.append("color", color);
  }
  
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/reports`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert(data.message);
      document.getElementById("reportForm").reset();
      loadReports();
    } else {
      alert(data.error || "Failed to create report");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// Filter Reports
function filterReports(filter) {
  currentFilter = filter;
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
  loadReports();
}

// Load Reports
async function loadReports() {
  try {
    let url = `${apiUrl}/reports`;
    const params = new URLSearchParams();
    
    if (currentFilter === "person") {
      params.append("type", "person");
    } else if (currentFilter === "item") {
      params.append("type", "item");
    } else if (currentFilter === "active") {
      params.append("found", "false");
    } else if (currentFilter === "found") {
      params.append("found", "true");
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const res = await fetch(url);
    const reports = await res.json();
    
    const container = document.getElementById("reportsContainer");
    container.innerHTML = "";
    
    if (reports.length === 0) {
      container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">No reports found</p>';
      return;
    }
    
    reports.forEach((r) => {
      const card = document.createElement("div");
      card.classList.add("report-card");
      
      // Badge
      let badgeClass = r.reportType === "person" ? "badge-person" : "badge-item";
      let badgeText = r.reportType === "person" ? "👤 Person" : "📦 Item";
      
      if (r.found) {
        badgeClass = "badge-found";
        badgeText = "✓ Found";
      }
      
      let personInfo = "";
      if (r.reportType === "person") {
        personInfo = `
          ${r.age ? `<p><span class="info-label">Age:</span> ${r.age}</p>` : ""}
          ${r.lastSeenLocation ? `<p><span class="info-label">Last Seen:</span> ${r.lastSeenLocation}</p>` : ""}
          ${r.lastSeenDate ? `<p><span class="info-label">Date:</span> ${new Date(r.lastSeenDate).toLocaleDateString()}</p>` : ""}
          ${r.clothingDescription ? `<p><span class="info-label">Clothing:</span> ${r.clothingDescription}</p>` : ""}
        `;
      }
      
      let itemInfo = "";
      if (r.reportType === "item") {
        itemInfo = `
          ${r.category ? `<p><span class="info-label">Category:</span> ${r.category}</p>` : ""}
          ${r.color ? `<p><span class="info-label">Color:</span> ${r.color}</p>` : ""}
        `;
      }
      
      // Check if current user is the owner
      const isOwner = currentUser && r.owner._id === currentUser.id;
      
      let actions = "";
      if (isOwner && !r.found) {
        actions = `
          <div class="report-actions">
            <button class="btn-found" onclick="markAsFound('${r._id}')">Mark as Found</button>
            <button class="btn-delete" onclick="deleteReport('${r._id}')">Delete</button>
          </div>
        `;
      } else if (isOwner && r.found) {
        actions = `
          <div class="report-actions">
            <button class="btn-delete" onclick="deleteReport('${r._id}')">Delete</button>
          </div>
        `;
      }
      
      card.innerHTML = `
        <div class="report-badge ${badgeClass}">${badgeText}</div>
        ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.name}" />` : ""}
        <h3>${r.name}</h3>
        <p>${r.description}</p>
        <p><span class="info-label">Location:</span> ${r.location}</p>
        ${personInfo}
        ${itemInfo}
        <p><span class="info-label">Reported:</span> ${new Date(r.createdAt).toLocaleDateString()}</p>
        <div class="contact-info">
          <p><span class="info-label">Contact:</span> ${r.contactName || r.owner.name}</p>
          <p><span class="info-label">Phone:</span> ${r.contactPhone || r.owner.phone}</p>
          ${r.contactEmail || r.owner.email ? `<p><span class="info-label">Email:</span> ${r.contactEmail || r.owner.email}</p>` : ""}
        </div>
        ${actions}
      `;
      
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading reports:", err);
    alert("Failed to load reports");
  }
}

// Mark as Found
async function markAsFound(id) {
  if (!confirm("Mark this report as found?")) return;
  
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/reports/${id}/found`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert(data.message);
      loadReports();
    } else {
      alert(data.error || "Failed to mark as found");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// Delete Report
async function deleteReport(id) {
  if (!confirm("Are you sure you want to delete this report?")) return;
  
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/reports/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert(data.message);
      loadReports();
    } else {
      alert(data.error || "Failed to delete report");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// Initialize
checkAuth();