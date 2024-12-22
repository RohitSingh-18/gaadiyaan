document.querySelector('#loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;

    try {
        console.log('Login attempt with email:', email);

        const response = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Raw server response:', data);

        if (response.ok) {
            // First, clear old data
            console.log('Clearing old data from localStorage');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            localStorage.removeItem('isLoggedIn');

            console.log('Setting new user data:', data.user);
            
            // Store the complete user object as is
            localStorage.setItem('userProfile', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', data.user.role);
            localStorage.setItem('isLoggedIn', 'true');

            console.log('Stored user profile:', localStorage.getItem('userProfile'));

            // Redirect based on role
            switch(data.user.role) {
                case 'dealer':
                    window.location.href = '../dashboard/dealer/pages/portal.html';
                    break;
                case 'client':
                    window.location.href = '../dashboard/client/user.html';
                    break;
                case 'admin':
                    window.location.href = '../dashboard/admin/pages/portal.html';
                    break;
                default:
                    console.error('Unknown role:', data.user.role);
            }
        } else {
            console.error('Login failed:', data.message);
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});