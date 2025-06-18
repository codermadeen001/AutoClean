// Toggle sidebar on mobile
                    document.addEventListener('DOMContentLoaded', function() {
                        const toggleSidebar = document.getElementById('toggle-sidebar');
                        const mobileMenuClose = document.getElementById('mobile-menu-close');
                        const sidebar = document.getElementById('sidebar');
                        const mainContent = document.getElementById('main-content');
                        const sidebarOverlay = document.getElementById('sidebar-overlay');
                        
                        // Check screen size on load
                        checkScreenSize();
                        
                        // Add event listener for window resize
                        window.addEventListener('resize', checkScreenSize);
                        
                        // Toggle sidebar for desktop (medium screens)
                        toggleSidebar.addEventListener('click', function() {
                            if (window.innerWidth <= 991.98) {
                                // For medium screens, toggle expanded class
                                sidebar.classList.toggle('expanded');
                                mainContent.classList.toggle('expanded');
                            } else {
                                // For mobile, show/hide sidebar with overlay
                                sidebar.classList.toggle('expanded');
                                sidebarOverlay.classList.toggle('active');
                            }
                        });
                        
                        // Close sidebar on mobile when clicking close button
                        mobileMenuClose.addEventListener('click', function() {
                            sidebar.classList.remove('expanded');
                            sidebarOverlay.classList.remove('active');
                        });
                        
                        // Close sidebar when clicking on overlay
                        sidebarOverlay.addEventListener('click', function() {
                            sidebar.classList.remove('expanded');
                            sidebarOverlay.classList.remove('active');
                        });
                        
                        function checkScreenSize() {
                            if (window.innerWidth <= 767.98) {
                                // Mobile view
                                toggleSidebar.style.display = 'block';
                                sidebar.classList.remove('expanded');
                                mainContent.classList.remove('expanded');
                                sidebarOverlay.classList.remove('active');
                            } else if (window.innerWidth <= 991.98) {
                                // Tablet view - collapsed sidebar by default
                                toggleSidebar.style.display = 'block';
                                sidebar.classList.remove('expanded');
                                mainContent.classList.remove('expanded');
                            } else {
                                // Desktop view - full sidebar
                                toggleSidebar.style.display = 'none';
                                sidebar.classList.add('expanded');
                                mainContent.classList.add('expanded');
                            }
                        }
                    });
                    



































































                    
const API_BASE_URL = 'https://backend-carwash-mx6p.onrender.com/api/bookings';

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
            <div class="toast-success">
                <strong>Success</strong>
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
};



// Fetch bookings data and populate the table
const fetchBookings = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/get`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }
        
        const bookingsData = await response.json();
        
        // Get the table body
        const tableBody = document.querySelector('#bookings table tbody');
        
        // Clear existing data
        tableBody.innerHTML = '';
        
        // Check if there's data to display
        if (bookingsData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="8" class="text-center alert alert-info">
                <i class="fas fa-info-circle me-2"></i>No Rentals found</td>`;
            tableBody.appendChild(emptyRow);
            return;
        }
        

        



        // Add each booking to the table
        bookingsData.forEach(booking => {
            const row = document.createElement('tr');

            const pickupDate = new Date(booking.time).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
            });

            
            // Format dates
           /* const pickupDate = new Date(booking.time).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
            });

            
            const returnDate = new Date(booking.rental_end).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
            });
            */
            
            // Determine status class
            let statusClass = '';
            switch(booking.status.toLowerCase()) {
                case 'active':
                    statusClass = 'bg-success';
                    break;
                case 'pending':
                    statusClass = 'bg-warning';
                    break;
                case 'completed':
                    statusClass = 'bg-info';
                    break;
                case 'cancelled':
                    statusClass = 'bg-danger';
                    break;
                default:
                    statusClass = 'bg-secondary';
            }
            
            row.innerHTML = `
                <td>${booking.receipt}</td>
               
                <td>
                    <div class="d-flex align-items-center">
                       <img src="${booking.client.img_url}" class="rounded-circle me-2" alt="" style="width: 60px; height: 60px;">
                        <div>
                            <h6 class="mb-0">${booking.client.name}</h6>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${booking.washer.img_url}" class="rounded-circle me-2" alt="" style="width: 60px; height: 60px;">
                        <div>
                            <h6 class="mb-0">${booking.washer.name}</h6>
                        </div>
                    </div>
                </td>
                <td>${booking.service.package_type}</td>
               <td> 
                  <a href='${booking.washing_point.location_url}' target="_blank" rel="noopener noreferrer">${booking.washing_point.location_name}</a>
               </td>
               <td>${booking.plate_number}</td>
                <td>${pickupDate}</td>
                <td>${booking.service.duration} min</td>
                <td>Ksh ${booking.price}</td>
                <td><span class="badge ${statusClass}">${booking.status}</span></td>
                <td>
                    ${booking.status.toLowerCase() !== 'cancelled' ? 
                      `<a class="dropdown-item text-danger cancel-booking" href="#" data-id="${booking.receipt}, ${booking.status}">
                         <i class="fas fa-times me-2"></i>Cancel
                       </a>` : 
                      `<span class="text-muted">Already cancelled</span>`
                    }
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to cancel buttons   <td>Ksh ${booking.price.toFixed(2)}</td>
       // Add event listeners to cancel buttons
document.querySelectorAll('.cancel-booking').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const bookingData = this.getAttribute('data-id').split(',');
        const bookingId = bookingData[0]; // The booking ID
        const status = bookingData[1]; // The status
        cancelBooking(bookingId, status); // Pass both bookingId and status
    });
});

        
    } catch (error) {
        console.error('Error fetching bookings:', error);
        createToast('Failed to load bookings data: ' + error.message, 'error');
    }
};
//call fetch booking
fetchBookings()






// Cancel a booking
const cancelBooking = async (rental_id, status) => {
    // Ask for confirmation
    if (!confirm('Are you sure you want to cancel this rental?')) {
        return;
    }
 

    if(status==="cancelled"){
        createToast(info.message, 'Rental Already cancelled');
        return

    }
    
    try {
    const response = await fetch(`${API_BASE_URL}/cancel/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rental_id }),  // Ensure the body is a valid object
    });

    const info = await response.json();  // Read the response body once

    if (!response.ok) {
        throw new Error(info.message || 'Failed to cancel booking');  // Use the already parsed info object
    }

    // Check if the success flag is true (use == for comparison, not assignment)
    if (info.success === true) {
        createToast(info.message, 'success');
    } else {
        createToast(info.message, 'error');
    }

    // Refresh the bookings data
    fetchBookings();
    fetchStats();

} catch (error) {
    console.error('Error cancelling booking:', error);
    createToast('Failed to cancel booking: ' + error.message, 'error');
   // alert(error.message);
}

};

// Fetch summary stats data
const fetchStats = async () => {
    try {
        const response = await fetch('https://backend-carwash-mx6p.onrender.com/api/rental-stats');
        
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard statistics');
        }
        
        const serverResponse = await response.json();

        if(serverResponse.success==true){
           statsData=serverResponse.data
           //console.log(statsData)
        
        // Update the stats cards with the dynamic data
        document.querySelector('.dashboard-stats .col-md-3:nth-child(1) .stat-card h2').textContent = 
            statsData.active_rentals || '0';
            
        document.querySelector('.dashboard-stats .col-md-3:nth-child(2) .stat-card h2').textContent = 
            statsData.completed_rentals|| '0';
            
        document.querySelector('.dashboard-stats .col-md-3:nth-child(3) .stat-card h2').textContent = 
            statsData.cancelled_rentals|| '0';
            
        document.querySelector('.dashboard-stats .col-md-3:nth-child(4) .stat-card h2').textContent = 
            `Ksh ${(statsData.admin_wallet_balance || 0).toLocaleString()}`;
            
        }

    } catch (error) {
        console.error('Error fetching stats:', error);
        createToast('Failed to load dashboard statistics: ' + error.message, 'error');
    }
};

//calling fetch stats method
fetchStats()













