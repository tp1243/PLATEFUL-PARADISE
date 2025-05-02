document.addEventListener('DOMContentLoaded', function () {
    const paypalButton = document.getElementById('paypal-btn');
    const applePayButton = document.getElementById('apple-pay-btn');
    const googlePayButton = document.getElementById('google-pay-btn');

    // Function to handle PayPal button click
    paypalButton.addEventListener('click', function () {
        console.log('PayPal button clicked');
        // Here you can trigger PayPal's payment API or redirect
        alert('Proceeding with PayPal payment...');
    });

    // Function to handle Apple Pay button click
    applePayButton.addEventListener('click', function () {
        console.log('Apple Pay button clicked');
        // Trigger Apple Pay payment process
        alert('Proceeding with Apple Pay payment...');
    });

    // Function to handle Google Pay button click
    googlePayButton.addEventListener('click', function () {
        console.log('Google Pay button clicked');
        // Trigger Google Pay payment process
        alert('Proceeding with Google Pay payment...');
    });
});
