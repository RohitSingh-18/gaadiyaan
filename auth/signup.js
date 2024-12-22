document.querySelector('#signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const buttonClicked = e.submitter;
    const role = buttonClicked.classList.contains('buyer-button') ? 'client' : 'dealer';
    
    const name = document.querySelector('input[type="text"]').value;
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;
    const confirmPassword = document.querySelectorAll('input[type="password"]')[1].value;
    const termsChecked = document.querySelector('#terms').checked;
    const errorMessageDiv = document.querySelector('#errorMessage');

    // Function to generate dealer ID
    function generateDealerId() {
        const year = new Date().getFullYear();
        let lastNumber = parseInt(localStorage.getItem('lastDealerId') || '0');
        lastNumber++;
        localStorage.setItem('lastDealerId', lastNumber.toString());
        return `GD${year}${lastNumber.toString().padStart(3, '0')}`;
    }

    // Reset error message
    errorMessageDiv.style.display = 'none';
    errorMessageDiv.textContent = '';

    if (!termsChecked) {
        errorMessageDiv.textContent = 'Please agree to the Terms and Conditions';
        errorMessageDiv.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        errorMessageDiv.textContent = 'Passwords do not match!';
        errorMessageDiv.style.display = 'block';
        return;
    }

    try {
        // Generate dealer ID if registering as dealer
        const dealerId = role === 'dealer' ? generateDealerId() : null;

        const response = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: name,
                email,
                password,
                role,
                full_name: name,
                agreed_to_terms: true,
                terms_version: '1.0',
                dealer_id: dealerId // Add dealer ID to registration data
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (role === 'dealer') {
                localStorage.setItem('dealerName', name);
                localStorage.setItem('dealerEmail', email);
                localStorage.setItem('userType', 'dealer');
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('dealerId', dealerId); // Save dealer ID to localStorage
                window.location.href = '/dashboard/dealer/pages/portal.html';
            } else {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            }
        } else {
            // Check for specific error types
            if (data.message && data.message.includes('username already exists')) {
                errorMessageDiv.textContent = 'This username is already taken. Please choose a different one.';
            } else if (data.message && data.message.includes('email already exists')) {
                errorMessageDiv.textContent = 'This email is already registered. Please use a different email or login.';
            } else {
                errorMessageDiv.textContent = data.message || 'Registration failed. Please try again.';
            }
            errorMessageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessageDiv.textContent = 'Registration failed. Please try again.';
        errorMessageDiv.style.display = 'block';
    }
});