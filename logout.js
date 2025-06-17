/*
function logout() {
    fetch('http://your-backend-url/api/logout', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Clear token from browser
            localStorage.removeItem('auth_token');

            // Redirect to home/index page
            window.location.href = 'index.html';
        } else {
            return response.json().then(data => {
                alert('Logout failed: ' + (data.message || 'Unknown error'));
            });
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        alert('Logout request failed');
    });
}

*/


function logout() {
    // event.preventDefault();
     localStorage.removeItem('token');
     window.location.href = "../index.html";
   }
   
