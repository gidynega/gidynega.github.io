
/* =========================================
   GIDY AI - ADVANCED MULTIMODAL JAVASCRIPT
   VERSION 2.0

   FEATURES:
   1. Text conversations
   2. Image uploading
   3. Permanent conversation IDs
   4. Load previous conversation history
   5. Save conversations through Cloudflare D1
   6. Start new conversations
   7. Delete current conversation
   8. Reading-friendly interface
========================================= */

// =========================================
// BACKEND CONNECTION
// =========================================

const API_URL =
"https://bold-smoke-695fgidy-ai-backend.gidynega.workers.dev";

const STORAGE_KEY = "gidy_ai_current_conversation";


// =========================================
// HTML ELEMENTS
// =========================================

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const sendBtn = document.getElementById("sendBtn");
const newChat = document.getElementById("newChat");
const clearChat = document.getElementById("clearChat");

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

const attachmentButton =
document.getElementById("attachmentButton");

const imageInput =
document.getElementById("imageInput");

const attachmentPreview =
document.getElementById("attachmentPreview");


// =========================================
// APPLICATION STATE
// =========================================

let selectedImage = null;
let previewUrl = null;

let isLoading = false;

let conversationId =
localStorage.getItem(STORAGE_KEY) || crypto.randomUUID();

localStorage.setItem(STORAGE_KEY, conversationId);


// =========================================
// VALIDATE REQUIRED HTML ELEMENTS
// =========================================

if (
    !chatForm ||
    !userInput ||
    !messages ||
    !welcome ||
    !sendBtn ||
    !attachmentButton ||
    !imageInput ||
    !attachmentPreview
) {
    throw new Error(
        "Gidy AI HTML elements are missing. Check your HTML IDs."
    );
}


// =========================================
// MARKDOWN RENDERING
// =========================================

function renderMessageText(element, content, role) {

    // User messages are displayed as plain text.
    if (role === "user") {
        element.textContent = content;
        return;
    }

    // Safely render Markdown if both libraries exist.
    if (
        typeof marked !== "undefined" &&
        window.DOMPurify
    ) {

        element.innerHTML = DOMPurify.sanitize(
            marked.parse(content)
        );

    } else {

        // Safe fallback.
        element.textContent = content;

    }

}


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

    avatar.textContent =
        role === "user" ? "👤" : "✦";

    const messageContent =
        document.createElement("div");

    messageContent.className = "message-content";

    const name = document.createElement("div");

    name.className = "message-name";

    name.textContent =
        role === "user" ? "You" : "Gidy AI";

    const text = document.createElement("div");

    text.className = "message-text";

    if (content) {

        renderMessageText(text, content, role);

    }

    messageContent.appendChild(name);

    // DISPLAY IMAGE IF AVAILABLE

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

function scrollToBottom() {

    // Intentionally disabled.
    // Readers control their own scrolling.

}


// =========================================
// TYPING INDICATOR
// =========================================

function showTyping() {

    const typingMessage = addMessage(
        "assistant",
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

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        alert(
            "Please select a JPG, PNG or WEBP image."
        );

        this.value = "";

        return;

    }

    if (file.size > 5 * 1024 * 1024) {

        alert(
            "Image size must be less than 5 MB."
        );

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

    const container =
        document.createElement("div");

    container.style.display = "flex";

    container.style.alignItems = "center";

    container.style.gap = "10px";

    container.style.padding = "8px";

    const image = document.createElement("img");

    previewUrl =
        URL.createObjectURL(selectedImage);

    image.src = previewUrl;

    image.style.width = "65px";

    image.style.height = "65px";

    image.style.objectFit = "cover";

    image.style.borderRadius = "8px";

    const removeButton =
        document.createElement("button");

    removeButton.type = "button";

    removeButton.textContent = "✕";

    removeButton.title = "Remove image";

    removeButton.addEventListener(
        "click",
        function () {

            selectedImage = null;

            imageInput.value = "";

            if (previewUrl) {

                URL.revokeObjectURL(previewUrl);

                previewUrl = null;

            }

            attachmentPreview.innerHTML = "";

        }
    );

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

            reject(
                new Error("Could not read the image.")
            );

        };

        reader.readAsDataURL(file);

    });

}


// =========================================
// LOAD PREVIOUS CONVERSATION
// =========================================

async function loadConversation() {

    isLoading = true;

    sendBtn.disabled = true;

    attachmentButton.disabled = true;

    try {

        const response = await fetch(
            API_URL +
            "/history?conversationId=" +
            encodeURIComponent(conversationId)
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.error || "Could not load conversation."
            );

        }

        messages.innerHTML = "";

        const history = data.messages || [];

        if (history.length === 0) {

            welcome.style.display = "block";

        } else {

            welcome.style.display = "none";

            history.forEach(item => {

                addMessage(
                    item.role,
                    item.content
                );

            });

        }

    } catch (error) {

        console.error(
            "Conversation loading error:",
            error
        );

        welcome.style.display = "block";

        // The user can still start chatting.
        // Existing saved data is not deleted.

    } finally {

        isLoading = false;

        sendBtn.disabled = false;

        attachmentButton.disabled = false;

    }

}


// =========================================
// SEND MESSAGE TO GIDY AI
// =========================================

async function sendMessage(question) {

    question = question.trim();

    if (
        (!question && !selectedImage) ||
        isLoading
    ) return;

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

    const typingMessage = showTyping();

    const replyElement =
        typingMessage.querySelector(".message-text");

    try {

        // PREPARE REQUEST

        const payload = {

            message: question ||
                "Please analyze this image.",

            conversationId: conversationId

        };

        // ATTACH IMAGE

        if (imageFile) {

            payload.image =
                await imageToBase64(imageFile);

            payload.imageType = imageFile.type;

        }

        // SEND TO CLOUDFLARE WORKER

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(payload)

        });

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Server error: " + response.status
            );

        }

        if (!data.response) {

            throw new Error(
                "The AI returned an empty response."
            );

        }

        // SAVE RETURNED CONVERSATION ID

        if (data.conversationId) {

            conversationId = data.conversationId;

            localStorage.setItem(
                STORAGE_KEY,
                conversationId
            );

        }

        // DISPLAY AI RESPONSE

        renderMessageText(
            replyElement,
            data.response,
            "assistant"
        );

        replyElement.classList.remove("typing");

    } catch (error) {

        replyElement.textContent =
            "⚠️ " + error.message;

        replyElement.classList.remove("typing");

        console.error(
            "Gidy AI Error:",
            error
        );

    } finally {

        isLoading = false;

        sendBtn.disabled = false;

        attachmentButton.disabled = false;

        if (imageUrl) {

            URL.revokeObjectURL(imageUrl);

        }

    }

}


// =========================================
// SUBMIT CHAT FORM
// =========================================

chatForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        sendMessage(userInput.value);

    }
);


// =========================================
// ENTER TO SEND MESSAGE
// =========================================

userInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            chatForm.requestSubmit();

        }

    }
);


// =========================================
// AUTO RESIZE TEXTAREA
// =========================================

userInput.addEventListener(
    "input",
    function () {

        userInput.style.height = "42px";

        userInput.style.height =
            Math.min(userInput.scrollHeight, 140) +
            "px";

    }
);


// =========================================
// START A NEW CONVERSATION
// =========================================

function startNewChat() {

    if (isLoading) return;

    // Generate a completely new conversation ID.

    conversationId = crypto.randomUUID();

    localStorage.setItem(
        STORAGE_KEY,
        conversationId
    );

    // Do not delete the previous conversation.
    // It remains saved in D1.

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

    sidebar?.classList.remove("open");

}


// =========================================
// NEW CHAT BUTTON
// =========================================

newChat?.addEventListener(
    "click",
    startNewChat
);


// =========================================
// DELETE CURRENT CONVERSATION
// =========================================

async function deleteCurrentConversation() {

    if (isLoading) return;

    const confirmed = confirm(
        "Delete this conversation permanently?"
    );

    if (!confirmed) return;

    isLoading = true;

    if (clearChat) clearChat.disabled = true;

    try {

        const response = await fetch(
            API_URL +
            "/conversation?conversationId=" +
            encodeURIComponent(conversationId),
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.error || "Could not delete conversation."
            );

        }

        startNewChat();

    } catch (error) {

        alert(
            "Could not delete conversation: " +
            error.message
        );

    } finally {

        isLoading = false;

        if (clearChat) clearChat.disabled = false;

    }

}


// =========================================
// CLEAR CHAT BUTTON
// =========================================

clearChat?.addEventListener(
    "click",
    deleteCurrentConversation
);


// =========================================
// SUGGESTED QUESTIONS
// =========================================

document.querySelectorAll(".suggestion")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const prompt = this.dataset.prompt;

                if (prompt) {

                    sendMessage(prompt);

                }

            }
        );

    });


// =========================================
// LEARNING AREA BUTTONS
// =========================================

document.querySelectorAll(".subject-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const prompt = this.dataset.prompt;

                if (prompt) {

                    sendMessage(prompt);

                }

                sidebar?.classList.remove("open");

            }
        );

    });


// =========================================
// MOBILE SIDEBAR
// =========================================

menuBtn?.addEventListener(
    "click",
    function () {

        sidebar?.classList.toggle("open");

    }
);


// =========================================
// START GIDY AI
// =========================================

loadConversation();
