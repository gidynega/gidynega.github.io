/* ==============================
   GIDY AI - JAVASCRIPT
   Connected to Cloudflare Workers AI
================================ */

// BACKEND CONNECTION

const API_URL = "https://bold-smoke-695fgidy-ai-backend.gidynega.workers.dev";

// GET HTML ELEMENTS

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const sendBtn = document.getElementById("sendBtn");
const newChat = document.getElementById("newChat");
const clearChat = document.getElementById("clearChat");

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

let isLoading = false;

// ADD MESSAGE TO CHAT (Updated to use marked.parse for Markdown rendering)

function addMessage(role, content) {

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
    
    // Convert Markdown (like **bold** or lists) into clean HTML elements
    text.innerHTML = marked.parse(content);

    messageContent.appendChild(name);
    messageContent.appendChild(text);

    message.appendChild(avatar);
    message.appendChild(messageContent);

    messages.appendChild(message);

    scrollToBottom();

    return message;
}

// SCROLL TO LATEST MESSAGE

function scrollToBottom() {

    const chatArea = document.getElementById("chatArea");

    if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// SHOW TYPING INDICATOR

function showTyping() {

    const typingMessage = addMessage(
        "ai",
        "Gidy AI is thinking..."
    );

    typingMessage.querySelector(".message-text")
        .classList.add("typing");

    return typingMessage;
}

// SEND QUESTION TO AI

async function sendMessage(question) {

    question = question.trim();

    if (!question || isLoading) return;

    addMessage("user", question);

    userInput.value = "";
    userInput.style.height = "42px";

    isLoading = true;
    sendBtn.disabled = true;

    const typingMessage = showTyping();

    const replyElement =
        typingMessage.querySelector(".message-text");

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: question
            })

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Server error: " + response.status
            );
        }

        const aiReply = data.reply || data.response;

        if (!aiReply) {
            throw new Error(
                "The AI returned an empty response."
            );
        }

        // Render AI response properly as HTML via marked.js
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

        userInput.focus();
        scrollToBottom();

    }
}

// SUBMIT CHAT FORM

chatForm.addEventListener("submit", function(event) {

    event.preventDefault();

    sendMessage(userInput.value);

});

// ENTER TO SEND MESSAGE

userInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        chatForm.requestSubmit();

    }

});

// AUTO RESIZE TEXTAREA

userInput.addEventListener("input", function() {

    userInput.style.height = "42px";

    userInput.style.height =
        Math.min(userInput.scrollHeight, 140) + "px";

});

// NEW CONVERSATION

function startNewChat() {

    messages.innerHTML = "";

    welcome.style.display = "block";

    userInput.value = "";
    userInput.focus();

    sidebar.classList.remove("open");

}

// NEW CHAT BUTTON

newChat.addEventListener("click", startNewChat);

// CLEAR CONVERSATION

clearChat.addEventListener("click", function() {

    startNewChat();

});

// SUGGESTED QUESTIONS

document.querySelectorAll(".suggestion").forEach(button => {

    button.addEventListener("click", function() {

        const prompt = this.dataset.prompt;

        sendMessage(prompt);

    });

});

// LEARNING AREA BUTTONS

document.querySelectorAll(".subject-btn").forEach(button => {

    button.addEventListener("click", function() {

        const prompt = this.dataset.prompt;

        sendMessage(prompt);

        sidebar.classList.remove("open");

    });

});

// MOBILE SIDEBAR

menuBtn.addEventListener("click", function() {

    sidebar.classList.toggle("open");

});
