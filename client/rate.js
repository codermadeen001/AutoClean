document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const ratingButton = document.getElementById("ratingButton");
    const barberRatingModal = new bootstrap.Modal(document.getElementById("barberRatingModal"));
    const confirmUnrateModal = new bootstrap.Modal(document.getElementById("confirmUnrateModal"));
    const confirmUnrateBtn = document.getElementById("confirmUnrateBtn");
    const barberListContainer = document.getElementById("barberList");
    const barberCardTemplate = document.getElementById("barberCardTemplate");
    
    // API endpoints
    const BASE_URL = "http://localhost:8000/api";
    const ENDPOINTS = {
      GET_BARBERS: `${BASE_URL}/rate/get-car-detailers-to-rate`,
      RATE_BARBER: `${BASE_URL}/rate/rate`,
      UNRATE_BARBER: `${BASE_URL}/rate/unrate`,
      GET_BARBER_RATING: (barberId) => `${BASE_URL}/rate/car-detailer/${barberId}/rating`
    };
  
    // Store the barber ID and stars elements for unrating
    let currentUnrateData = null;
    let lastRating = {}; // Store last rating by barber ID for comparison
  
    // Create toast container on page load
    createToastContainer();
    
    // Function to create toast container
    function createToastContainer() {
      // Only create if it doesn't exist
      if (!document.querySelector(".toast-container")) {
        const toastContainer = document.createElement("div");
        toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
        toastContainer.style.zIndex = "1060"; // Ensure toasts appear above modals
        document.body.appendChild(toastContainer);
      }
    }
  
    // Open modal when clicking the rating button
    ratingButton.addEventListener("click", () => {
      loadBarbers();
      barberRatingModal.show();
    });
  
    // Load barbers when the page loads
    loadBarbers();
  
    // Fetch barbers from API
    async function loadBarbers() {
      try {
        barberListContainer.innerHTML = `
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        `;
  
        // Make actual API call to get barbers
        const response = await fetch("http://localhost:8000/api/rate/get-car-detailers-to-rate", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load barbers");
  
        renderBarbers(data);
      } catch (error) {
        createToast("Failed to load Wshers: " + (error.message || "Please try again later"), "error");
        console.error("Error loading barbers:", error);
        barberListContainer.innerHTML = `<div class="col-12 text-center">
          <p class="text-danger">Failed to load barbers. Please try again later.</p>
        </div>`;
      }
    }
  
    // Render barber cards
    function renderBarbers(barbers) {
      barberListContainer.innerHTML = "";
  
      barbers.forEach(barber => {
        const barberCard = document.importNode(barberCardTemplate.content, true);
        
        // Set barber info
        const profilePicture = barber.profile_picture && barber.profile_picture.startsWith("http")
          ? barber.profile_picture
          : barber.profile_picture && barber.profile_picture.trim() !== "" 
              ? `http://localhost:3000/${barber.profile_picture}`
              : "../../components/assets/dp.jpg";
    
        barberCard.querySelector(".barber-image").src = profilePicture;
        
        barberCard.querySelector(".barber-name").textContent = barber.name;
        barberCard.querySelector(".speciality").textContent = barber.specialties || "";
        barberCard.querySelector(".rating-value").textContent = `${barber.user_rating || 0}/10`;
        barberCard.querySelector(".overall-rating-value").textContent = 
          `${Number(barber.rating || 0).toFixed(1)}/10`;
        barberCard.querySelector(".total-ratings").textContent = barber.total_ratings || 0;
        
        const cardElement = barberCard.querySelector(".barber-card");
        cardElement.dataset.barberId = barber.id;
  
        // Handle star ratings
        const starElements = barberCard.querySelectorAll(".rating-stars .fa-star");
        
        // Set initial state based on user's previous rating
        updateStars(starElements, barber.user_rating || 0);
        
        // Store the last rating for this barber
        lastRating[barber.id] = barber.user_rating || 0;
        
        // Show/hide unrate button based on current rating
        const unrateButton = barberCard.querySelector(".unrate-button");
        if (barber.user_rating > 0) {
          unrateButton.style.display = "block";
          unrateButton.addEventListener("click", function(event) {
            event.stopPropagation(); // Prevent event bubbling
            showUnrateConfirmation(barber.id, starElements, barber.name);
          });
        } else {
          unrateButton.style.display = "none";
        }
        
        // Add event listeners for hover and click
        addStarEventListeners(starElements, barber.id, barber.name);
        
        barberListContainer.appendChild(barberCard);
      });
    }
  
    // Show confirmation dialog before unrating
    function showUnrateConfirmation(barberId, stars, barberName) {
      // Store data for the current unrate operation
      currentUnrateData = { barberId, stars, barberName };
      
      // Update confirmation modal text
      const confirmationText = document.querySelector("#confirmUnrateModal .modal-body p");
      if (confirmationText) {
        confirmationText.textContent = `Are you sure you want to remove your rating for ${barberName}?`;
      }
      
      confirmUnrateModal.show();
    }
  
    // Set up the confirmation button for unrating
    confirmUnrateBtn.addEventListener("click", function() {
      if (currentUnrateData) {
        unrateBarber(
          currentUnrateData.barberId, 
          currentUnrateData.stars, 
          currentUnrateData.barberName
        );
        confirmUnrateModal.hide();
      }
    });
  
    // Add event listeners to stars
    function addStarEventListeners(stars, barberId, barberName) {
      const starsContainer = stars[0].parentElement;
      
      // Add hover effect
      stars.forEach(star => {
        const rating = parseInt(star.dataset.rating);
        
        star.addEventListener("mouseenter", function() {
          // Only apply hover if it's different from current rating
          if (rating !== lastRating[barberId]) {
            // Clear all hover states first
            stars.forEach(s => s.classList.remove("hover"));
            
            // Apply hover state to all stars up to the hovered one
            stars.forEach((s, index) => {
              if (index < rating) {
                s.classList.add("hover");
              }
            });
          }
        });
        
        // Handle click event
        star.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const rating = parseInt(this.dataset.rating);
          
          // Only make the API call if the rating is different
          if (rating !== lastRating[barberId]) {
            // Optimistic UI update
            updateStars(stars, rating);
            
            // Update UI elements immediately
            const barberCard = stars[0].closest(".barber-card");
            barberCard.querySelector(".rating-value").textContent = `${rating}/10`;
            
            // Show unrate button
            const unrateButton = barberCard.querySelector(".unrate-button");
            unrateButton.style.display = "block";
            
            // Add event listener if not present
            if (!unrateButton.hasEventListener) {
              unrateButton.addEventListener("click", function(event) {
                event.stopPropagation();
                showUnrateConfirmation(barberId, stars, barberName);
              });
              unrateButton.hasEventListener = true;
            }
            
            // Show immediate toast notification
            createToast(`Rating ${barberName} ${rating}/10...`, "success");
            
            // Make the actual API call
            rateBarber(barberId, rating, stars, barberName);
          }
        });
      });
      
      // Remove hover effect when mouse leaves the stars container
      starsContainer.addEventListener("mouseleave", function() {
        stars.forEach(s => s.classList.remove("hover"));
        
        // Restore the actual rating display
        updateStars(stars, lastRating[barberId]);
      });
    }
  
    // Update star display based on rating
    function updateStars(stars, rating) {
      // First, reset all stars
      stars.forEach(star => {
        star.classList.remove("fas", "far", "active", "hover");
      });
      
      // Then apply the correct classes based on rating
      stars.forEach((star, index) => {
        if (index < rating) {
          star.classList.add("fas", "active");
        } else {
          star.classList.add("far");
        }
      });
      
      // Update the barber card's barber ID
      const barberId = stars[0].closest(".barber-card").dataset.barberId;
      
      // Store this as the current rating
      lastRating[barberId] = rating;
      
      // Show/hide unrate button based on rating
      const unrateButton = stars[0].closest(".barber-card").querySelector(".unrate-button");
      if (rating > 0) {
        unrateButton.style.display = "block";
      } else {
        unrateButton.style.display = "none";
      }
    }
  
    // Function to update a barber's overall rating
    async function updateOverallRating(barberId) {
      try {
        const barberCard = document.querySelector(`.barber-card[data-barber-id="${barberId}"]`);
        if (!barberCard) return;
        
        const response = await fetch(ENDPOINTS.GET_BARBER_RATING(barberId), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to get updated rating");
        }
        
        const data = await response.json();
        
        // Update the UI with new overall rating
        barberCard.querySelector(".overall-rating-value").textContent = 
          `${Number(data.avg_rating || 0).toFixed(1)}/10`;
        barberCard.querySelector(".total-ratings").textContent = data.total_ratings || 0;
        
        return data;
      } catch (error) {
        console.error("Error updating overall rating:", error);
        // Don't show a toast here since this is a background operation
        return null;
      }
    }
  
    // Submit rating
    async function rateBarber(barberId, rating, stars, barberName) {
      try {
        const response = await fetch(ENDPOINTS.RATE_BARBER, {
          method: "POST",
          headers: {
           "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({  
            barber_id: barberId, 
            rating: rating 
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
          // Revert the optimistic UI update on error
          updateStars(stars, lastRating[barberId] || 0);
          const barberCard = stars[0].closest(".barber-card");
          barberCard.querySelector(".rating-value").textContent = `${lastRating[barberId] || 0}/10`;
          
          createToast(data.message || "Failed to submit rating", 'error');
        }
        
        // Update the last rating
        lastRating[barberId] = rating;
        
        // Update the overall rating immediately after success
        await updateOverallRating(barberId);
        
        // Success toast
        createToast(`You rated ${barberName} ${rating}/10`, "success");
      } catch (error) {
        console.error("Error rating barber:", error);
        createToast("Failed to submit rating: " + (error.message || "Please try again."), "error");
      }
    }
    
    // Unrate a barber (remove rating)
    async function unrateBarber(barberId, stars, barberName) {
      try {
        // Optimistic UI update
        const barberCard = stars[0].closest(".barber-card");
        const previousRating = lastRating[barberId];
        
        // Update UI immediately
        updateStars(stars, 0);
        barberCard.querySelector(".rating-value").textContent = "0/10";
        barberCard.querySelector(".unrate-button").style.display = "none";
        
        // Show immediate toast
        createToast(`Removing rating for ${barberName}...`, "success");
        
        const response = await fetch(ENDPOINTS.UNRATE_BARBER, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            barber_id: barberId
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
          // Revert the optimistic UI update on error
          updateStars(stars, previousRating);
          barberCard.querySelector(".rating-value").textContent = `${previousRating}/10`;
          barberCard.querySelector(".unrate-button").style.display = "block";
          
          throw new Error(data.message || "Failed to remove rating");
        }
        
        // Reset the last rating
        lastRating[barberId] = 0;
        
        // Update the overall rating immediately after success
        await updateOverallRating(barberId);
  
        createToast(`Rating removed for ${barberName}`, "success");
      } catch (error) {
        console.error("Error removing rating:", error);
        createToast("Failed to remove rating: " + (error.message || "Please try again."), "error");
      }
    }
  
    // Toast notification with type support
    function showToast(message, type = "success") {
      // Map type to Bootstrap class
      const typeClasses = {
        success: "bg-success",
        error: "bg-danger",
        info: "bg-info",
        warning: "bg-warning"
      };
      
      const bgClass = typeClasses[type] || typeClasses.success;
      
      // Get the toast container
      let toastContainer = document.querySelector(".toast-container");
      if (!toastContainer) {
        createToastContainer();
        toastContainer = document.querySelector(".toast-container");
      }
  
      // Create toast
      const toastId = `toast-${Date.now()}`;
      const toastEl = document.createElement("div");
      toastEl.className = `toast ${bgClass} text-white`;
      toastEl.id = toastId;
      toastEl.setAttribute("role", "alert");
      toastEl.setAttribute("aria-live", "assertive");
      toastEl.setAttribute("aria-atomic", "true");
      
      // Add animation classes
      toastEl.classList.add("fade", "show");
      
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      
      toastContainer.appendChild(toastEl);
      
      // Show toast
      const toast = new bootstrap.Toast(toastEl, { 
        delay: type === "info" ? 2000 : 3000, // Shorter time for info toasts
        animation: true
      });
      toast.show();
      
      // Remove toast after it's hidden
      toastEl.addEventListener("hidden.bs.toast", () => {
        toastEl.remove();
      });
    }
  });
  
  
  
  
  