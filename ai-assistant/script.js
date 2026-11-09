
/* =========================================
   GIDY AI - MULTIMODAL JAVASCRIPT
   Text + Image Support
   Reading-friendly scrolling
========================================= */

// BACKEND CONNECTION
const API_URL =
"https://bold-smoke-695fgidy-ai-backend.gidynega.workers.dev";

// HTML ELEMENTS
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const sendBtn = document.getElementById("sendBtn");
const newChat = document.getElementById("newChat");
const clearChat = document.getElementById("clearChat");

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

// IMAGE ELEMENTS
const attachmentButton =
document.getElementById("attachmentButton");

const imageInput =
document.getElementById("imageInput");

const attachmentPreview =
document.getElementById("attachmentPreview");

let selectedImage = null;
let previewUrl = null;
let isLoading = false;


// =========================================
// ADD MESSAGE TO CHAT
// =========================================

function addMessage(role, content, imageUrl = null) {

    welcome.style.display = "none";

    const message = document.createElement("div");

    message.className = role === "user"
        ? "message user-message"
        : "message ai-message";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "👤" : "✦";

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = role === "user" ? "You" : "Gidy AI";

    const text = document.createElement("div");
    text.className = "message-text";

    if (content) {
        text.innerHTML = marked.parse(content);
    }

    messageContent.appendChild(name);

    // DISPLAY IMAGE
    if (imageUrl) {

        const image = document.createElement("img");

        image.src = imageUrl;
        image.alt = "Uploaded image";

        image.style.maxWidth = "100%";
        image.style.maxHeight = "300px";
        image.style.borderRadius = "12px";
        image.style.marginBottom = "10px";

        messageContent.appendChild(image);
    }

    messageContent.appendChild(text);

    message.appendChild(avatar);
    message.appendChild(messageContent);

    messages.appendChild(message);

    return message;
}


// =========================================
// READING-FRIENDLY SCROLLING
// =========================================

// Do not automatically move the reader
// to the bottom of the conversation.

function scrollToBottom() {
    // Intentionally disabled.
}


// =========================================
// SHOW TYPING INDICATOR
// =========================================

function showTyping() {

    const typingMessage = addMessage(
        "ai",
        "Gidy AI is thinking..."
    );

    typingMessage.querySelector(".message-text")
        .classList.add("typing");

    return typingMessage;
}


// =========================================
// IMAGE SELECTION
// =========================================

attachmentButton.addEventListener("click", function () {

    if (!isLoading) {
        imageInput.click();
    }

});


// =========================================
// HANDLE SELECTED IMAGE
// =========================================

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    // CHECK IMAGE TYPE
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {

        alert("Please select a JPG, PNG or WEBP image.");

        this.value = "";
        return;
    }

    // CHECK IMAGE SIZE (5 MB)
    if (file.size > 5 * 1024 * 1024) {

        alert("Image size must be less than 5 MB.");

        this.value = "";
        return;
    }

    selectedImage = file;

    showImagePreview();

});


// =========================================
// SHOW IMAGE PREVIEW
// =========================================

function showImagePreview() {

    attachmentPreview.innerHTML = "";

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    if (!selectedImage) return;

    const container = document.createElement("div");

    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "10px";
    container.style.padding = "8px";

    const image = document.createElement("img");

    previewUrl = URL.createObjectURL(selectedImage);

    image.src = previewUrl;
    image.style.width = "65px";
    image.style.height = "65px";
    image.style.objectFit = "cover";
    image.style.borderRadius = "8px";

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.textContent = "✕";
    removeButton.title = "Remove image";

    removeButton.addEventListener("click", function () {

        selectedImage = null;
        imageInput.value = "";

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        attachmentPreview.innerHTML = "";

    });

    container.appendChild(image);
    container.appendChild(removeButton);

    attachmentPreview.appendChild(container);
}


// =========================================
// CONVERT IMAGE TO BASE64
// =========================================

function imageToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            const result = reader.result;

            resolve(result.split(",")[1]);

        };

        reader.onerror = () => {
            reject(new Error("Could not read the image."));
        };

        reader.readAsDataURL(file);

    });

}


// =========================================
// SEND MESSAGE TO AI
// =========================================

async function sendMessage(question) {

    question = question.trim();

    if ((!question && !selectedImage) || isLoading) return;

    if (question.length > 4000) {
        alert("Your message is too long.");
        return;
    }

    const imageFile = selectedImage;

    let imageUrl = null;

    if (imageFile) {
        imageUrl = URL.createObjectURL(imageFile);
    }

    // DISPLAY USER MESSAGE
    addMessage(
        "user",
        question || "Please analyze this image.",
        imageUrl
    );

    userInput.value = "";
    userInput.style.height = "42px";

    selectedImage = null;
    imageInput.value = "";

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    attachmentPreview.innerHTML = "";

    isLoading = true;

    sendBtn.disabled = true;
    attachmentButton.disabled = true;

    // SHOW THINKING MESSAGE
    const typingMessage = showTyping();

    const replyElement =
    typingMessage.querySelector(".message-text");

    try {

        const payload = {
            message: question || "Please analyze this image."
        };

        // ADD IMAGE DATA
        if (imageFile) {

            payload.image = await imageToBase64(imageFile);
            payload.imageType = imageFile.type;

        }

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Server error: " + response.status
            );

        }

        const aiReply = data.response || data.reply;

        if (!aiReply) {

            throw new Error(
                "The AI returned an empty response."
            );

        }

        // DISPLAY AI ANSWER
        replyElement.innerHTML = marked.parse(aiReply);

        replyElement.classList.remove("typing");

    } catch (error) {

        replyElement.textContent =
        "⚠️ " + error.message;

        replyElement.classList.remove("typing");

        console.error("Gidy AI Error:", error);

    } finally {

        isLoading = false;

        sendBtn.disabled = false;
        attachmentButton.disabled = false;

        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }

        // IMPORTANT:
        // No automatic scrolling.
        // No automatic input focus.
        // The reader controls the page.

    }

}


// =========================================
// SUBMIT CHAT FORM
// =========================================

chatForm.addEventListener("submit", function (event) {

    event.preventDefault();

    sendMessage(userInput.value);

});


// =========================================
// ENTER TO SEND MESSAGE
// =========================================

userInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        chatForm.requestSubmit();

    }

});


// =========================================
// AUTO RESIZE TEXTAREA
// =========================================

userInput.addEventListener("input", function () {

    userInput.style.height = "42px";

    userInput.style.height =
    Math.min(userInput.scrollHeight, 140) + "px";

});


// =========================================
// NEW CONVERSATION
// =========================================

function startNewChat() {

    messages.innerHTML = "";

    welcome.style.display = "block";

    userInput.value = "";

    selectedImage = null;

    imageInput.value = "";

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    attachmentPreview.innerHTML = "";

    sidebar.classList.remove("open");

}


// =========================================
// NEW CHAT BUTTON
// =========================================

newChat.addEventListener("click", startNewChat);


// =========================================
// CLEAR CONVERSATION
// =========================================

clearChat.addEventListener("click", function () {

    startNewChat();

});


// =========================================
// SUGGESTED QUESTIONS
// =========================================

document.querySelectorAll(".suggestion").forEach(button => {

    button.addEventListener("click", function () {

        const prompt = this.dataset.prompt;

        sendMessage(prompt);

    });

});


// =========================================
// LEARNING AREA BUTTONS
// =========================================

document.querySelectorAll(".subject-btn").forEach(button => {

    button.addEventListener("click", function () {

        const prompt = this.dataset.prompt;

        sendMessage(prompt);

        sidebar.classList.remove("open");

    });

});


// =========================================
// MOBILE SIDEBAR
// =========================================

menuBtn.addEventListener("click", function () {

    sidebar.classList.toggle("open");

});
