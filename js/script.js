// 1. Welcome message
console.log("Welcome to Gidy Nega's website!");

// 2. Update footer year
const yearElement = document.querySelector("#year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// 3. Mobile navigation menu
const menuButton = document.querySelector("#menuButton");
const navigation = document.querySelector("#navlinks");

if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
        navigation.classList.toggle("open");
    });

    navigation.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navigation.classList.remove("open");
        });
    });
}

// 4. Dark / Light Mode
const themeToggle = document.getElementById("themeToggle");

// Update button text and accessibility label
function updateThemeButton() {
const isLightMode = document.body.classList.contains("light-mode");

themeToggle.textContent = isLightMode
    ? "🌙 Dark Mode"
    : "☀️ Light Mode";

themeToggle.setAttribute(
    "aria-label",
    isLightMode
        ? "Switch to dark mode"
        : "Switch to light mode"
);

}

// Load the visitor's saved theme
const savedTheme = localStorage.getItem("gidyTheme");

if (savedTheme === "light") {
document.body.classList.add("light-mode");
} else {
document.body.classList.remove("light-mode");
}

if (themeToggle) {
updateThemeButton();

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const isLightMode =
        document.body.classList.contains("light-mode");

    localStorage.setItem(
        "gidyTheme",
        isLightMode ? "light" : "dark"
    );

    updateThemeButton();
});

}
alert("Gidy's website JavaScript is working!");