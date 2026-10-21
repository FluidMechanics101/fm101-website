// Animate smooth opening and closing accordions
const acc = document.getElementsByClassName("accordion");

for (let i = 0; i < acc.length; i++) {

    // If clicked, toggle 'active'
    acc[i].addEventListener(
        "click", function() {
            this.classList.toggle("active");

            // Go to the other siblings and close them.
            const panel = this.nextElementSibling;

            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            }
            else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        }
    );
}
