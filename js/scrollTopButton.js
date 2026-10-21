const scrollTopButton = document.getElementById("scrollTopButton");

// When the user scrolls down 750px from the top, show the button
window.addEventListener("scroll", function() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;

    if (scrollPosition > 750) {
        scrollTopButton.style.display = "block";
    } else {
        scrollTopButton.style.display = "none";
    }
});

// On click, scroll to the top smoothly
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
