// Base API URL
const API_BASE_URL = 'http://localhost:8000/api';

// Global variables
let selectedPackage = {};
let packageData = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check if required elements exist
    if (!document.querySelector('.toast-container')) {
        console.error('Toast container not found');
        return;
    }

    // Load initial data
    loadInitialData();
    
    // Add event listeners
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Book now buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('book-now-btn')) {
            const packageId = parseInt(e.target.dataset.packageId);
            const package = packageData.find(p => p.id === packageId);
            
            if (package) {
                selectedPackage = package;
                console.log('Selected package:', package);
                createToast(`Selected package: ${package.package_type} (Ksh ${package.price})`, 'info');
            }
        }
    });
}

// Load all initial data
async function loadInitialData() {
    try {
        // Load package prices
        const prices = await fetchPackagePrices();
        if (prices) {
            packageData = prices;
            updatePackagePrices(prices);
        }

        // Load past bookings if the element exists
        if (document.querySelector('#bookings tbody')) {
            const pastBookings = await fetchPastBookings();
            if (pastBookings) {
                renderPastBookings(pastBookings);
            }
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
        createToast("Failed to load data. Please try again.", "error");
    }
}

// Fetch package prices from API
async function fetchPackagePrices() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/prices/fetch`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                return data.data;
            }
        }
        throw new Error('Failed to fetch package prices');
    } catch (error) {
        console.error('Error fetching package prices:', error);
        createToast("Failed to load package prices", "error");
        return null;
    }
}

// Fetch past bookings from API
async function fetchPastBookings() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/bookings/past`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Failed to fetch past bookings');
    } catch (error) {
        console.error('Error fetching past bookings:', error);
        return null;
    }
}

// Update package prices in the UI
function updatePackagePrices(prices) {
    const packageCards = document.querySelectorAll('.package-card');
    if (!packageCards.length) {
        console.error('No package cards found');
        return;
    }

    prices.forEach(pkg => {
        // Find the card that matches this package
        const card = Array.from(packageCards).find(card => {
            const title = card.querySelector('.package-title')?.textContent;
            return title === pkg.package_type;
        });

        if (card) {
            // Update price display
            const priceElement = card.querySelector('.package-price');
            if (priceElement) {
                priceElement.textContent = `Ksh ${pkg.price}`;
            }
            
            // Update button data attributes
            const button = card.querySelector('.book-now-btn');
            if (button) {
                button.dataset.packageId = pkg.id;
            }
        }
    });
}

// Render past bookings in the table
function renderPastBookings(bookings) {
    const tableBody = document.querySelector('#bookings tbody');
    if (!tableBody) {
        console.error('Bookings table body not found');
        return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (!bookings || bookings.length === 0) {
        const noBookingsRow = document.createElement('tr');
        noBookingsRow.innerHTML = `
            <td colspan="5" class="text-center py-4">
                <div style="font-size: 3rem;">📭</div>
                <p class="text-muted">No past bookings found</p>
            </td>
        `;
        tableBody.appendChild(noBookingsRow);
        return;
    }
    
    bookings.forEach(booking => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${booking.service?.package_type || 'N/A'}</td>
            <td>${booking.time ? formatDateTime(booking.time) : 'N/A'}</td>
            <td>${booking.washer?.name || 'N/A'}</td>
            <td><span class="booking-badge">${booking.status || 'N/A'}</span></td>
            <td>Ksh ${booking.price || '0'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Format date time
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    
    try {
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateTimeString).toLocaleDateString('en-US', options);
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateTimeString;
    }
}

// Toast notification function
function createToast(message, type) {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.error('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-message">${message}</div>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
}








DB_CONNECTION=pgsql
DB_HOST=ep-icy-sea-a8muiw7b-pooler.eastus2.azure.neon.tech
DB_PORT=5432
DB_DATABASE=car_wash
DB_USERNAME=neondb_owner
DB_PASSWORD=npg_Sp8FKxsX1JlB
DB_SSLMODE=require
DB_OPTIONS="--options=endpoint%3Dep-icy-sea-a8muiw7b"

