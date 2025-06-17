
    // Toast functionality
const createToast = (message, type) => {
    // Remove any existing toasts first
    const existingToasts = document.querySelectorAll('.toast-container');
    existingToasts.forEach(toast => toast.remove());

    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    
    // Add appropriate class based on type
    if (type === 'error') {
        toastContainer.innerHTML = `
            <div class="toast-header toast-error">
                <strong>Error</strong>
                <button type="button" class="toast-close">×</button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
    } else if (type === 'success') {
       toastContainer.innerHTML = `
            <div class="toast-header toast-success">
                <strong>Sucess</strong>
                <button type="button" class="toast-close">×</button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
    }

    // Add to document
    document.body.appendChild(toastContainer);

    // Add event listener to close button
    const closeButton = toastContainer.querySelector('.toast-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            toastContainer.remove();
        });
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toastContainer)) {
            toastContainer.remove();
        }
    }, 5000);
};













document.addEventListener('DOMContentLoaded', function() {
    // Base API URL
    const BASE_URL = 'http://localhost:8000/api';
    
    // DOM Elements
    const availabilityToggle = document.getElementById('availabilityToggle');
    const refreshButton = document.getElementById('refreshButton');
    const daySelector = document.getElementById('daySelector');
    const servicesContainer = document.getElementById('servicesContainer');
    const withdrawButton = document.getElementById('submitWithdraw');
    const withdrawAmount = document.getElementById('withdrawAmount');
    const availableBalance = document.getElementById('availableBalance');
    const washerBalance = document.getElementById('washerBalance');
    
    // Stats elements
    const todayServicesElement = document.getElementById('todayServices');
    const weeklyCarsElement = document.getElementById('weeklyCars');
    const averageRatingElement = document.getElementById('averageRating');
    const completedServicesElement = document.getElementById('completedServices');
    
    // Initialize the dashboard
    initDashboard();
    
    // Event Listeners
    availabilityToggle.addEventListener('change', toggleAvailability);
    refreshButton.addEventListener('click', initDashboard);
    daySelector.addEventListener('change', function() {
        loadServices(); // This will now be called when selector changes
    });
    withdrawButton.addEventListener('click', submitWithdrawal);
    
    // Initialize modal with current balance
    $('#withdrawModal').on('show.bs.modal', function() {
        updateAvailableBalance();
    });
    
    // Functions
    function initDashboard() {
        // Show loading state
        showLoading();
        
        // Fetch all dashboard data
        Promise.all([
            fetchDashboardStats(),
            loadServices(),
            fetchWasherBalance(),

            fetchWasherAvailability()

        ]).catch(error => {
            console.error('Error initializing dashboard:', error);
            showError('Failed to load dashboard data. Please try again.');
            createToast("Failed to load dashboard data. Please try again.","error")
        });
    }
    
    
    async function fetchDashboardStats() {
        const token = localStorage.getItem("token");

        try {
            const server_response = await fetch(`${BASE_URL}/washer/dashboard/stats`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await server_response.json();

            if (data.success==false) {
                createToast(data.message || "Failed to load dashboard data.", "error");
                return;
            }

            // Update dashboard stats
            updateElements('#todayServices', el => el.textContent = data.today_services || 0);
            updateElements('#weeklyCars', el => el.textContent = data.weekly_cars || 0);
            updateElements('#averageRating', el => el.textContent = data.average_rating );
            updateElements('#completedServices', el => el.textContent = data.completed_services || 0);

        } catch (error) {
            console.log("Error fetching dashboard stats:", error);
            createToast("Error fetching dashboard stats. Please try again later. "+error,"error");
        }

        function updateElements(selector, updateFn) {
            document.querySelectorAll(selector).forEach(el => updateFn(el));
        }
    }

    async function fetchWasherBalance() {
        const token = localStorage.getItem("token");

        try {
            const server_response = await fetch(`${BASE_URL}/washer/balance`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await server_response.json();

            if (data.success==false) {
                createToast(data.message || "Failed to load washer balance.",'error');
                return;
            }

            updateElements('#washerBalance', el => el.textContent = `Ksh ${data.balance || 0}`);
            
        } catch (error) {
            console.error("Error fetching washer balance:", error);
            createToast("Error fetching washer balance. Please try again later.", 'error');
        }

        function updateElements(selector, updateFn) {
            document.querySelectorAll(selector).forEach(el => updateFn(el));
        }
    }
    
    async function loadServices() {
        const timeframe = daySelector.value;
        let url = `${BASE_URL}/bookings`;
        
        // Adjust URL based on selected timeframe
        switch(timeframe) {
            case 'today':
                url += '/today';
                break;
            case 'tomorrow':
                url += '/tomorrow';
                break;
            case 'next7days':
                url += '/week';
                break;
        }

        const token = localStorage.getItem("token");

        try {
            showLoading();
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const bookings = await response.json();

            console.log(bookings);

            if (!response.ok || !bookings.success) {
                throw new Error(bookings.message || "Failed to load bookings.");
            }

            renderBookings(bookings);
            
        } catch (error) {
            console.error('Error fetching bookings:', error);
            servicesContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load services. Please try again.
                </div>
            `;
        }
    }



    function renderBookings(bookings) {
    if (!bookings || !bookings.data || bookings.data.length === 0) {
        servicesContainer.innerHTML = `
            <div class="text-center py-5">
                <div style="font-size: 3rem;">📭</div>
                <p class="mt-3">No bookings found</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Group bookings by status for better organization
    const groupedBookings = {
        active: [],
        completed: [],
        cancelled: []
    };
    
    bookings.data.forEach(booking => {
        if (booking.status === 'completed') {
            groupedBookings.completed.push(booking);
        } else if (booking.status === 'cancelled') {
            groupedBookings.cancelled.push(booking);
        } else {
            groupedBookings.active.push(booking);
        }
    });
    
    // Render active bookings first
    if (groupedBookings.active.length > 0) {
        html += `<h6 class="mb-3 text-primary">Active Services (${groupedBookings.active.length})</h6>`;
        groupedBookings.active.forEach(booking => {
            html += createBookingCard(booking);
        });
    }
    
    // Render completed bookings
    if (groupedBookings.completed.length > 0) {
        html += `<h6 class="mb-3 mt-4 text-success">Completed Services (${groupedBookings.completed.length})</h6>`;
        groupedBookings.completed.forEach(booking => {
            html += createBookingCard(booking);
        });
    }
    
    // Render cancelled bookings
    if (groupedBookings.cancelled.length > 0) {
        html += `<h6 class="mb-3 mt-4 text-danger">Cancelled Services (${groupedBookings.cancelled.length})</h6>`;
        groupedBookings.cancelled.forEach(booking => {
            html += createBookingCard(booking);
        });
    }
    
    servicesContainer.innerHTML = html;
    
    // Add event listeners to all complete buttons
    document.querySelectorAll('.complete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            markBookingComplete(bookingId);
        });
    });
}

function createBookingCard(booking) {
    const formattedDate = formatDate(booking.time);
    const statusClass = getStatusClass(booking.status);
    
    return `
        <div class="service-detail-card mb-3">
            <div class="service-header">
                <div class="car-image bg-secondary text-white d-flex align-items-center justify-content-center">
                    <i class="fas fa-car"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="car-model">${booking.client.name || 'Client'}</div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <span class="badge ${statusClass}">${booking.status}</span>
            </div>
            <div class="service-details">
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-car me-2"></i> Plate Number</span>
                    <span class="detail-value">${booking.plate_number || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-sparkles me-2"></i> Service</span>
                    <span class="detail-value">${booking.service.package_type}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-map-marker-alt me-2"></i> Location</span>
                    <span class="detail-value">${booking.washing_point.location_name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-money-bill-wave me-2"></i> Amount</span>
                    <span class="detail-value">Ksh ${booking.price}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-phone me-2"></i> Contact</span>
                    <span class="detail-value">${booking.client.contact}</span>
                </div>
                ${booking.status === 'active' ? `
                <div class="d-grid mt-2">
                    <button class="btn btn-sm btn-success complete-btn" data-booking-id="${booking.id}">
                        <i class="fas fa-check me-1"></i> Mark Complete
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}




    function getStatusClass(status) {
        switch(status.toLowerCase()) {
            case 'completed':
                return 'bg-success bg-opacity-10 text-success';
            case 'cancelled':
                return 'bg-danger bg-opacity-10 text-danger';
            case 'active':
                return 'bg-primary bg-opacity-10 text-primary';
            default:
                return 'bg-secondary bg-opacity-10 text-secondary';
        }
    }
    
    async function markBookingComplete(bookingId) {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${BASE_URL}/mark/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: bookingId })
            });

            const data = await response.json();

            if (!response.ok || data.success==false) {
                createToast(data.message || 'Failed to mark booking as complete','error');
            }

            // Refresh the services list, stats, and balance
            loadServices();
            fetchDashboardStats();
            fetchWasherBalance();
            createToast(data.message||"marked complete", "success")

        } catch (error) {
            console.error('Error completing booking:', error);
            createToast('Failed to mark booking as complete. Please try again.', 'error');
        }
    }


    async function toggleAvailability() {
    const isAvailable = availabilityToggle.checked;
    const token = localStorage.getItem("token");


    try {
        const response = await fetch(`${BASE_URL}/washer/availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Remove if not using Sanctum or token auth
            },
            body: JSON.stringify({ available: isAvailable })
        });

        if (!response.ok) {
            createToast('Failed to update availability',"error");
        }

        const data = await response.json();
        createToast(data.message,'success');


         updateTogglePosition(isAvailable);


        console.log('Availability updated:', data);

    } catch (error) {
        console.error('Error updating availability:', error);
        availabilityToggle.checked = !isAvailable;
        createToast('Failed to update availability. Please try again.', 'error');
    }
}




async function fetchWasherAvailability() {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${BASE_URL}/washer/availability/status`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (data.success) {
            // Update the toggle position based on availability
            updateTogglePosition(data.available);
            // Set the toggle state
            availabilityToggle.checked = data.available;
            createToast(data.available,"success")
        } else {
            createToast( data.message, "error");
        }
    } catch (error) {
        createToast( error,"error");
    }
}


function updateTogglePosition(isAvailable) {
    const toggleContainer = document.querySelector('.form-check');
    
    if (isAvailable) {
        toggleContainer.classList.add('justify-content-end');
        toggleContainer.classList.remove('justify-content-start');
    } else {
        toggleContainer.classList.add('justify-content-start');
        toggleContainer.classList.remove('justify-content-end');
    }
}


    function updateAvailableBalance() {
        fetchWasherBalance().then(() => {
            const balance = parseFloat(washerBalance.textContent.replace('Ksh ', ''));
            availableBalance.textContent = `Ksh ${balance || 0}`;
            withdrawAmount.max = balance || 0;
        });
    }
    
    function submitWithdrawal() {
        const amount = parseFloat(withdrawAmount.value);
        const method = document.getElementById('withdrawMethod').value;
        
        if (!amount || amount <= 0) {
            createToast('Please enter a valid amount',"error");
            return;
        }
        
        if (!method) {
            createToast('Please select a withdrawal method',"error");
            return;
        }
        
        createToast("This functionality is currently unavailable", "error")
       
    }
    
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    function showLoading() {
        servicesContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading services...</p>
            </div>
        `;
    }
    
    function showError(message) {
        servicesContainer.innerHTML = `
            <div class="alert alert-danger">
                ${message}
            </div>
        `;
    }


});


//createToast("True","success")