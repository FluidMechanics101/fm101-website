document.addEventListener("DOMContentLoaded", function () {

    const components = [
        { id: "global-nav", path: "/components/nav.html" },
        { id: "global-footer", path: "/components/footer.html" },
        { id: "global-scrollTopButton", path: "/components/scrollTopButton.html" }
    ];

    components.forEach(function (component) {
        const container = document.getElementById(component.id);

        if (container !== null) {
            fetch(component.path)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Failed to load: " + component.path)
                    }
                    return response.text();
                })
                .then(function (htmlContent) {
                    container.innerHTML = htmlContent;
                })
                .catch(function (error){
                    console.error("Error rendering component: ", error);
                })
        }
    });
});
