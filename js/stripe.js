function evListener(sku) {
    const element = document.getElementById(`checkout-button-${sku}`);

    if (!element) return;

    element.addEventListener('click', function () {
        stripe.redirectToCheckout({
            items: [{sku, quantity: 1}],
            successUrl: 'https://www.fluidmechanics101.com/pages/payment-success.html',
            cancelUrl: 'https://www.fluidmechanics101.com/pages/payment-error.html',
        })
        .then(function (result) {
            if (result && result.error) {
                const displayError = document.getElementById('error-message');
                if (displayError) {
                    displayError.textContent = result.error.message;
                }
            }
        });
    });
}

const stripe = Stripe('pk_live_RRWIGO23Hvw91ItzN8A4BRjM');
const skus = [
    'sku_FIr6L8bYAe6e2M', // fm1
    'sku_FsoiQ4pqcEcxmY', // fm2
    'sku_GejE4UfyblZ0Gg', // fm3
    'sku_J3j1n9kyHkC8uy', // prof
    'sku_EuoVcU9ddKzT4A', // yt1-10
    'sku_FAqbWEUEMj247p', // yt11-20
    'sku_GKAmr41zGfCwGY', // yt21-30
    'sku_J35nfJokt7gA1D', // yt31-40
    'sku_K0g8Uzh8WiLxLf', // yt41-50
    'sku_MNrOePkIJSsdXr', // yt51-60
    'sku_NTK38oQIwSDJmc', // yt61-70
    'sku_PliKQyUcpXMuxY'  // yt71-80
];

skus.forEach(evListener);
