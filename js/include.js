document.addEventListener("DOMContentLoaded", () => {
    const navContainer = document.getElementById("global-nav");
    if (navContainer) {
        fetch("/components/nav.html")
            .then(response => response.text())
            .then(data => {
                navContainer.innerHTML = data;
            });
    }

    const footerContainer = document.getElementById("global-footer");
    if (footerContainer) {
        fetch("/components/footer.html")
            .then(response => response.text())
            .then(data => {
                footerContainer.innerHTML = data;
            });
    }
});
