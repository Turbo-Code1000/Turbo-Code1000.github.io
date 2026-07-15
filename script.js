const headingBar = document.getElementById('main-heading');
const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];

function changeHeaderColor() {
    const randomIndex = Math.floor(Math.random() * colors.length);
    const randomColor = colors[randomIndex];

    headingBar.style.backgroundColor = randomColor;
    
    // Dynamically updates your link color based on brightness
    const links = document.querySelectorAll('nav > a');
    links.forEach(link => {
        if (randomColor === '#ff0' || randomColor === '#0ff' || randomColor === '#0f0') {
            link.style.color = '#222222';
        } else {
            link.style.color = '#ffffff';
        }
    });
}

changeHeaderColor();
