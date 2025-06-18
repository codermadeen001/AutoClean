// Base API URL
const API_BASE_URL = 'https://backend-carwash-mx6p.onrender.com/api';
//https://car-wash-backend-bfew.onrender.com

// Global variables
let selectedPackage = {};
let currentRating = 0;
let userData = {};
let washerData = [];
let locationData = [];
let packageData = [];
let activeBookings = [];
let pastBookings = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;
    
    // Add event listeners
    initializeEventListeners();
    
    // Load initial data
    loadInitialData();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Book now buttons (will be added dynamically)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('book-now-btn')) {
            const packageId = parseInt(e.target.dataset.packageId);
            // Map static package IDs to dynamic ones
            const packageMap = {1: 1, 2: 2, 3: 3}; // Static ID to DB ID mapping
            const dbPackageId = packageMap[packageId];
            const package = packageData.find(p => p.id == dbPackageId);
            
            if (package) {
                selectedPackage = package;
                
                document.getElementById('selectedPackageName').textContent = package.package_type;
                document.getElementById('summaryPackage').textContent = package.package_type;
                document.getElementById('summaryDuration').textContent = `${package.duration} minutes`;
                document.getElementById('summaryTotal').textContent = `Ksh ${package.price}`;
                
                new bootstrap.Modal(document.getElementById('bookingModal')).show();
            }
        }
    });

    // Confirm booking button
    document.getElementById('confirmBookingBtn').addEventListener('click', function() {
        if (validateBookingForm()) {
            processBooking();
        }
    });

    // Feedback button
    document.querySelector('button.btn-outline-primary').addEventListener('click', function(e) {
        e.preventDefault();
        new bootstrap.Modal(document.getElementById('feedbackModal')).show();
    });

    /*
    // Rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            setRating(rating);
        });
    });
*/
    // Submit feedback button
    document.getElementById('submitFeedbackBtn').addEventListener('click', function() {
        if (validateFeedbackForm()) {
            submitFeedback();
        }
    });

    // Form field updates
    document.getElementById('bookingDate').addEventListener('change', updateBookingSummary);
    document.getElementById('bookingTime').addEventListener('change', updateBookingSummary);
    document.getElementById('selectedLocation').addEventListener('change', updateBookingSummary);

    // Package search
    document.getElementById('packageSearchInput').addEventListener('input', function() {
        filterPackages(this.value);
    });

    // Smooth scrolling for navigation
    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Feedback modal show event
    document.getElementById('feedbackModal').addEventListener('show.bs.modal', function() {
        loadFeedbackMessages();
    });
}

// Load all initial data
async function loadInitialData() {
    try {
        // Load user data
        const token = localStorage.getItem("token");
       /* const userResponse = await fetch(`${API_BASE_URL}/user`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (userResponse.ok) {
            userData = await userResponse.json();
            document.getElementById('userName').textContent = userData.name || 'User';
            document.querySelector('.userProfile').src = userData.img_url ;
        }*/

        // Load dashboard stats
        const statsResponse = await fetch(`${API_BASE_URL}/user-stats`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateDashboardStats(stats);
        }
        
        // Load packages
        const packagesResponse = await fetch(`${API_BASE_URL}/get/services`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (packagesResponse.ok) {
            packageData = await packagesResponse.json();
            // Keep static packages but update their prices from API
            updateStaticPackagePrices();
        }
        
        // Load washers and locations
        const washersResponse = await fetch(`${API_BASE_URL}/get/washers`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (washersResponse.ok) {
            washerData = await washersResponse.json();
        }
        
        const locationsResponse = await fetch(`${API_BASE_URL}/washing-points`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (locationsResponse.ok) {
            locationData = await locationsResponse.json();
            populateWasherAndLocationDropdowns();
        }
         
        // Load active and past bookings
        const activeResponse = await fetch(`${API_BASE_URL}/bookings/active`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (activeResponse.ok) {
            activeBookings = await activeResponse.json();
            renderActiveBookings(activeBookings);
        }
        
        const pastResponse = await fetch(`${API_BASE_URL}/bookings/past`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (pastResponse.ok) {
            pastBookings = await pastResponse.json();
            renderPastBookings(pastBookings);
        }
       
    } catch (error) {
        console.error('Error loading initial data:', error);
        createToast("Failed to load data. Please try again.", "error");
    }
}





// Update static package prices with dynamic data from API
function updateStaticPackagePrices() {
    // Map static package IDs to dynamic ones
    const packageMap = {
        1: 1, // Basic Wash
        2: 2, // Standard Wash
        3: 3  // Premium Wash
    };
    
    // Update prices in the UI
    document.querySelectorAll('.book-now-btn').forEach(btn => {
        const staticId = parseInt(btn.dataset.packageId);
        const dbId = packageMap[staticId];
        const package = packageData.find(p => p.id == dbId);
        
        if (package) {
            // Update the price display
            const priceElement = btn.closest('.d-flex').querySelector('.package-price');
            if (priceElement) {
                priceElement.textContent = `Ksh ${package.price}`;
            }
            
            // Update the button data attributes
            btn.dataset.packageId = staticId; // Keep static ID for UI
        }
    });
}

// Update dashboard stats
function updateDashboardStats(stats) {
    document.getElementById('activeBookingsCount').textContent = stats.activeBookings || 0;
    document.getElementById('totalBookings').textContent = stats.totalBookings || 0;
    document.getElementById('totalSpent').textContent = `Ksh ${(stats.totalSpent || 0).toLocaleString()}`;
    document.getElementById('membership').textContent = stats.membership || 'Basic';
}

// Populate washer and location dropdowns
function populateWasherAndLocationDropdowns() {
    const washerSelect = document.getElementById('selectedWasher');
    const locationSelect = document.getElementById('selectedLocation');
    
    // Clear existing options
    washerSelect.innerHTML = '<option value="">Choose your washer</option>';
    locationSelect.innerHTML = '<option value="">Choose location</option>';
    
    // Add washers
    washerData.forEach(washer => {
        const option = document.createElement('option');
        option.value = washer.id;
        option.textContent = `${washer.name} - ⭐ ${washer.rating || '4.5'} `;
        washerSelect.appendChild(option);
    });
    
    // Add locations
    locationData.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        let locationText = `${location.location_name} `;
        if (location.mobile) {
            locationText += ' (+Ksh 200)';
        }
        option.textContent = locationText;
        locationSelect.appendChild(option);
    });
}

// Render active bookings
function renderActiveBookings(bookings) {
    const container = document.getElementById('activeRentalsSection');
    container.innerHTML = '';
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4 class="mb-3">Active Wash Services</h4>
                <div style="font-size: 3rem;">😴</div>
                <p class="text-muted">No active wash services</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="col-12">
            <h4 class="mb-3">Active Wash Services</h4>
        </div>
    `;
    
    bookings.forEach(booking => {
        const bookingCol = document.createElement('div');
        bookingCol.className = 'col-lg-6 col-md-12 mb-3';
        
        // Determine icon based on service ID
        let icon;
        if (booking.service.id == 1) {
            icon = "fa-spray-can";
        } else if (booking.service.id == 2) {
            icon = 'fa-car';
        } else if (booking.service.id == 3) {
            icon = "fa-gem";
        } else {
            icon = "fa-car";
        }
        
        // Calculate progress
        const progress = calculateBookingProgress(booking);
        
        bookingCol.innerHTML = `
           <div class="dashboard-card">
    <div class="row align-items-center">
        <div class="col-md-3 text-center">
            <div class="package-icon-container" style="height: 80px; width: 80px; margin: 0 auto;">
                <i class="fas ${icon}" style="font-size: 2rem;"></i>
            </div>
        </div>
        <div class="col-md-6">
            <h5 class="mb-2">${booking.service.package_type}</h5>
            <div class="washer-info-container">
                <img src="${booking.washer.img_url || 'https://via.placeholder.com/50'}" 
                     class="washer-img" 
                     alt="Washer Image">
                <p class="washer-name">${booking.washer.name}</p>
            </div>
            <p class="text-muted mb-1">
                Location: <a href="https://maps.google.com/?q=${encodeURIComponent(booking.washing_point.location_url)}" target="_blank">
                    ${booking.washing_point.location_name}
                </a>
            </p>
            <p class="text-muted mb-1">Car: ${booking.plate_number || 'Not specified'}</p>
            <small class="${getStatusClass(booking.status)}">
                <i class="fas fa-clock me-1"></i>
                ${getStatusText(booking)}
            </small>
        </div>
        <div class="col-md-3 text-center">
            <div class="mb-2">
                <span class="booking-badge ${getStatusClass(booking.status)}">${booking.status}</span>
            </div>
            ${progress > 0 ? `
            <div class="progress mb-2">
                <div class="progress-bar ${getProgressBarClass(booking.status)}" style="width: ${progress}%"></div>
            </div>
            ` : ''}
            <div class="action-buttons">
                ${booking.status === 'Scheduled' ? `
                <button class="btn btn-outline-primary" title="Reschedule" onclick="rescheduleBooking('${booking.id}')">
                    <i class="fas fa-calendar-alt"></i>
                </button>
                <button class="btn btn-outline-danger" title="Cancel" onclick="cancelBooking('${booking.id}')">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
                ${booking.status === 'In Progress' || booking.status === 'active' ? `
                <button class="btn btn-outline-primary" title="Track Service" onclick="trackBooking('${booking.id}')">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button class="btn btn-outline-success" title="Call Washer" onclick="callWasher('${booking.washer.contact}')">
                    <i class="fas fa-phone"></i>
                </button>
                ` : ''}
            </div>
        </div>
    </div>
</div>
        `;
        container.appendChild(bookingCol);
    });
}







function renderPastBookings(bookings) {
    const container = document.querySelector('.pastbookings');
    
    if (!container) {
        console.error('Past bookings container not found');
        return;
    }
    
    // Clear existing content
    container.innerHTML = `
        <h3 class="mb-4">Recent Bookings</h3>
        <div class="dashboard-card">
            <div class="table-responsive">
                <table class="table table-hover bookings">
                    <thead>
                        <tr>
                            <th>Package</th>
                            <th>Date</th>
                            <th>Washer</th>
                            <th>Status</th>
                            <th>Cost</th>
                        </tr>
                    </thead>
                    <tbody class="bookings-body" id="bookingsTableBody">
                        <!-- Rows will be inserted here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    const tableBody = document.getElementById('bookingsTableBody');
    
    if (!bookings || bookings.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="5" class="text-center py-5">
                    <div style="font-size: 3rem;">📭</div>
                    <p class="text-muted">No recent washes found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Clear any existing rows
    tableBody.innerHTML = '';
    
    bookings.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.service.package_type}</td>
            <td>${formatDateTime(booking.time)}</td>
            <td>${booking.washer.name}</td>
            <td><span class="booking-badge ${getStatusClass(booking.status)}">${booking.status}</span></td>
            <td>Ksh ${booking.price}</td>
        `;
        tableBody.appendChild(row);
    });
}





























// Load feedback messages
async function loadFeedbackMessages() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/my-feedback`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (response.ok) {
            const feedbackList = await response.json();
            renderFeedbackMessages(feedbackList.data);
        } else {
            throw new Error('Failed to load feedback');
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
        createToast("Failed to load feedback. Please try again.", "error");
    }
}

// Render feedback messages in modal
function renderFeedbackMessages(feedbackList) {
    const modalBody = document.querySelector('#feedbackModal .modal-body');
    
    // Create or update feedback messages container
    let messagesContainer = modalBody.querySelector('#feedbackMessagesContainer');
    if (!messagesContainer) {
        messagesContainer = document.createElement('div');
        messagesContainer.id = 'feedbackMessagesContainer';
        messagesContainer.style.maxHeight = '300px';
        messagesContainer.style.overflowY = 'auto';
        messagesContainer.style.marginBottom = '20px';
        modalBody.insertBefore(messagesContainer, modalBody.querySelector('form'));
    }
    
    messagesContainer.innerHTML = '';
    
    if (!feedbackList || feedbackList.length === 0) {
        messagesContainer.innerHTML += '<p class="text-muted">No feedback messages yet.</p>';
        return;
    }
    
    feedbackList.forEach(feedback => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'card mb-2';
        messageDiv.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex justify-content-between">
                    <div>
                        <div>${feedback.feedback}</div>
                        <small class="text-muted">${formatDateTime(feedback.created_at)}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger delete-feedback" data-id="${feedback.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
    });
    
    // Add event listeners to delete buttons    <strong>${feedback.id}</strong>
    document.querySelectorAll('.delete-feedback').forEach(btn => {
        btn.addEventListener('click', function() {
            const feedbackId = this.dataset.id;
            deleteFeedbackMessage(feedbackId);
        });
    });
}

// Delete feedback message
async function deleteFeedbackMessage(feedbackId) {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (response.ok) {
            createToast('Feedback deleted successfully', 'success');
            // Reload messages without closing modal
            loadFeedbackMessages();
        } else {
            createToast('Failed to delete feedback', 'error');
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        createToast("Failed to delete feedback. Please try again.", "error");
    }
}

// Validate booking form
function validateBookingForm() {
    const form = document.getElementById('bookingForm');
    const requiredFields = form.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            createToast('Please fill in all required fields.', 'error');
            return false;
        }
    }
    return true;
}

// Process booking
async function processBooking() {
    const confirmBtn = document.getElementById('confirmBookingBtn');
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    confirmBtn.disabled = true;
    
    try {
        // Prepare booking data
        const bookingData = {
            packageId: selectedPackage.id,
            locationId: document.getElementById('selectedLocation').value,
            washerId: document.getElementById('selectedWasher').value,
            time: `${document.getElementById('bookingDate').value} ${document.getElementById('bookingTime').value}:00`,
            plate_number: document.getElementById('carDetails').value,
            price: selectedPackage.price,
            //special_instructions: document.getElementById('specialInstructions').value,
            payment_method: document.querySelector('input[name="paymentMethod"]:checked').value
        };

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bookingData)
        });
        
        const bookingResult = await response.json();
        if(bookingResult.success==true){
            // Hide booking modal
            bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        
            // Show success modal with booking details
            showBookingSuccess(bookingResult);
        
           // Refresh bookings
           loadInitialData();
           createToast(bookingResult.message,'success')
        }else{
              createToast(bookingResult.message,'error')
        }
        
    } catch (error) {
        console.error('Error processing booking:', error);
        createToast(error.message || "Failed to process booking. Please try again.", "error");
    } finally {
        confirmBtn.innerHTML = 'Confirm Booking';
        confirmBtn.disabled = false;
    }
}

function showBookingSuccess(bookingResult) {
    const successModal = document.getElementById('bookingSuccessModal');
    const details = bookingResult.data.booking_details;

    successModal.querySelector('h3').textContent = 'Booking Confirmed!';
    successModal.querySelector('p').textContent = 
        `Your ${selectedPackage.package_type} has been booked for ${formatDateTime(details.date_time)}. ` +
        `Car detailer: ${details.washer}. You'll receive a confirmation shortly.`;

    new bootstrap.Modal(successModal).show();
}

// Submit feedback
async function submitFeedback() {
    const submitBtn = document.getElementById('submitFeedbackBtn');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    try {
        const feedbackData = {
           // type: document.getElementById('feedbackType').value,
           // rating: currentRating,
            message: document.getElementById('feedbackMessage').value,
           // name: document.getElementById('customerName').value || 'Anonymous',
           // email: document.getElementById('customerEmail').value,
           // allow_contact: document.getElementById('allowContact').checked
        };
        
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/feedback/add`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(feedbackData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        createToast('Thank you for your feedback!', 'success');
        
        // Reset form and reload messages


        document.getElementById('feedbackForm').reset();
        //setRating(0);
        loadFeedbackMessages();
        
    } catch (error) {
        console.error('Error submitting feedback:', error);
        createToast("Failed to submit feedback. Please try again.", "error");
    } finally {
        submitBtn.innerHTML = 'Submit Feedback';
        submitBtn.disabled = false;
    }
}
/*
// Helper functions
function setRating(rating) {
    currentRating = rating;
    document.querySelectorAll('.rating-btn').forEach((btn, index) => {
        if (index < rating) {
            btn.classList.remove('btn-outline-warning');
            btn.classList.add('btn-warning');
        } else {
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-outline-warning');
        }
    });
}
*/

function updateBookingSummary() {
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const locationId = document.getElementById('selectedLocation').value;
    const location = locationData.find(loc => loc.id == locationId);
    
    // Update date and time
    if (date && time) {
        const formattedDate = new Date(date).toLocaleDateString();
        const formattedTime = formatTime(time);
        document.getElementById('summaryDateTime').textContent = `${formattedDate} ${formattedTime}`;
    }
    
    // Update location and calculate total
    let total = selectedPackage.price || 0;
    if (location) {
        document.getElementById('summaryLocation').textContent = `${location.location_name} - ${location.location_url}`;
        
        // Add mobile service fee
        if (location.mobile) {
            total += 200;
        }
    }
    
    document.getElementById('summaryTotal').textContent = `Ksh ${total.toLocaleString()}`;
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function formatDateTime(dateTimeString) {
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString('en-US', options);
}

function filterPackages(searchTerm) {
    const packages = document.querySelectorAll('#packagesContainer .col-lg-4');
    
    packages.forEach(package => {
        const title = package.querySelector('.package-title').textContent.toLowerCase();
        const subtitle = package.querySelector('.package-subtitle').textContent.toLowerCase();
        const features = Array.from(package.querySelectorAll('.package-feature span'))
            .map(span => span.textContent.toLowerCase()).join(' ');
        
        const searchContent = `${title} ${subtitle} ${features}`;
        
        if (searchContent.includes(searchTerm.toLowerCase())) {
            package.style.display = 'block';
        } else {
            package.style.display = 'none';
        }
    });
}

function calculateBookingProgress(booking) {
    if (booking.status !== 'In Progress' && booking.status !== 'active') return 0;
    
    const startTime = new Date(booking.time);
    const endTime = new Date(startTime.getTime() + (booking.service.duration * 60000));
    const now = new Date();
    
    if (now < startTime) return 0;
    if (now > endTime) return 100;
    
    const totalDuration = endTime - startTime;
    const elapsed = now - startTime;
    return Math.round((elapsed / totalDuration) * 100);
}

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'active':
        case 'in progress':
            return 'active';
        case 'completed':
            return 'completed';
        case 'scheduled':
            return 'pending';
        case 'cancelled':
            return 'cancelled';
        default:
            return '';
    }
}

function getProgressBarClass(status) {
    switch(status.toLowerCase()) {
        case 'active':
        case 'in progress':
            return 'bg-success';
        case 'scheduled':
            return 'bg-warning';
        default:
            return 'bg-primary';
    }
}

function getStatusText(booking) {
    if (booking.status === 'In Progress' || booking.status === 'active') {
        const startTime = new Date(booking.time);
        const endTime = new Date(startTime.getTime() + (booking.service.duration * 60000));
        const now = new Date();
        
        if (now < startTime) {
            return `Scheduled for ${formatDateTime(booking.time)}`;
        } else {
            const elapsed = Math.floor((now - startTime) / 60000); // minutes
            const remaining = Math.floor((endTime - now) / 60000); // minutes
            return `Started ${elapsed} min ago • Est. ${remaining} min remaining`;
        }
    } else if (booking.status === 'Scheduled') {
        return `Scheduled for ${formatDateTime(booking.time)}`;
    }
    return booking.status;
}

// Booking actions
function rescheduleBooking(bookingId) {
    console.log('Reschedule booking:', bookingId);
    createToast("Reschedule feature coming soon!", "info");
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        console.log('Cancel booking:', bookingId);
        // Implement API call to cancel booking
        createToast("Booking cancellation feature coming soon!", "info");
    }
}

function trackBooking(bookingId) {
    console.log('Track booking:', bookingId);
    createToast("Tracking feature coming soon!", "success");
}

function callWasher(phoneNumber) {
    console.log('Call washer:', phoneNumber);
    // This would actually initiate a phone call in a real app
    createToast(`Calling washer at ${phoneNumber}`, "success");
}

/*
// Toast functionality
function createToast(message, type) {
    // Remove any existing toasts first
    const existingToasts = document.querySelectorAll('.toast-container');
    existingToasts.forEach(toast => toast.remove());

    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    
    // Add appropriate class based on type
    if (type === 'error') {
        toastContainer.innerHTML = `
            <div class="toast-error">
                <strong>Error</strong>
                <div class="toast-message">${message}</div>
                <button type="button" class="toast-close">×</button>
            </div>
        `;
    } else if (type === 'success') {
        toastContainer.innerHTML = `
            <div class="toast-success">
                <strong>Success</strong>
                <div class="toast-message">${message}</div>
                <button type="button" class="toast-close">×</button>
            </div>
        `;
    } else if (type === 'info') {
        toastContainer.innerHTML = `
            <div class="toast-info">
                <strong>Info</strong>
                <div class="toast-message">${message}</div>
                <button type="button" class="toast-close">×</button>
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
}



// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

*/

// Validate feedback form
function validateFeedbackForm() {
    const message = document.getElementById('feedbackMessage').value;
    
    if (!message.trim()) {
        createToast('Please enter your feedback message', 'error');
        document.getElementById('feedbackMessage').focus();
        return false;
    }
    
    return true;
}

//submitFeedback() 