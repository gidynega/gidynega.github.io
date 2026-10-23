// Welcome message
console.log("Welcome to Gidy Nega's website!");

// Update the footer year automatically
const yearElement = document.querySelector("#year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// Mobile menu functionality
const menuButton = document.querySelector("#menu-button");
const navigation = document.querySelector("#navigation");

if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
        navigation.classList.toggle("open");
    });
}
