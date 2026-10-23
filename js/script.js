// Welcome message
console.log("Welcome to Gidy Nega's website!");

// Update the footer year automatically
const yearElement = document.querySelector("#year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// Mobile menu functionality
const menuButton = document.querySelector("#menuButton");
const navigation = document.querySelector("#navlinks");
if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
        navigation.classList.toggle("open");
    });
}
// DARK / LIGHT MODE

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("light-mode");

        const isLightMode =
            document.body.classList.contains("light-mode");

        themeToggle.textContent = isLightMode
            ? "🌙 Dark Mode"
            : "☀️ Light Mode";

        themeToggle.setAttribute(
            "aria-label",
            isLightMode
                ? "Switch to dark mode"
                : "Switch to light mode"
        );
    });
}
