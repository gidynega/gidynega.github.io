/* =====================================================
   GIDY AI - FRONTEND SCRIPT V3.5
   Features:
   - User Profile Top-Right Dropdown
   - Conversation History inside Sidebar Menu
   - Working "+ New Conversation" Button
   - Real-Time AI Streaming Response Simulation
===================================================== */

const API_URL = "https://bold-smoke-695fgidy-ai-backend.gidynega.workers.dev";
const SUPABASE_URL = "https://gdeekbojxavbrplxwwjd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RNZ44Wp5_AKFk37YGH7poQ_WbYRkaJY";

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// DOM ELEMENTS
const $ = id => document.getElementById(id);

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

const chatForm = $("chatForm");
const userInput = $("userInput");
const messages = $("messages");
const welcome = $("welcome");
const sendBtn = $("sendBtn");

const newChat = $("newChat");
const clearChat = $("clearChat");
const historyList = $("historyList");
const sidebar = $("sidebar");
const menuBtn = $("menuBtn");

const attachmentButton = $("attachmentButton");
const attachmentOptions = $("attachmentOptions");
const attachmentPreview = $("attachmentPreview");

let currentUser = null;
let conversationId = localStorage.getItem("gidy_ai_current_conversation") || createId();
let attachments = [];
let isSending = false;

function createId() {
    return "gidy-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

// =====================================================
// TOP-RIGHT AUTHENTICATION DROPDOWN & MENU
// =====================================================
profileMenuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (authDropdown) authDropdown.hidden = !authDropdown.hidden;
});

document.addEventListener("click", (e) => {
    if (authDropdown && !authDropdown.contains(e.target) && e.target !== profileMenuBtn) {
        authDropdown.hidden = true;
    }
});

function showAuthMessage(msg, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = msg;
    authMessage.style.color = isError ? "#ff6b6b" : "#65eee4";
}

function updateAccountInterface(user) {
    currentUser = user || null;

    if (authStatus) {
        authStatus.textContent = user ? "Signed in: " + user.email : "Not signed in";
    }

    if (userAvatarChar) {
        userAvatarChar.textContent = user ? user.email.charAt(0).toUpperCase() : "👤";
    }

    if (authForms) authForms.hidden = !!user;
    if (signOutBtn) signOutBtn.hidden = !user;
}

signUpBtn?.addEventListener("click", async () => {
    if (!supabaseClient) return showAuthMessage("Supabase not loaded.", true);
    const email = authEmail?.value.trim();
    const password = authPassword?.value;
    if (!email || !password) return showAuthMessage("Enter email & password.", true);

    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        updateAccountInterface(data.user);
        showAuthMessage("Account created successfully!");
    } catch (err) {
        showAuthMessage(err.message, true);
    }
});

signInBtn?.addEventListener("click", async () => {
    if (!supabaseClient) return showAuthMessage("Supabase not loaded.", true);
    const email = authEmail?.value.trim();
    const password = authPassword?.value;
    if (!email || !password) return showAuthMessage("Enter email & password.", true);

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        updateAccountInterface(data.user);
        showAuthMessage("Welcome back!");
    } catch (err) {
        showAuthMessage(err.message, true);
    }
});

signOutBtn?.addEventListener("click", async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    updateAccountInterface(null);
    showAuthMessage("Signed out successfully.");
});

async function initializeAuthentication() {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.auth.getSession();
    updateAccountInterface(data.session?.user || null);
    supabaseClient.auth.onAuthStateChange((_, session) => {
        updateAccountInterface(session?.user || null);
    });
}
initializeAuthentication();

// =====================================================
// CONVERSATION HISTORY (SIDEBAR)
// =====================================================
function getStoredHistory() {
    return JSON.parse(localStorage.getItem("gidy_ai_sessions") || "[]");
}

function saveConversationToHistory(id, title) {
    let sessions = getStoredHistory();
    const existingIndex = sessions.findIndex(s => s.id === id);

    if (existingIndex > -1) {
        sessions[existingIndex].title = title || sessions[existingIndex].title;
    } else {
        sessions.unshift({ id, title: title || "New Chat", timestamp: Date.now() });
    }
    localStorage.setItem("gidy_ai_sessions", JSON.stringify(sessions));
    renderSidebarHistory();
}

function renderSidebarHistory() {
    if (!historyList) return;
    historyList.innerHTML = "";
    const sessions = getStoredHistory();

    if (sessions.length === 0) {
        historyList.innerHTML = `<p style="font-size:11px; color:var(--muted); padding:4px 8px;">No chat history</p>`;
        return;
    }

    sessions.forEach(session => {
        const item = document.createElement("button");
        item.className = "history-item " + (session.id === conversationId ? "active" : "");
        
        const titleSpan = document.createElement("span");
        titleSpan.className = "history-title";
        titleSpan.textContent = session.title;

        const delBtn = document.createElement("button");
        delBtn.className = "history-delete";
        delBtn.innerHTML = "×";
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteConversationSession(session.id);
        };

        item.appendChild(titleSpan);
        item.appendChild(delBtn);

        item.onclick = () => loadConversationSession(session.id);
        historyList.appendChild(item);
    });
}

function deleteConversationSession(id) {
    let sessions = getStoredHistory().filter(s => s.id !== id);
    localStorage.setItem("gidy_ai_sessions", JSON.stringify(sessions));
    if (conversationId === id) {
        startNewConversation();
    } else {
        renderSidebarHistory();
    }
}

function loadConversationSession(id) {
    conversationId = id;
    localStorage.setItem("gidy_ai_current_conversation", conversationId);
    renderSidebarHistory();
    loadHistory();
}

// NEW CONVERSATION BUTTON
function startNewConversation() {
    conversationId = createId();
    localStorage.setItem("gidy_ai_current_conversation", conversationId);
    messages.innerHTML = "";
    if (welcome) welcome.style.display = "block";
    if (userInput) userInput.value = "";
    renderSidebarHistory();
}


// SIDEBAR NAVIGATION
function closeSidebar() {
    sidebar?.classList.remove("open");
}

function openSidebar() {
    sidebar?.classList.add("open");
}

newChat?.addEventListener("click", () => {
    startNewConversation();
    closeSidebar();
});

clearChat?.addEventListener("click", () => {
    if (confirm("Clear current conversation?")) {
        startNewConversation();
    }
});

menuBtn?.addEventListener("click", () => {
    if (sidebar?.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

// Sidebar close button
$("sidebarCloseBtn")?.addEventListener("click", closeSidebar);

// =====================================================
// CHAT RENDERING & STREAMING RESPONSE
// =====================================================
function renderMessageText(content) {
    const value = String(content || "");
    if (window.marked && window.DOMPurify) {
        return DOMPurify.sanitize(marked.parse(value));
    }
    return value.replace(/\n/g, "<br>");
}

function scrollToBottom() {
    const area = $("chatArea");
    if (area) area.scrollTop = area.scrollHeight;
}

function addMessage(role, content) {
    const message = document.createElement("div");
    message.className = "message " + (role === "user" ? "user-message" : "ai-message");

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "👤" : "🤖";

    const contentBox = document.createElement("div");
    contentBox.className = "message-content";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = role === "user" ? "You" : "Gidy AI";

    const text = document.createElement("div");
    text.className = "message-text";
    text.innerHTML = renderMessageText(content);

    contentBox.appendChild(name);
    contentBox.appendChild(text);
    message.appendChild(avatar);
    message.appendChild(contentBox);

    messages.appendChild(message);
    if (welcome) welcome.style.display = "none";
    scrollToBottom();

    return text; // Return text container element for dynamic updates
}

// STREAMING TEXT SIMULATION (WORD-BY-WORD CHUNK ANIMATION)
async function streamTextResponse(fullText) {
    const textElement = addMessage("assistant", "");
    textElement.classList.add("streaming-cursor");

    const words = fullText.split(" ");
    let displayed = "";

    for (let i = 0; i < words.length; i++) {
        displayed += (i === 0 ? "" : " ") + words[i];
        textElement.innerHTML = renderMessageText(displayed);
        scrollToBottom();
        await new Promise(res => setTimeout(res, 35)); // Fast streaming pace
    }

    textElement.classList.remove("streaming-cursor");
}

// =====================================================
// API REQUEST & SEND MESSAGE
// =====================================================
async function apiRequest(path, options = {}) {
    const response = await fetch(API_URL + path, options);
    if (!response.ok) throw new Error("Server error: " + response.status);
    return response.json();
}

async function loadHistory() {
    try {
        const data = await apiRequest("/history?conversationId=" + encodeURIComponent(conversationId));
        messages.innerHTML = "";
        if (!data.success || !data.messages?.length) {
            if (welcome) welcome.style.display = "block";
            return;
        }
        if (welcome) welcome.style.display = "none";
        data.messages.forEach(item => addMessage(item.role, item.content));
    } catch (err) {
        console.warn("No active history found:", err);
    }
}

async function sendMessage(e) {
    if (e) e.preventDefault();
    if (!currentUser) return alert("Please log in first via the top-right profile icon.");

    const text = userInput.value.trim();
    if (!text && attachments.length === 0) return;

    isSending = true;
    sendBtn.disabled = true;

    addMessage("user", text);
    userInput.value = "";

    // Update conversation sidebar title using first message
    const sessions = getStoredHistory();
    if (!sessions.some(s => s.id === conversationId)) {
        saveConversationToHistory(conversationId, text.slice(0, 24) + "...");
    }

    try {
        const payload = { message: text, conversationId };
        const data = await apiRequest("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (data.reply) {
            await streamTextResponse(data.reply);
        } else {
            addMessage("assistant", "No response received.");
        }
    } catch (err) {
        addMessage("assistant", "⚠️ Error: " + err.message);
    } finally {
        isSending = false;
        sendBtn.disabled = false;
    }
}

chatForm?.addEventListener("submit", sendMessage);
userInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// INITIALIZATION
renderSidebarHistory();
loadHistory();
// =====================================================
// 1. FIX: "+ NEW CONVERSATION" & MOBILE SIDEBAR NAVIGATION
// =====================================================
function closeSidebar() {
    sidebar?.classList.remove("open");
}

function startNewConversation() {
    conversationId = createId();
    localStorage.setItem("gidy_ai_current_conversation", conversationId);
    messages.innerHTML = "";
    attachments = [];
    if (attachmentPreview) attachmentPreview.innerHTML = "";
    if (welcome) welcome.style.display = "block";
    if (userInput) {
        userInput.value = "";
        userInput.focus();
    }
    renderSidebarHistory();
    closeSidebar(); // Moves user back to the fresh conversation page on mobile
}

// Close sidebar when tapping outside of it on mobile
document.addEventListener("click", (e) => {
    if (
        sidebar?.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        e.target !== menuBtn
    ) {
        closeSidebar();
    }
});

// Close sidebar when selecting a saved conversation or learning area prompt
document.querySelectorAll(".subject-btn, .suggestion").forEach(btn => {
    btn.addEventListener("click", () => {
        const prompt = btn.getAttribute("data-prompt");
        if (prompt && userInput) {
            userInput.value = prompt;
            userInput.focus();
        }
        closeSidebar();
    });
});

// Also close sidebar inside loadConversationSession:
// Add `closeSidebar();` at the end of your existing loadConversationSession(id) function.


// =====================================================
// 2. FIX: "+" ATTACHMENT BUTTON & FILE PICKERS
// =====================================================
const imageInput = $("imageInput");
const pdfInput = $("pdfInput");
const documentInput = $("documentInput");
const audioInput = $("audioInput");
const videoInput = $("videoInput");

attachmentButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (attachmentOptions) {
        attachmentOptions.hidden = !attachmentOptions.hidden;
    }
});

// Close attachment sheet when clicking outside
document.addEventListener("click", (e) => {
    if (
        attachmentOptions &&
        !attachmentOptions.hidden &&
        !attachmentOptions.contains(e.target) &&
        e.target !== attachmentButton
    ) {
        attachmentOptions.hidden = true;
    }
});

// Wire up attachment sheet buttons to hidden file inputs
$("chooseImage")?.addEventListener("click", () => {
    attachmentOptions.hidden = true;
    imageInput?.click();
});

$("chooseCamera")?.addEventListener("click", () => {
    attachmentOptions.hidden = true;
    if (imageInput) {
        imageInput.setAttribute("capture", "environment");
        imageInput.click();
    }
});

$("choosePDF")?.addEventListener("click", () => {
    attachmentOptions.hidden = true;
    pdfInput?.click();
});

$("chooseAudio")?.addEventListener("click", () => {
    attachmentOptions.hidden = true;
    audioInput?.click();
});

$("chooseVideo")?.addEventListener("click", () => {
    attachmentOptions.hidden = true;
    videoInput?.click();
});

// Handle selected files and show preview chips
function handleFileSelection(inputEl) {
    inputEl?.addEventListener("change", () => {
        const files = Array.from(inputEl.files || []);
        files.forEach(file => {
            attachments.push(file);
            if (attachmentPreview) {
                const chip = document.createElement("span");
                chip.className = "attachment-chip";
                chip.textContent = `📎 ${file.name}`;
                attachmentPreview.appendChild(chip);
            }
        });
        inputEl.value = "";
    });
}

[imageInput, pdfInput, documentInput, audioInput, videoInput].forEach(handleFileSelection);
