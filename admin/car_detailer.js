// Global variables
let allBarbers = []; // Store all barbers for filtering
const API_BASE_URL = 'https://backend-carwash-mx6p.onrender.com/api';
let barberId;
let currentShift;

// Load barber statistics from server (fallback if available)
async function loadBarberStats() {
    try {
        const response = await fetch('https://backend-carwash-mx6p.onrender.com/api/washer-stats');
        const data = await response.json();
        
        if (data.success && data.data) {
            // Update stats cards
            const statsElements = document.querySelectorAll('.stat-value');
            if (statsElements.length >= 4) {
                statsElements[0].textContent = data.data.total_barbers;
                statsElements[1].textContent = data.data.active_barbers;
                statsElements[2].textContent = data.data.suspended_barbers;
                statsElements[3].textContent = data.data.offline_barbers;
            }
            
            // Update filter buttons text
            const filterButtons = document.querySelectorAll('.status-filter .btn-group .btn');
            if (filterButtons.length >= 4) {
                filterButtons[0].textContent = `All (${data.data.total_barbers})`;
                filterButtons[1].textContent = `Active (${data.data.active_barbers})`;
                filterButtons[2].textContent = `Suspended (${data.data.suspended_barbers})`;
                filterButtons[3].textContent = `New Hires (${data.data.new_barbers || 0})`;
            }
        } 
    } catch (error) {
        createToast("Failed to load stats:", 'error');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadBarberStats();
    fetchBarbers();
    setupEventListeners();
    setupModalHandlers();
});

function setupModalHandlers() {
    // Initialize modal
    const addBarberModal = new bootstrap.Modal(document.getElementById('addBarberModal'));
    
    // Handle form submission
    document.getElementById("addBarberForm").addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const email = document.getElementById("barberEmail").value;
        const name = document.getElementById("barberName").value;
        
        try {
            const response = await fetch('https://backend-carwash-mx6p.onrender.com/api/washer/create', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({name, email})
            });
            
            const data = await response.json();

            if (data.success) {
                createToast(data.message || "Washer added successfully", 'success');
                document.getElementById("barberEmail").value = '';
                document.getElementById("barberName").value = '';
                addBarberModal.hide();
                fetchBarbers(); // Refresh the list
            } else {
                createToast(data.message || 'Failed to add barber', 'error');
            }
        } catch (error) {
            createToast(error.message || "An error occurred", "error");
        }
    });
    
    // Add click handler for the "Add New Barber" button
    document.querySelector('.btn-primary[data-bs-target="#addBarberModal"]').addEventListener('click', function() {
        addBarberModal.show();
    });
}

// Set up event listeners for search and filters
function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.search-bar input[type="text"]');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            const searchTerm = searchInput.value.toLowerCase();
            filterBarbers(searchTerm, document.getElementById('statusFilter').value);
        });
    }

    // Status filter dropdown
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            const searchTerm = document.querySelector('.search-bar input[type="text"]').value.toLowerCase();
            filterBarbers(searchTerm, statusFilter.value);
        });
    }

    // Status filter buttons
    const filterButtons = document.querySelectorAll('.status-filter .btn-group .btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get status from button text
            let status = 'all';
            if (button.textContent.includes('Active')) status = 'active';
            if (button.textContent.includes('Suspended')) status = 'suspended';
            if (button.textContent.includes('New')) status = 'new';
            
            // Update dropdown to match button
            document.getElementById('statusFilter').value = status;
            
            // Filter barbers
            const searchTerm = document.querySelector('.search-bar input[type="text"]').value.toLowerCase();
            filterBarbers(searchTerm, status);
        });
    });
}

// Fetch barbers from the API
async function fetchBarbers() {
    try {
        const response = await fetch('https://backend-carwash-mx6p.onrender.com/api/get-all-washers');
        if (!response.ok) {
            createToast('Failed to fetch barbers', 'error');
        }
        
        allBarbers = await response.json();
        renderBarbers(allBarbers);
        loadBarberStats();
    } catch (error) {
        console.error('Error fetching barbers:', error);
        createToast('Failed to load barbers. Please try again later.' + error.message, 'error');
    }
}

// Render barbers to the UI
function renderBarbers(barbers) {
    const container = document.getElementById('barbersContainer');
    
    if (!barbers.length) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x mb-3 text-muted"></i>
                <h5>No barbers found</h5>
                <p class="text-muted">Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    barbers.forEach(barber => {
        // Determine status class based on suspended value
        const isSuspended = barber.suspended == 1;
        const statusClass = isSuspended ? 'badge-suspended' : 'badge-active';
        const statusText = isSuspended ? 'Suspended' : 'Active';

        const availability = barber.availability == 1;
        const offlineText = availability ? 'on Duty' : 'off Duty';
        const offlineClass = availability ? 'badge-active' : 'badge-suspended';
        
        // Set button colors based on status - bright red for suspend, light green for activate
        const buttonClass = isSuspended ? 'btn-success' : 'btn-danger';
        const buttonIcon = isSuspended ? 'user-check' : 'user-slash';
        const buttonText = isSuspended ? 'Activate' : 'Suspend';
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="barber-card">
                   <div class="barber-img">
                <img src="${barber.img_url}" alt="${barber.name}">
                   </div>
                   
                    <div class="card-body">
                        <span class="badge m-2 ${statusClass}">${statusText}</span>
                        <span class="badge m-2 ${offlineClass}">${offlineText}</span>
                        <h5 class="barber-name">${barber.name}</h5>
                      
                        <div class="barber-details">
                            <p><i class="fas fa-envelope"></i> ${barber.email}</p>
                        </div>
                        <div class="barber-stats d-flex justify-content-between mb-3">
                            <div>
                                <i class="fas fa-star rating"></i> 
                                <span class="fw-bold">${barber.rating || '4.5'}</span>
                                <span class="rating-count">(${barber.reviews || '0'} reviews)</span>
                            </div>
                            <div>
                                <i class="fas fa-calendar-check text-primary me-1"></i>
                                <span class="fw-bold">${barber.appointments || '2'}</span> appointments
                            </div>
                        </div>
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-outline-primary" onclick="editBarber(${barber.id}, '${barber.shift}')">
                                <i class="fas fa-edit"></i> Edit 
                            </button>
                            <button class="btn ${buttonClass}" onclick="toggleBarberStatus(${barber.id}, ${barber.suspended})">
                                <i class="fas fa-${buttonIcon}"></i> ${buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Filter barbers based on search term and status
function filterBarbers(searchTerm, status) {
    let filteredBarbers = allBarbers;
    
    // Filter by search term
    if (searchTerm) {
        filteredBarbers = filteredBarbers.filter(barber => {
            return barber.name.toLowerCase().includes(searchTerm) || 
                   barber.email.toLowerCase().includes(searchTerm) || 
                   (barber.specialty && barber.specialty.toLowerCase().includes(searchTerm)) ||
                   (barber.id && barber.id.toString().includes(searchTerm));
        });
    }
    
    // Filter by status
    if (status && status !== 'all') {
        const isSuspended = status === 'suspended';
        filteredBarbers = filteredBarbers.filter(barber => 
            (isSuspended && barber.suspended == 1) || 
            (!isSuspended && barber.suspended == 0)
        );
    }
    
    renderBarbers(filteredBarbers);
}

// Toggle barber status (activate/suspend)
async function toggleBarberStatus(barberId, currentStatus) {
    // Convert the currentStatus to proper format for toggling (0 = active, 1 = suspended)
    const newStatus = currentStatus == 1 ? 0 : 1;
    
    try {
        const response = await fetch(`${API_BASE_URL}/accounts/toggleBarberSuspension/${barberId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            createToast('Failed to update barber status', 'error');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Update local data
            const barber = allBarbers.find(b => b.id == barberId);
            if (barber) {
                barber.suspended = newStatus;
            }
            
            loadBarberStats();
            fetchBarbers();
            createToast(data.message || `Barber ${newStatus === 0 ? 'activated' : 'suspended'} successfully`, 'success');
        } else {
            createToast(data.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        createToast(`Error: ${error.message}`, 'error');
    }
}