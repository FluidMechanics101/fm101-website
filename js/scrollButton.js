function scrollToSection(selectionId) {
    const element = document.getElementById(selectionId);

    if (element) {
        element.scrollIntoView({
            block: 'start',
            behavior: 'smooth'
        });
    } else {
        console.warn('Element with ID "${selectionId}" not found.')
    }
}

function scrollDown(){
    window.scrollBy({
        top: window.innerHeight,
        left: 0,
        behavior: 'smooth'
    });
}
