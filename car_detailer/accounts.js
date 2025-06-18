const API = "https://backend-carwash-mx6p.onrender.com"; 

function formatDateTime(timestamp) {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    if (isNaN(date)) return "Invalid Date";

    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

async function loadUserDetails() {
    const token = localStorage.getItem("token");

    if (!token) {
        localStorage.removeItem('token');
             window.location.href = "../index.html";
        return;
    }

    try {
        const server_response = await fetch(`${API}/api/user`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await server_response.json();

        if (!data.success) {
           localStorage.removeItem('token');
             window.location.href = "../index.html";
        }

        if (data.role !== "car_detailer") {
             localStorage.removeItem('token');
             window.location.href = "../index.html";
        }

        function updateElements(selector, updateFn) {
            document.querySelectorAll(selector).forEach(el => updateFn(el));
        }

        updateElements(".userName", el => el.textContent = data.name);
        updateElements(".userEmail", el => el.textContent = data.email);
        updateElements(".userContact", el => el.textContent = data.contact);
        updateElements(".userRole", el => el.textContent = data.role);

        /*
        const userDateEl = document.getElementById("userDateIn");
        if (userDateEl) userDateEl.textContent = formatDateTime(data.createdAt);
*/

const userDateEls = document.querySelectorAll(".userDateIn");
userDateEls.forEach(el => {
    el.textContent = formatDateTime(data.createdAt);
});




        // Render profile picture exactly as-is, fallback on failure or empty
        updateElements(".userProfile", el => {
            el.src = data.image_url || "../assets/dp.jpg";

            el.onerror = function () {
                this.onerror = null;
                this.src = "../assets/dp.jpg";
            };
        });

    } catch (error) {
       localStorage.removeItem('token');
             window.location.href = "../index.html";
    }
}

loadUserDetails(); // Call on page load
