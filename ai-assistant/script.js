
/* =====================================================
   GIDY AI - COMPLETE FRONTEND V3.0
   Compatible with GIDY AI Cloudflare Worker V3

   FEATURES:
   1. Text conversations
   2. Image uploads and vision
   3. PDF text extraction
   4. Word, Excel and text documents
   5. PowerPoint text extraction
   6. Audio transcription
   7. Video frame analysis
   8. Conversation history
   9. Delete and new conversations
   10. Voice recording
   11. AI speech replies
===================================================== */

// =====================================================
// BACKEND
// =====================================================

const API_URL =
    "https://bold-smoke-695fgidy-ai-backend.gidynega.workers.dev";

// ==========================================
// SUPABASE AUTHENTICATION CONFIGURATION
// ==========================================

const SUPABASE_URL =
    "https://gdeekbojxavbrplxwwjd.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_RNZ44Wp5_AKFk37YGH7poQ_WbYRkaJY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("Gidy AI Supabase connected.");

// =====================================================
// GIDY AI — ACCOUNT AUTHENTICATION
// =====================================================

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");

const authStatus = document.getElementById("authStatus");
const authMessage = document.getElementById("authMessage");
const authForms = document.getElementById("authForms");

let currentUser = null;

function showAuthMessage(message, isError = false) {
    if (!authMessage) return;

    authMessage.textContent = message;
    authMessage.style.color = isError ? "#ff6b6b" : "#65eee4";
}

function updateAccountInterface(user) {
    currentUser = user || null;

    if (authStatus) {
        authStatus.textContent = user
            ? "Signed in: " + user.email
            : "You are not signed in.";
    }

    if (authForms) {
        authForms.hidden = !!user;
    }

    if (signOutBtn) {
        signOutBtn.hidden = !user;
    }
}

// SIGN UP
signUpBtn?.addEventListener("click", async () => {
    const email = authEmail?.value.trim();
    const password = authPassword?.value;

    if (!email || !password) {
        showAuthMessage("Enter your email and password.", true);
        return;
    }

    if (password.length < 8) {
        showAuthMessage("Password must contain at least 8 characters.", true);
        return;
    }

    signUpBtn.disabled = true;

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) throw error;

        if (data.session) {
            updateAccountInterface(data.user);
            showAuthMessage("Account created successfully!");
        } else {
            showAuthMessage(
                "Account created! Check your email to verify your account."
            );
        }

    } catch (error) {
        showAuthMessage(error.message, true);
    } finally {
        signUpBtn.disabled = false;
    }
});

// SIGN IN
signInBtn?.addEventListener("click", async () => {
    const email = authEmail?.value.trim();
    const password = authPassword?.value;

    if (!email || !password) {
        showAuthMessage("Enter your email and password.", true);
        return;
    }

    signInBtn.disabled = true;

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) throw error;

        updateAccountInterface(data.user);
        showAuthMessage("Welcome to Gidy AI!");

    } catch (error) {
        showAuthMessage(error.message, true);
    } finally {
        signInBtn.disabled = false;
    }
});

// PASSWORD RESET
resetPasswordBtn?.addEventListener("click", async () => {
    const email = authEmail?.value.trim();

    if (!email) {
        showAuthMessage("Enter your email address first.", true);
        return;
    }

    resetPasswordBtn.disabled = true;

    try {
        const { error } =
            await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });

        if (error) throw error;

        showAuthMessage("Password reset instructions sent to your email.");

    } catch (error) {
        showAuthMessage(error.message, true);
    } finally {
        resetPasswordBtn.disabled = false;
    }
});

// SIGN OUT
signOutBtn?.addEventListener("click", async () => {
    signOutBtn.disabled = true;

    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        updateAccountInterface(null);
        showAuthMessage("You have signed out successfully.");

    } catch (error) {
        showAuthMessage(error.message, true);
    } finally {
        signOutBtn.disabled = false;
    }
});

// RESTORE LOGIN SESSION AND LISTEN FOR AUTH CHANGES
async function initializeAuthentication() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        showAuthMessage(error.message, true);
        return;
    }

    updateAccountInterface(data.session?.user || null);

    supabaseClient.auth.onAuthStateChange((event, session) => {
        updateAccountInterface(session?.user || null);
    });

    console.log("Gidy AI authentication initialized.");
}

initializeAuthentication();


const STORAGE_KEY = "gidy_ai_current_conversation";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_DOCUMENT_TEXT = 50000;
const MAX_IMAGES = 8;
const MAX_VIDEO_FRAMES = 4;

// =====================================================
// HTML ELEMENTS
// =====================================================

const $ = id => document.getElementById(id);

const chatForm = $("chatForm");
const userInput = $("userInput");
const messages = $("messages");
const welcome = $("welcome");
const sendBtn = $("sendBtn");

const newChat = $("newChat");
const clearChat = $("clearChat");
const sidebar = $("sidebar");
const menuBtn = $("menuBtn");

const attachmentButton = $("attachmentButton");
const attachmentOptions = $("attachmentOptions");
const attachmentPreview = $("attachmentPreview");

const imageInput = $("imageInput");
const pdfInput = $("pdfInput");
const documentInput = $("documentInput");
const audioInput = $("audioInput");
const videoInput = $("videoInput");

const chooseImage = $("chooseImage");
const choosePDF = $("choosePDF");
const chooseDocument = $("chooseDocument");
const chooseAudio = $("chooseAudio");
const chooseVideo = $("chooseVideo");

const voiceButton = $("voiceButton");
const recordingStatus = $("recordingStatus");
const stopRecordingButton = $("stopRecording");
const speakReplies = $("speakReplies");

// =====================================================
// APPLICATION STATE
// =====================================================

function createId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "gidy-" + Date.now() + "-" +
        Math.random().toString(36).slice(2);
}

let conversationId =
    localStorage.getItem(STORAGE_KEY) || createId();

let attachments = [];
let isSending = false;
let mediaRecorder = null;
let recordedChunks = [];
let currentAudio = null;

localStorage.setItem(STORAGE_KEY, conversationId);

// =====================================================
// INITIAL CHECK
// =====================================================

if (!chatForm || !userInput || !messages || !sendBtn) {
    console.error("Gidy AI: Required HTML elements are missing.");
    alert("Gidy AI could not find the chat form. Check index.html.");
}

// =====================================================
// BACKEND REQUEST HELPER
// =====================================================

async function apiRequest(path, options = {}) {
    const response = await fetch(API_URL + path, {
        ...options,
        headers: {
            ...(options.headers || {})
        }
    });

    const contentType =
        response.headers.get("content-type") || "";

    if (!response.ok) {
        let errorMessage = "Server error: " + response.status;

        if (contentType.includes("application/json")) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
        } else {
            const text = await response.text();
            if (text) errorMessage = text.slice(0, 300);
        }

        throw new Error(errorMessage);
    }

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response;
}

// =====================================================
// OPTIONAL LIBRARY LOADER
// =====================================================

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src = url;
        script.async = true;

        script.onload = resolve;
        script.onerror = () => reject(
            new Error("Could not load library: " + url)
        );

        document.head.appendChild(script);
    });
}

async function ensureLibrary(name) {
    try {
        if (name === "mammoth") {
            if (!window.mammoth) {
                await loadScript(
                    "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.9.0/mammoth.browser.min.js"
                );
            }
            return !!window.mammoth;
        }

        if (name === "xlsx") {
            if (!window.XLSX) {
                await loadScript(
                    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
                );
            }
            return !!window.XLSX;
        }

        if (name === "jszip") {
            if (!window.JSZip) {
                await loadScript(
                    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
                );
            }
            return !!window.JSZip;
        }
    } catch (error) {
        console.error(error);
        return false;
    }

    return false;
}

// =====================================================
// MESSAGE DISPLAY
// =====================================================

function renderMessageText(content) {
    const value = String(content || "");

    if (window.marked && window.DOMPurify) {
        return DOMPurify.sanitize(marked.parse(value));
    }

    const element = document.createElement("div");
    element.textContent = value;

    return element.innerHTML.replace(/\n/g, "<br>");
}

function scrollToBottom() {
    const area = $("chatArea");

    if (area) {
        area.scrollTop = area.scrollHeight;
    }
}

function addMessage(role, content, imageUrl = null) {
    const message = document.createElement("div");

    message.className =
        "message " +
        (role === "user" ? "user-message" : "ai-message");

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

    if (imageUrl) {
        const image = document.createElement("img");

        image.src = imageUrl;
        image.alt = "Attached image";
        image.loading = "lazy";

        text.appendChild(image);
    }

    message.appendChild(avatar);
    message.appendChild(contentBox);

    messages.appendChild(message);

    if (welcome) welcome.style.display = "none";

    scrollToBottom();

    return message;
}

function showTyping() {
    removeTyping();

    const typing = document.createElement("div");

    typing.className = "message typing-message";
    typing.id = "typingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🤖";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = "Gidy AI";

    const text = document.createElement("div");
    text.className = "typing";
    text.textContent = "Thinking...";

    content.append(name, text);
    typing.append(avatar, content);

    messages.appendChild(typing);
    scrollToBottom();
}

function removeTyping() {
    $("typingIndicator")?.remove();
}

function showError(error) {
    addMessage(
        "assistant",
        "⚠️ **Sorry, something went wrong.**\n\n" +
        String(error.message || error) +
        "\n\nPlease try again."
    );
}

// =====================================================
// CONVERSATION HISTORY
// =====================================================

async function loadHistory() {
    try {
        const data = await apiRequest(
            "/history?conversationId=" +
            encodeURIComponent(conversationId)
        );

        messages.innerHTML = "";

        if (!data.success || !data.messages ||
            data.messages.length === 0) {
            if (welcome) welcome.style.display = "flex";
            return;
        }

        if (welcome) welcome.style.display = "none";

        data.messages.forEach(item => {
            addMessage(item.role, item.content);
        });

    } catch (error) {
        console.error("History loading failed:", error);
    }
}

// =====================================================
// NEW AND CLEAR CONVERSATION
// =====================================================

function startNewConversation() {
    conversationId = createId();

    localStorage.setItem(STORAGE_KEY, conversationId);

    messages.innerHTML = "";

    if (welcome) welcome.style.display = "flex";

    clearAttachments();

    if (userInput) userInput.value = "";

    window.speechSynthesis?.cancel();

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    scrollToBottom();
}

newChat?.addEventListener("click", startNewConversation);

clearChat?.addEventListener("click", async () => {
    if (!confirm("Delete this conversation and its saved history?")) {
        return;
    }

    try {
        await apiRequest(
            "/conversation?conversationId=" +
            encodeURIComponent(conversationId),
            { method: "DELETE" }
        );

        startNewConversation();

    } catch (error) {
        alert("Could not delete conversation: " + error.message);
    }
});

// =====================================================
// SIDEBAR
// =====================================================

menuBtn?.addEventListener("click", () => {
    sidebar?.classList.toggle("active");
});

// =====================================================
// SUBJECT SUGGESTIONS
// =====================================================

document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
        const prompt = button.dataset.prompt || "";

        userInput.value = prompt;
        userInput.focus();

        if (sidebar) sidebar.classList.remove("active");
    });
});

// =====================================================
// ATTACHMENT MENU
// =====================================================

function toggleAttachmentMenu() {
    if (!attachmentOptions) return;

    const open = attachmentOptions.hidden;

    attachmentOptions.hidden = !open;
    attachmentOptions.style.display = open ? "flex" : "none";
}

attachmentButton?.addEventListener("click", event => {
    event.preventDefault();
    toggleAttachmentMenu();
});

function openFilePicker(input) {
    if (!input) return;

    if (attachmentOptions) {
        attachmentOptions.hidden = true;
        attachmentOptions.style.display = "none";
    }

    input.click();
}

chooseImage?.addEventListener("click", () =>
    openFilePicker(imageInput)
);

choosePDF?.addEventListener("click", () =>
    openFilePicker(pdfInput)
);

chooseDocument?.addEventListener("click", () =>
    openFilePicker(documentInput)
);

chooseAudio?.addEventListener("click", () =>
    openFilePicker(audioInput)
);

chooseVideo?.addEventListener("click", () =>
    openFilePicker(videoInput)
);

// =====================================================
// FILE HELPERS
// =====================================================

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () =>
            resolve(String(reader.result || ""));

        reader.onerror = () =>
            reject(new Error("Could not read " + file.name));

        reader.readAsText(file);
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () =>
            reject(new Error("Could not read " + file.name));

        reader.readAsArrayBuffer(file);
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () =>
            reject(new Error("Could not read " + file.name));

        reader.readAsDataURL(file);
    });
}

// =====================================================
// ATTACHMENT MANAGEMENT
// =====================================================

function renderAttachmentPreview() {
    if (!attachmentPreview) return;

    attachmentPreview.innerHTML = "";

    attachments.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "attachment-preview-item";

        const icon = document.createElement("span");
        icon.className = "attachment-file-icon";
        icon.textContent = item.icon;

        const info = document.createElement("div");
        info.style.minWidth = "0";

        const name = document.createElement("div");
        name.className = "attachment-file-name";
        name.textContent = item.name;

        const size = document.createElement("small");
        size.textContent = formatBytes(item.size);

        info.append(name, size);

        card.append(icon, info);

        if (item.previewURL && item.type === "image") {
            const image = document.createElement("img");

            image.src = item.previewURL;
            image.alt = item.name;

            card.insertBefore(image, icon);
        }

        const remove = document.createElement("button");

        remove.type = "button";
        remove.className = "remove-attachment";
        remove.textContent = "×";

        remove.addEventListener("click", () => {
            removeAttachment(index);
        });

        card.appendChild(remove);
        attachmentPreview.appendChild(card);
    });
}

function removeAttachment(index) {
    const item = attachments[index];

    if (item?.previewURL) {
        URL.revokeObjectURL(item.previewURL);
    }

    attachments.splice(index, 1);
    renderAttachmentPreview();
}

function clearAttachments() {
    attachments.forEach(item => {
        if (item.previewURL) {
            URL.revokeObjectURL(item.previewURL);
        }
    });

    attachments = [];

    renderAttachmentPreview();

    [
        imageInput,
        pdfInput,
        documentInput,
        audioInput,
        videoInput
    ].forEach(input => {
        if (input) input.value = "";
    });
}

// =====================================================
// ADD FILES
// =====================================================

function addFiles(fileList, type) {
    for (const file of Array.from(fileList || [])) {
        if (file.size > MAX_FILE_SIZE) {
            alert(file.name + " exceeds the 20 MB limit.");
            continue;
        }

        const duplicate = attachments.some(item =>
            item.name === file.name &&
            item.size === file.size &&
            item.type === type
        );

        if (duplicate) continue;

        if (type === "image") {
            if (!file.type.startsWith("image/")) continue;

            if (attachments.filter(a =>
                a.type === "image"
            ).length >= MAX_IMAGES) {
                alert("Maximum 8 images allowed.");
                continue;
            }
        }

        if (type === "pdf" &&
            file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            continue;
        }

        const icons = {
            image: "🖼️",
            pdf: "📕",
            document: "📄",
            audio: "🎵",
            video: "🎬"
        };

        attachments.push({
            file,
            name: file.name,
            size: file.size,
            type,
            icon: icons[type],
            previewURL: (
                type === "image" ||
                type === "video" ||
                type === "audio"
            ) ? URL.createObjectURL(file) : null
        });
    }

    renderAttachmentPreview();
}

imageInput?.addEventListener("change", e => {
    addFiles(e.target.files, "image");
    e.target.value = "";
});

pdfInput?.addEventListener("change", e => {
    addFiles(e.target.files, "pdf");
    e.target.value = "";
});

documentInput?.addEventListener("change", e => {
    addFiles(e.target.files, "document");
    e.target.value = "";
});

audioInput?.addEventListener("change", e => {
    addFiles(e.target.files, "audio");
    e.target.value = "";
});

videoInput?.addEventListener("change", e => {
    addFiles(e.target.files, "video");
    e.target.value = "";
});

// =====================================================
// IMAGE PROCESSING
// =====================================================

async function loadImage(file) {
    const url = URL.createObjectURL(file);

    try {
        const image = new Image();

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = url;
        });

        return image;

    } finally {
        URL.revokeObjectURL(url);
    }
}

async function makeImageContactSheet(imageFiles, videoFrames = []) {
    const sources = [];

    for (const file of imageFiles) {
        sources.push({
            image: await loadImage(file),
            label: file.name
        });
    }

    videoFrames.forEach((frame, index) => {
        sources.push({
            image: frame,
            label: "Video frame " + (index + 1)
        });
    });

    if (!sources.length) return null;

    const columns = sources.length === 1 ? 1 : 2;
    const cellWidth = sources.length === 1 ? 1400 : 600;
    const cellHeight = sources.length === 1 ? 1000 : 430;
    const rows = Math.ceil(sources.length / columns);

    const canvas = document.createElement("canvas");

    canvas.width = columns * cellWidth;
    canvas.height = rows * cellHeight;

    const context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    sources.forEach((source, index) => {
        const x = (index % columns) * cellWidth;
        const y = Math.floor(index / columns) * cellHeight;

        const image = source.image;

        const scale = Math.min(
            (cellWidth - 20) / image.width,
            (cellHeight - 50) / image.height
        );

        const width = image.width * scale;
        const height = image.height * scale;

        context.drawImage(
            image,
            x + (cellWidth - width) / 2,
            y + 40,
            width,
            height
        );

        context.fillStyle = "#111111";
        context.font = "18px Arial";

        context.fillText(
            source.label.slice(0, 60),
            x + 10,
            y + 25
        );
    });

    return canvas.toDataURL("image/jpeg", 0.78);
}

// =====================================================
// PDF EXTRACTION
// =====================================================

async function extractPDF(file) {
    if (!window.pdfjsLib) {
        throw new Error("PDF.js is unavailable.");
    }

    const buffer = await readFileAsArrayBuffer(file);

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer)
    }).promise;

    let output = "";

    for (let page = 1; page <= pdf.numPages; page++) {
        const currentPage = await pdf.getPage(page);
        const content = await currentPage.getTextContent();

        output += "\n\n--- Page " + page + " ---\n";

        output += content.items
            .map(item => item.str)
            .join(" ");

        if (output.length >= MAX_DOCUMENT_TEXT) break;
    }

    if (!output.trim()) {
        throw new Error(
            "This PDF contains no selectable text. Scanned PDFs need OCR."
        );
    }

    return output.slice(0, MAX_DOCUMENT_TEXT);
}

// =====================================================
// WORD DOCUMENT EXTRACTION
// =====================================================

async function extractDOCX(file) {
    if (!await ensureLibrary("mammoth")) {
        throw new Error("Could not load the Word document reader.");
    }

    const buffer = await readFileAsArrayBuffer(file);

    const result = await mammoth.extractRawText({
        arrayBuffer: buffer
    });

    return result.value || "";
}

// =====================================================
// EXCEL EXTRACTION
// =====================================================

async function extractExcel(file) {
    if (!await ensureLibrary("xlsx")) {
        throw new Error("Could not load Excel reader.");
    }

    const buffer = await readFileAsArrayBuffer(file);

    const workbook = XLSX.read(buffer, {
        type: "array"
    });

    let output = "";

    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];

        output += "\n\n--- Sheet: " + name + " ---\n";

        output += XLSX.utils.sheet_to_csv(sheet);
    });

    return output.slice(0, MAX_DOCUMENT_TEXT);
}

// =====================================================// POWERPOINT EXTRACTION
// =====================================================

async function extractPPTX(file) {
    if (!await ensureLibrary("jszip")) {
        throw new Error("Could not load PowerPoint reader.");
    }

    const zip = await JSZip.loadAsync(
        await readFileAsArrayBuffer(file)
    );

    const slideFiles = Object.keys(zip.files)
        .filter(name =>
            /^ppt\/slides\/slide\d+\.xml$/.test(name)
        )
        .sort((a, b) => {
            const na = Number(a.match(/slide(\d+)/)[1]);
            const nb = Number(b.match(/slide(\d+)/)[1]);
            return na - nb;
        });

    let output = "";

    for (const name of slideFiles) {
        const xml = await zip.files[name].async("text");

        const document = new DOMParser().parseFromString(
            xml,
            "application/xml"
        );

        const texts = Array.from(
            document.getElementsByTagName("a:t")
        ).map(element => element.textContent);

        output += "\n\n--- " + name + " ---\n";
        output += texts.join(" ");
    }

    return output.slice(0, MAX_DOCUMENT_TEXT);
}

// =====================================================// VIDEO FRAME EXTRACTION
// =====================================================

async function extractVideoFrames(file) {
    const url = URL.createObjectURL(file);

    try {
        const video = document.createElement("video");

        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";

        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
        });

        const duration = video.duration;

        if (!Number.isFinite(duration) || duration <= 0) {
            throw new Error("Could not read video duration.");
        }

        const canvas = document.createElement("canvas");

        canvas.width = 640;
        canvas.height = 360;

        const context = canvas.getContext("2d");
        const frames = [];

        const count = Math.min(
            MAX_VIDEO_FRAMES,
            Math.max(1, Math.ceil(duration / 10))
        );

        for (let i = 0; i < count; i++) {
            const time = duration * (i + 1) / (count + 1);

            video.currentTime = time;

            await new Promise((resolve, reject) => {
                video.onseeked = resolve;
                video.onerror = reject;
            });

            context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const image = new Image();

            image.src = canvas.toDataURL("image/jpeg", 0.75);

            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            frames.push(image);
        }

        video.removeAttribute("src");
        video.load();

        return frames;

    } finally {
        URL.revokeObjectURL(url);
    }
}

// =====================================================// AUDIO TRANSCRIPTION
// =====================================================

async function transcribeAudio(file) {
    const formData = new FormData();

    formData.append("audio", file);

    const response = await apiRequest("/transcribe", {
        method: "POST",
        body: formData
    });

    if (!response.success) {
        throw new Error(response.error || "Transcription failed.");
    }

    return response.text || "";
}

// =====================================================
// PREPARE ATTACHMENTS FOR AI
// =====================================================

async function prepareAttachments() {
    let extraText = "";
    let imageFiles = [];
    let videoFrames = [];

    for (const item of attachments) {
        const file = item.file;

        if (item.type === "image") {
            imageFiles.push(file);
            continue;
        }

        if (item.type === "pdf") {
            extraText += "\n\n[PDF: " + item.name + "]\n";
            extraText += await extractPDF(file);
            continue;
        }

        if (item.type === "document") {
            const ext = item.name.split(".").pop().toLowerCase();

            extraText += "\n\n[Document: " + item.name + "]\n";

            if (["docx"].includes(ext)) {
                extraText += await extractDOCX(file);
            } else if (["xlsx", "xls"].includes(ext)) {
                extraText += await extractExcel(file);
            } else if (ext === "pptx") {
                extraText += await extractPPTX(file);
            } else if (["txt", "csv", "json", "md", "rtf"].includes(ext)) {
                extraText += await readFileAsText(file);
            } else {
                throw new Error(
                    "Unsupported document format: " + ext
                );
            }

            continue;
        }

        if (item.type === "audio") {
            extraText += "\n\n[Audio transcription: " +
                item.name + "]\n";

            extraText += await transcribeAudio(file);
            continue;
        }

        if (item.type === "video") {
            videoFrames.push(
                ...await extractVideoFrames(file)
            );
        }
    }

    const image = await makeImageContactSheet(
        imageFiles,
        videoFrames
    );

    return {
        extraText: extraText.slice(0, MAX_DOCUMENT_TEXT),
        image
    };
}

// =====================================================// SEND MESSAGE TO BACKEND
// =====================================================
event?.preventDefault();

// Require login before using Gidy AI
if (!currentUser) {
    showAuthMessage(
        "Please create an account or log in before using Gidy AI.",
        true
    );
    authEmail?.focus();
    return;
}

if (isSending) return;
    const message = userInput.value.trim();

    if (!message && attachments.length === 0) {
        return;
    }

    isSending = true;

    sendBtn.disabled = true;
    sendBtn.textContent = "…";

    let userImage = null;

    try {
        showTyping();

        const prepared = await prepareAttachments();

        userImage = prepared.image;

        const finalMessage =
            message +
            (prepared.extraText
                ? "\n\nAttached document content:\n" +
                  prepared.extraText
                : "");

        addMessage(
            "user",
            finalMessage || "Please analyze my uploaded image.",
            userImage
        );

        userInput.value = "";

        clearAttachments();

        const payload = {
            message: finalMessage,
            conversationId,
            image: userImage
        };

        const data = await apiRequest("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        removeTyping();

        if (!data.success) {
            throw new Error(data.error || "AI request failed.");
        }

        const answer = data.reply || data.response;

        if (!answer) {
            throw new Error("The AI returned an empty response.");
        }

        addMessage("assistant", answer);

        if (speakReplies?.checked) {
            speakText(answer).catch(console.error);
        }

    } catch (error) {
        removeTyping();

        console.error("Gidy AI send error:", error);

        showError(error);

    } finally {
        removeTyping();

        isSending = false;

        sendBtn.disabled = false;
        sendBtn.textContent = "➤";

        userInput.focus();
    }
}

// =====================================================// FORM SUBMISSION
// =====================================================

chatForm?.addEventListener("submit", sendMessage);

// ENTER TO SEND, SHIFT + ENTER FOR NEW LINE
userInput?.addEventListener("keydown", event => {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();

        if (!isSending) {
            chatForm.requestSubmit();
        }
    }
});

// =====================================================
// AI TEXT TO SPEECH
// =====================================================

async function speakText(text) {
    if (!text) return;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    const response = await apiRequest("/speak", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text: text.slice(0, 5000)
        })
    });

    const blob = await response.blob();

    if (!blob.size) {
        throw new Error("The voice service returned empty audio.");
    }

    const url = URL.createObjectURL(blob);

    currentAudio = new Audio(url);

    currentAudio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
    };

    await currentAudio.play();
}

// =====================================================// VOICE RECORDING
// =====================================================

async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia ||
        !window.MediaRecorder) {
        alert("Voice recording is not supported in this browser.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        recordedChunks = [];

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, {
                type: mediaRecorder.mimeType || "audio/webm"
            });

            stream.getTracks().forEach(track => track.stop());

            if (blob.size > MAX_FILE_SIZE) {
                alert("Recording exceeds 20 MB.");
                return;
            }

            try {
                const file = new File(
                    [blob],
                    "gidy-voice-recording.webm",
                    { type: blob.type }
                );

                const transcription = await transcribeAudio(file);

                if (transcription.trim()) {
                    userInput.value =
                        (userInput.value.trim() + " " +
                        transcription).trim();

                    userInput.focus();
                } else {
                    alert("No speech was detected.");
                }

            } catch (error) {
                alert("Transcription failed: " + error.message);
            }
        };

        mediaRecorder.start();

        isRecording = true;

        if (recordingStatus) recordingStatus.hidden = false;

        if (voiceButton) voiceButton.textContent = "⏹️";

    } catch (error) {
        alert("Microphone access failed: " + error.message);
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();

        isRecording = false;

        if (recordingStatus) recordingStatus.hidden = true;

        if (voiceButton) voiceButton.textContent = "🎤";
    }
}

voiceButton?.addEventListener("click", () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

stopRecordingButton?.addEventListener("click", stopRecording);

// =====================================================// START APPLICATION
// =====================================================

async function initializeGidyAI() {
    console.log("Gidy AI frontend V3.0 initialized.");

    await loadHistory();

    // Check backend health separately.
    try {
        const health = await apiRequest("/health");

        console.log("Gidy AI backend:", health);

    } catch (error) {
        console.error("Gidy AI backend health check failed:", error);
    }
}

initializeGidyAI();
// =====================================================
// START APPLICATION
// =====================================================

async function initializeGidyAI() {
    console.log("Gidy AI frontend V3.0 initialized.");

    await loadHistory();

    try {
        const health = await apiRequest("/health");
        console.log("Gidy AI backend:", health);
    } catch (error) {
        console.error("Gidy AI backend health check failed:", error);
    }
}

initializeGidyAI();
