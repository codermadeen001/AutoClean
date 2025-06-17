// Configuration
const BASE_URL = "http://localhost:8000/api";

// Global variables
let allUsers = [];
let filteredUsers = [];

// Toast Container Setup (ensure it exists)
function ensureToastContainer() {
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
}

// Utility Functions
function showToast(message, type = 'info') {
    ensureToastContainer();
    const toastContainer = document.getElementById('toastContainer');
    const toastId = `toast-${Date.now()}`;
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    // Insert new toast at the beginning
    toastContainer.insertAdjacentHTML('afterbegin', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    
    // Auto-remove after hide
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
    
    toast.show();
}

// Fetch Users
async function fetchUsers() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/get-all-users/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || response.statusText;
            console.error("Server Response Error:", errorMessage);
            createToast( errorMessage, "error");
            return;
        }

        const data = await response.json();
        console.log("Fetched Users Data:", data);

        if (data.success) {
            allUsers = data.results || [];
            filteredUsers = [...allUsers];
            renderUsers(filteredUsers);
            updateUserStats(allUsers);
        } else {
            createToast(data.message || 'Failed to fetch users', 'error');
        }
    } catch (error) {
        console.error('Fetch Users Error:', error);
        createToast('Network Error! Unable to connect to backend.', 'error');
    }
}

// Update User Stats
function updateUserStats(users) {
    try {
        const totalUsers = users.length;
        const activeUsers = users.filter(user => !user.suspended).length;
        const suspendedUsers = users.filter(user => user.suspended).length;
        const newUsers = users.filter(user => {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return new Date(user.created_at) >= oneWeekAgo;
        }).length;

        // Update stats cards
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('suspendedUsers').textContent = suspendedUsers;

        // Update filter button counts
        document.getElementById('countAll').textContent = totalUsers;
        document.getElementById('countActive').textContent = activeUsers;
        document.getElementById('countSuspended').textContent = suspendedUsers;
        document.getElementById('countNew').textContent = newUsers;
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
}

// Render User Cards
function renderUsers(users) {
    const container = document.getElementById('usersContainer');
    container.innerHTML = ''; // Clear existing content

    if (users.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No users found matching your criteria</h5>
            </div>
        `;
        return;
    }

    // Create a row div
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';

    users.forEach((user, index) => {
        // Start a new row every 3 users (for md screens)
        if (index % 3 === 0 && index !== 0) {
            container.appendChild(rowDiv.cloneNode());
            rowDiv.innerHTML = '';
        }

        const userCard = createUserCard(user);
        rowDiv.appendChild(userCard);
    });

    // Add the remaining users
    if (rowDiv.children.length > 0) {
        container.appendChild(rowDiv);
    }
}
/*
// Create Single User Card
function createUserCard(user) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 mb-4';

    const status = user.suspended ? 'suspended' : 'active';
    const badgeClass = status === 'active' ? 'badge-active' : 'badge-suspended';
    const defaultImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    col.innerHTML = `
        <div class="user-card">
            <img src="${user.img_url || defaultImage}" alt="${user.name}" class="user-card-img">
            <div class="user-card-body">
                <h5 class="user-card-name">${user.name || "No Name"}</h5>
                <p class="user-card-email">${user.email || "No Email"}</p>
                <span class="badge ${badgeClass} mb-3">${status}</span>
                <div class="dropdown custom-dropdown">
                    <button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-cog"></i> Manage
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item ${status === 'active' ? 'text-warning' : 'text-success'}" href="#" data-action="toggleStatus" data-id="${user.id}">
                                <i class="fas ${status === 'active' ? 'fa-user-slash' : 'fa-user-check'}"></i> ${status === 'active' ? 'Suspend' : 'Activate'}
                            </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item text-danger" href="#" data-action="delete" data-id="${user.id}">
                                <i class="fas fa-trash-alt"></i> Delete
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    return col;
}

*/


function createUserCard(user) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 mb-4';

    const isSuspended = user.status; // Assuming status is boolean (true = suspended)
    const statusText = isSuspended ? 'suspended' : 'active';
    const badgeClass = isSuspended ? 'badge-suspended' : 'badge-active';
    const actionText = isSuspended ? 'Activate' : 'Suspend';
    const actionIcon = isSuspended ? 'fa-user-check' : 'fa-user-slash';
    const actionColor = isSuspended ? 'text-success' : 'text-warning';
    const defaultImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    col.innerHTML = `
        <div class="user-card ${isSuspended ? 'suspended-user' : ''}">
            <img src="${user.img_url || defaultImage}" alt="${user.name}" class="user-card-img">
            <div class="user-card-body">
                <span class="badge ${badgeClass} mb-2">${statusText}</span>
                <h5 class="user-card-name">${user.name || "No Name"}</h5>
                <p class="barber-email">${user.email || "No Email"}</p>
                
                <div class="dropdown custom-dropdown">
                    <button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-cog"></i> Manage
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item ${actionColor}" href="#" data-action="toggleStatus" data-id="${user.id}">
                                <i class="fas ${actionIcon}"></i> ${actionText}
                            </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item text-danger" href="#" data-action="delete" data-id="${user.id}">
                                <i class="fas fa-trash-alt"></i> Delete
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    return col;
}



// Filter Users
function filterUsers() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    filteredUsers = allUsers.filter(user => {
        const matchesSearch = 
            (user.name && user.name.toLowerCase().includes(searchValue)) || 
            (user.email && user.email.toLowerCase().includes(searchValue)) || 
            (user.id && user.id.toString().includes(searchValue));
        
        const userStatus = user.suspended ? 'suspended' : 'active';
        let matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
        
        // Special case for 'new' filter
        if (statusFilter === 'new') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            matchesStatus = new Date(user.created_at) >= oneWeekAgo;
        }
        
        return matchesSearch && matchesStatus;
    });

    renderUsers(filteredUsers);
}

// Setup Filter Buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('#filterButtons button');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update dropdown filter to match
            const status = this.dataset.status;
            document.getElementById('statusFilter').value = status;
            
            // Apply filter
            filterUsers();
        });
    });
}


async function toggleUserStatus(userId, action) { // Added action parameter
    try {
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        const user = allUsers.find(u => u.id == numericUserId);
        
        if (!user) {
            console.error('User not found in local data. ID:', userId);
            createToast('User not found in local data', 'danger');
            return;
        }

        const token = localStorage.getItem("token");
        
        // Determine the action based on current status if action not provided
        const requestedAction = action || (user.status ? 'activate' : 'suspend');
        
        const response = await fetch(`${BASE_URL}/updateStatus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: numericUserId,
                status: requestedAction // 'suspend' or 'activate'
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update status');
        }

        const data = await response.json();
        
        if (data.success) {
            // Update local data
            user.status = data.data.status; // boolean true/false
            
            // Re-render with current filters
            filterUsers();
            updateUserStats(allUsers);
            
            createToast(data.message, 'success');
        } else {
            createToast(data.message || 'Failed to update user status', 'error');
        }
    } catch (error) {
        console.error('Toggle User Status Error:', error);
        createToast(error.message || 'Error updating user status', 'error');
    }
}


// Delete User
async function deleteUser(userId) {
    try {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/deleteUser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete user');
        }

        const data = await response.json();
        
        if (data.success) {
            // Remove from local data
            allUsers = allUsers.filter(user => user.id !== userId);
            filteredUsers = filteredUsers.filter(user => user.id !== userId);
            
            renderUsers(filteredUsers);
            updateUserStats(allUsers);
            
            createToast('User deleted successfully', 'success');
        } else {
            createToast(data.message || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Delete User Error:', error);
        createToast(error.message || 'Error deleting user', 'error');
    }
}

// Event Listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(filterUsers, 300));
    
    // Status dropdown filter
    document.getElementById('statusFilter').addEventListener('change', filterUsers);
    
    // Setup filter buttons
    setupFilterButtons();
    
    // User action buttons (suspend/delete)
    document.addEventListener('click', function(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        
        event.preventDefault();
        const action = target.dataset.action;
        const userId = target.dataset.id;
        
        if (action === 'toggleStatus') {
            toggleUserStatus(userId);
        } else if (action === 'delete') {
            deleteUser(userId);
        }
    });
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    ensureToastContainer();
    setupEventListeners();
    fetchUsers();
    loadClientStats();
});

// Add new client
document.getElementById("addClientForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const token = localStorage.getItem("token");
    
    if (!email) {
       createToast("Please enter a valid email address", "error");
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/client/create`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            createToast(data.message || 'Failed to add client',"error");
        }

        if (data.success) {
            createToast("User added successfully", "success");
            // Reset form
            event.target.reset();
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            // Refresh the user list
            fetchUsers();
        } else {
            createToast(data.message || 'Failed to add client', 'errror');
        }
    } catch (error) {
        console.error('Add Client Error:', error);
        createToast(error.message || "Network Error! Unable to connect to backend.", "error");
    }
});

// Load client stats
async function loadClientStats() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BASE_URL}/client-stats`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            createToast(errorData.message || 'Failed to load stats','error');
        }

        const data = await response.json();

        if (data.success) {
            document.getElementById('totalUsers').textContent = data.total_clients || 0;
            document.getElementById('activeUsers').textContent = data.active_clients || 0;
            document.getElementById('suspendedUsers').textContent = data.suspended_clients || 0;
       
            // Update filter button counts
            document.getElementById('countAll').textContent = data.total_clients || 0;
            document.getElementById('countActive').textContent = data.active_clients || 0;
            document.getElementById('countSuspended').textContent = data.suspended_clients || 0;
            document.getElementById('countNew').textContent = data.new_clients || 0;
        }
    } catch (error) {
        console.error('Error loading client stats:', error);
        createToast("Error loading statistics: " + error.message, "error");
    }
}