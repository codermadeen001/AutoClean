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

