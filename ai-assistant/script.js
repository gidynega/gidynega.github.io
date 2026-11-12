
/* =====================================================
   GIDY AI - COMPLETE FRONTEND JAVASCRIPT V4.0
   Features:
   - Supabase Authentication
   - User Profile Dropdown
   - Conversation History
   - New Conversation
   - Mobile Sidebar Navigation
   - AI Backend Connection
   - Animated AI Responses
   - Attachment Menu
   - Image, PDF, Document, Audio and Video Selection
===================================================== */

// =====================================================
// 1. CONFIGURATION
// =====================================================

const API_URL =
    "https://bold-smoke-695fgidy-ai-backend.gidynega.workers.dev";

const SUPABASE_URL =
    "https://gdeekbojxavbrplxwwjd.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_RNZ44Wp5_AKFk37YGH7poQ_WbYRkaJY";

const supabaseClient = window.supabase
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
    : null;


// =====================================================
// 2. DOM ELEMENTS
// =====================================================

const $ = id => document.getElementById(id);

// Authentication
const profileMenuBtn = $("profileMenuBtn");
const authDropdown = $("authDropdown");
const authEmail = $("authEmail");
const authPassword = $("authPassword");

const signUpBtn = $("signUpBtn");
const signInBtn = $("signInBtn");
const signOutBtn = $("signOutBtn");
const resetPasswordBtn = $("resetPasswordBtn");

const authStatus = $("authStatus");
const authMessage = $("authMessage");
const authForms = $("authForms");
const userAvatarChar = $("userAvatarChar");

// Chat
const chatForm = $("chatForm");
const userInput = $("userInput");
const messages = $("messages");
const welcome = $("welcome");
const sendBtn = $("sendBtn");

// Sidebar
const sidebar = $("sidebar");
const menuBtn = $("menuBtn");
const sidebarCloseBtn = $("sidebarCloseBtn");

const newChat = $("newChat");
const clearChat = $("clearChat");
const historyList = $("historyList");

// Attachments
const attachmentButton = $("attachmentButton");
const attachmentOptions = $("attachmentOptions");
const attachmentPreview = $("attachmentPreview");

const imageInput = $("imageInput");
const pdfInput = $("pdfInput");
const documentInput = $("documentInput");
const audioInput = $("audioInput");
const videoInput = $("videoInput");

const chooseImage = $("chooseImage");
const chooseCamera = $("chooseCamera");
const choosePDF = $("choosePDF");
const chooseAudio = $("chooseAudio");
const chooseVideo = $("chooseVideo");

// Other controls
const voiceButton = $("voiceButton");
const speakReplies = $("speakReplies");


// =====================================================
// 3. APPLICATION STATE
// =====================================================

let currentUser = null;

let conversationId =
    localStorage.getItem("gidy_ai_current_conversation") ||
    createId();

let attachments = [];
let isSending = false;


// Generate unique conversation ID
function createId() {
    return "gidy-" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 9);
}


// =====================================================
// 4. SIDEBAR NAVIGATION
// =====================================================

function openSidebar() {
    sidebar?.classList.add("open");
}

function closeSidebar() {
    sidebar?.classList.remove("open");
}

function toggleSidebar() {
    if (!sidebar) return;

    sidebar.classList.toggle("open");
}


// Main menu button
menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSidebar();
});


// Sidebar close button
sidebarCloseBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeSidebar();
});


// Close sidebar when tapping outside it
document.addEventListener("click", (e) => {
    if (
        sidebar?.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        e.target !== menuBtn
    ) {
        closeSidebar();
    }
});


// =====================================================
// 5. SUPABASE AUTHENTICATION
// =====================================================

function showAuthMessage(message, isError = false) {
    if (!authMessage) return;

    authMessage.textContent = message;

    authMessage.style.color = isError
        ? "#ff6b6b"
        : "#65eee4";
}


// Update account interface
function updateAccountInterface(user) {
    currentUser = user || null;

    if (authStatus) {
        authStatus.textContent = user
            ? "Signed in: " + user.email
            : "Not signed in";
    }

    if (userAvatarChar) {
        userAvatarChar.textContent = user
            ? user.email.charAt(0).toUpperCase()
            : "👤";
    }

    if (authForms) {
        authForms.hidden = !!user;
    }

    if (signOutBtn) {
        signOutBtn.hidden = !user;
    }
}


// Open profile dropdown
profileMenuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();

    if (authDropdown) {
        authDropdown.hidden = !authDropdown.hidden;
    }
});


// Close profile dropdown outside
document.addEventListener("click", (e) => {
    if (
        authDropdown &&
        !authDropdown.contains(e.target) &&
        !profileMenuBtn?.contains(e.target)
    ) {
        authDropdown.hidden = true;
    }
});


// CREATE ACCOUNT
signUpBtn?.addEventListener("click", async () => {
    if (!supabaseClient) {
        return showAuthMessage(
            "Supabase is not loaded.",
            true
        );
    }

    const email = authEmail?.value.trim();
    const password = authPassword?.value;

    if (!email || !password) {
        return showAuthMessage(
            "Enter your email and password.",
            true
        );
    }

    try {
        const { data, error } =
            await supabaseClient.auth.signUp({
                email,
                password
            });

        if (error) throw error;

        if (data.session) {
            updateAccountInterface(data.user);
            showAuthMessage("Account created successfully!");
        } else {
            showAuthMessage(
                "Account created. Check your email to confirm your account."
            );
        }

    } catch (error) {
        showAuthMessage(error.message, true);
    }
});


// LOGIN
signInBtn?.addEventListener("click", async () => {
    if (!supabaseClient) {
        return showAuthMessage(
            "Supabase is not loaded.",
            true
        );
    }

    const email = authEmail?.value.trim();
    const password = authPassword?.value;

    if (!email || !password) {
        return showAuthMessage(
            "Enter your email and password.",
            true
        );
    }

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) throw error;

        updateAccountInterface(data.user);

        showAuthMessage("Welcome back!");

        if (authDropdown) {
            authDropdown.hidden = true;
        }

    } catch (error) {
        showAuthMessage(error.message, true);
    }
});


// LOGOUT
signOutBtn?.addEventListener("click", async () => {
    if (!supabaseClient) return;

    try {
        const { error } =
            await supabaseClient.auth.signOut();

        if (error) throw error;

        updateAccountInterface(null);

        showAuthMessage("Signed out successfully.");

    } catch (error) {
        showAuthMessage(error.message, true);
    }
});


// PASSWORD RESET
resetPasswordBtn?.addEventListener("click", async () => {
    if (!supabaseClient) {
        return showAuthMessage(
            "Supabase is not loaded.",
            true
        );
    }

    const email = authEmail?.value.trim();

    if (!email) {
        return showAuthMessage(
            "Enter your email first.",
            true
        );
    }

    try {
        const { error } =
            await supabaseClient.auth.resetPasswordForEmail(
                email
            );

        if (error) throw error;

        showAuthMessage(
            "Password reset instructions have been sent if the account exists."
        );

    } catch (error) {
        showAuthMessage(error.message, true);
    }
});


// INITIALIZE AUTHENTICATION
async function initializeAuthentication() {
    if (!supabaseClient) return;

    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) throw error;

        updateAccountInterface(
            data.session?.user || null
        );

        supabaseClient.auth.onAuthStateChange(
            (_, session) => {
                updateAccountInterface(
                    session?.user || null
                );
            }
        );

    } catch (error) {
        console.error("Authentication error:", error);
    }
}


// =====================================================
// 6. CONVERSATION HISTORY
// =====================================================

function getStoredHistory() {
    try {
        return JSON.parse(
            localStorage.getItem("gidy_ai_sessions") || "[]"
        );
    } catch (error) {
        console.error("History error:", error);
        return [];
    }
}


// Save conversation
function saveConversationToHistory(id, title) {
    const sessions = getStoredHistory();

    const existingIndex =
        sessions.findIndex(session => session.id === id);

    if (existingIndex > -1) {
        sessions[existingIndex].title =
            title || sessions[existingIndex].title;

        sessions[existingIndex].timestamp = Date.now();

    } else {
        sessions.unshift({
            id,
            title: title || "New Chat",
            timestamp: Date.now()
        });
    }

    localStorage.setItem(
        "gidy_ai_sessions",
        JSON.stringify(sessions)
    );

    renderSidebarHistory();
}


// Display conversation history
function renderSidebarHistory() {
    if (!historyList) return;

    historyList.innerHTML = "";

    const sessions = getStoredHistory();

    if (sessions.length === 0) {
        const empty = document.createElement("p");

        empty.textContent = "No chat history";

        empty.style.cssText =
            "font-size:11px;color:var(--muted);padding:4px 8px;";

        historyList.appendChild(empty);

        return;
    }

    sessions.forEach(session => {
        const item = document.createElement("button");

        item.type = "button";

        item.className =
            "history-item " +
            (session.id === conversationId ? "active" : "");

        const titleSpan = document.createElement("span");

        titleSpan.className = "history-title";

        titleSpan.textContent =
            session.title || "New Chat";

        const deleteBtn = document.createElement("button");

        deleteBtn.type = "button";

        deleteBtn.className = "history-delete";

        deleteBtn.textContent = "×";

        deleteBtn.setAttribute(
            "aria-label",
            "Delete conversation"
        );

        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteConversationSession(session.id);
        });

        item.appendChild(titleSpan);
        item.appendChild(deleteBtn);

        item.addEventListener("click", () => {
            loadConversationSession(session.id);
        });

        historyList.appendChild(item);
    });
}


// Delete conversation
function deleteConversationSession(id) {
    const sessions = getStoredHistory().filter(
        session => session.id !== id
    );

    localStorage.setItem(
        "gidy_ai_sessions",
        JSON.stringify(sessions)
    );

    if (conversationId === id) {
        startNewConversation();
    } else {
        renderSidebarHistory();
    }
}


// Load conversation
function loadConversationSession(id) {
    conversationId = id;

    localStorage.setItem(
        "gidy_ai_current_conversation",
        conversationId
    );

    renderSidebarHistory();

    closeSidebar();

    loadHistory();
}


// =====================================================
// 7. NEW CONVERSATION & CLEAR CHAT
// =====================================================

function startNewConversation() {

    // Create a new ID
    conversationId = createId();

    localStorage.setItem(
        "gidy_ai_current_conversation",
        conversationId
    );

    // Clear displayed messages
    if (messages) {
        messages.innerHTML = "";
    }

    // Reset attachments
    attachments = [];

    if (attachmentPreview) {
        attachmentPreview.innerHTML = "";
    }

    if (attachmentOptions) {
        attachmentOptions.hidden = true;
    }

    // Show welcome screen
    if (welcome) {
        welcome.style.display = "block";
    }

    // Reset input
    if (userInput) {
        userInput.value = "";
    }

    // Update history
    renderSidebarHistory();

    // Return to chat
    closeSidebar();
}


// New conversation button
newChat?.addEventListener("click", () => {
    startNewConversation();
});


// Clear current chat
clearChat?.addEventListener("click", () => {
    if (confirm("Clear current conversation?")) {
        startNewConversation();
    }
});


// =====================================================
// 8. LEARNING AREA & SUGGESTION BUTTONS
// =====================================================

document.querySelectorAll(
    ".subject-btn, .suggestion"
).forEach(button => {

    button.addEventListener("click", () => {

        const prompt =
            button.getAttribute("data-prompt");

        if (prompt && userInput) {
            userInput.value = prompt;
            userInput.focus();
        }

        closeSidebar();
    });

});


// =====================================================
// 9. MESSAGE RENDERING
// =====================================================

function renderMessageText(content) {

    const value = String(content || "");

    if (window.marked && window.DOMPurify) {

        return DOMPurify.sanitize(
            marked.parse(value)
        );

    }

    const safeText = document.createElement("div");

    safeText.textContent = value;

    return safeText.innerHTML.replace(
        /\n/g,
        "<br>"
    );
}


// Scroll chat to bottom
function scrollToBottom() {

    const area = $("chatArea");

    if (area) {
        area.scrollTop = area.scrollHeight;
    }
}


// Add message to chat
function addMessage(role, content) {

    if (!messages) return null;

    const message = document.createElement("div");

    message.className =
        "message " +
        (role === "user" ? "user-message" : "ai-message");

    const avatar = document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent =
        role === "user" ? "👤" : "🤖";

    const contentBox = document.createElement("div");

    contentBox.className = "message-content";

    const name = document.createElement("div");

    name.className = "message-name";

    name.textContent =
        role === "user" ? "You" : "Gidy AI";

    const text = document.createElement("div");

    text.className = "message-text";

    text.innerHTML = renderMessageText(content);

    contentBox.appendChild(name);
    contentBox.appendChild(text);

    message.appendChild(avatar);
    message.appendChild(contentBox);

    messages.appendChild(message);

    if (welcome) {
        welcome.style.display = "none";
    }

    scrollToBottom();

    return text;
}


// =====================================================
// 10. AI RESPONSE STREAMING SIMULATION
// =====================================================

async function streamTextResponse(fullText) {

    const textElement =
        addMessage("assistant", "");

    if (!textElement) return;

    textElement.classList.add("streaming-cursor");

    const words = String(fullText).split(" ");

    let displayed = "";

    for (let i = 0; i < words.length; i++) {

        displayed +=
            (i === 0 ? "" : " ") + words[i];

        textElement.innerHTML =
            renderMessageText(displayed);

        scrollToBottom();

        await new Promise(resolve =>
            setTimeout(resolve, 35)
        );
    }

    textElement.classList.remove("streaming-cursor");
}


// =====================================================
// 11. BACKEND API CONNECTION
// =====================================================

async function apiRequest(path, options = {}) {

    const response = await fetch(
        API_URL + path,
        options
    );

    if (!response.ok) {
        throw new Error(
            "Server error: " + response.status
        );
    }

    return response.json();
}


// =====================================================
// 12. LOAD CONVERSATION HISTORY FROM BACKEND
// =====================================================

async function loadHistory() {

    try {

        const data = await apiRequest(
            "/history?conversationId=" +
            encodeURIComponent(conversationId)
        );

        if (!messages) return;

        messages.innerHTML = "";

        if (!data.success || !data.messages?.length) {

            if (welcome) {
                welcome.style.display = "block";
            }

            return;
        }

        if (welcome) {
            welcome.style.display = "none";
        }

        data.messages.forEach(item => {
            addMessage(item.role, item.content);
        });

    } catch (error) {

        console.warn(
            "No active history found:",
            error
        );
    }
}


// =====================================================
// 13. SEND MESSAGE TO GIDY AI
// =====================================================

async function sendMessage(e) {

    if (e) {
        e.preventDefault();
    }

    if (isSending) return;

    if (!currentUser) {

        alert(
            "Please log in first using the top-right profile icon."
        );

        return;
    }

    if (!userInput) return;

    const text = userInput.value.trim();

    if (!text && attachments.length === 0) {
        return;
    }

    // Current backend endpoint sends text only.
    if (!text && attachments.length > 0) {
        alert(
            "Please enter a message. File transmission requires the backend upload integration."
        );
        return;
    }

    isSending = true;

    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "…";
    }

    addMessage("user", text);

    userInput.value = "";

    // Save conversation title
    const sessions = getStoredHistory();

    if (!sessions.some(
        session => session.id === conversationId
    )) {

        saveConversationToHistory(
            conversationId,
            text.slice(0, 24) +
            (text.length > 24 ? "..." : "")
        );
    }

    try {

        const payload = {
            message: text,
            conversationId: conversationId
        };

        const data = await apiRequest("/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)
        });

        if (data.reply) {

            await streamTextResponse(data.reply);

        } else {

            addMessage(
                "assistant",
                "No response received from Gidy AI."
            );
        }

    } catch (error) {

        addMessage(
            "assistant",
            "⚠️ Error: " + error.message
        );

    } finally {

        isSending = false;

        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = "➤";
        }
    }
}


// Chat form submission
chatForm?.addEventListener(
    "submit",
    sendMessage
);


// Press Enter to send
userInput?.addEventListener("keydown", (e) => {

    if (
        e.key === "Enter" &&
        !e.shiftKey
    ) {

        e.preventDefault();

        sendMessage();
    }
});


// =====================================================
// 14. ATTACHMENT MENU
// =====================================================

// Open and close attachment menu
attachmentButton?.addEventListener("click", (e) => {

    e.preventDefault();

    e.stopPropagation();

    if (!attachmentOptions) return;

    attachmentOptions.hidden =
        !attachmentOptions.hidden;
});


// Close attachment menu when tapping outside
document.addEventListener("click", (e) => {

    if (
        attachmentOptions &&
        !attachmentOptions.hidden &&
        !attachmentOptions.contains(e.target) &&
        !attachmentButton?.contains(e.target)
    ) {

        attachmentOptions.hidden = true;
    }
});

// =====================================================
// 15. OPEN FILE PICKERS
// =====================================================

chooseImage?.addEventListener("click", () => {

    if (attachmentOptions) {
        attachmentOptions.hidden = true;
    }

    imageInput?.click();
});


chooseCamera?.addEventListener("click", () => {

    if (attachmentOptions) {
        attachmentOptions.hidden = true;
    }

    if (imageInput) {

        imageInput.setAttribute(
            "capture",
            "environment"
        );

        imageInput.click();
    }
});


choosePDF?.addEventListener("click", () => {

    if (attachmentOptions) {
        attachmentOptions.hidden = true;
    }

    pdfInput?.click();
});


chooseAudio?.addEventListener("click", () => {

    if (attachmentOptions) {
        attachmentOptions.hidden = true;
    }

    audioInput?.click();
});


chooseVideo?.addEventListener("click", () => {

    if (attachmentOptions) {
        attachmentOptions.hidden = true;
    }

    videoInput?.click();
});

// =====================================================
// 16. FILE SELECTION & PREVIEW
// =====================================================

function handleFileSelection(inputElement) {

    if (!inputElement) return;

    inputElement.addEventListener("change", () => {

        const files = Array.from(
            inputElement.files || []
        );

        files.forEach(file => {

            attachments.push(file);

            if (attachmentPreview) {

                const chip =
                    document.createElement("span");

                chip.className = "attachment-chip";

                chip.textContent =
                    "📎 " + file.name;

                attachmentPreview.appendChild(chip);
            }
        });

        // Reset file input for future selection
        inputElement.value = "";

        // Camera capture should not remain enabled
        inputElement.removeAttribute("capture");
    });
}


// Connect all file inputs
[
    imageInput,
    pdfInput,
    documentInput,
    audioInput,
    videoInput

].forEach(handleFileSelection);

// =====================================================
// 17. INITIALIZE APPLICATION
// =====================================================

function initializeGidyAI() {

    renderSidebarHistory();

    loadHistory();

    initializeAuthentication();

    // Ensure attachment menu starts closed
    if (attachmentOptions) {
        attachmentOptions.hidden = true;
    }

    // Ensure send button is visible and enabled
    if (sendBtn) {
        sendBtn.hidden = false;
        sendBtn.disabled = false;
        sendBtn.textContent = "➤";
    }
}


// Start application
initializeGidyAI();


/* =====================================================
   END OF GIDY AI FRONTEND JAVASCRIPT V4.0
===================================================== */
