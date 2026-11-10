
/* =====================================================
   GIDY AI - MULTIMODAL JAVASCRIPT
   Text + Images + PDF + Documents + Audio + Video
   Backend: Cloudflare Workers AI + D1
===================================================== */

const API_URL =
    "https://bold-smoke-695fgidy-ai-backend.gidynega.workers.dev";

const STORAGE_KEY = "gidy_ai_current_conversation";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_DOCUMENT_TEXT = 60000;
const MAX_IMAGES = 8;
const MAX_VIDEO_FRAMES = 4;

/* =====================================================
   HTML ELEMENTS
===================================================== */

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

const attachmentOptions =
    document.getElementById("attachmentOptions");

const attachmentPreview =
    document.getElementById("attachmentPreview");

const imageInput = document.getElementById("imageInput");
const pdfInput = document.getElementById("pdfInput");
const documentInput = document.getElementById("documentInput");
const audioInput = document.getElementById("audioInput");
const videoInput = document.getElementById("videoInput");

const chooseImage = document.getElementById("chooseImage");
const choosePDF = document.getElementById("choosePDF");
const chooseDocument = document.getElementById("chooseDocument");
const chooseAudio = document.getElementById("chooseAudio");
const chooseVideo = document.getElementById("chooseVideo");

const voiceButton = document.getElementById("voiceButton");
const recordingStatus = document.getElementById("recordingStatus");
const stopRecordingButton = document.getElementById("stopRecording");

const speakReplies = document.getElementById("speakReplies");

/* =====================================================
   APP STATE
===================================================== */

let conversationId =
    localStorage.getItem(STORAGE_KEY) || createId();

let attachments = [];
let isSending = false;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function createId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "gidy-" + Date.now() + "-" +
        Math.random().toString(36).slice(2);
}

localStorage.setItem(STORAGE_KEY, conversationId);

/* =====================================================
   CHECK REQUIRED ELEMENTS
===================================================== */

if (!chatForm || !userInput || !messages) {
    console.error(
        "Gidy AI: Required HTML elements are missing. Check index.html."
    );
}

/* =====================================================
   LOAD OPTIONAL LIBRARIES
===================================================== */

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const existing = [...document.scripts].find(
            script => script.src === url
        );

        if (existing) {
            if (existing.dataset.loaded === "true") {
                resolve();
                return;
            }

            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = url;
        script.async = true;

        script.onload = () => {
            script.dataset.loaded = "true";
            resolve();
        };

        script.onerror = reject;
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
        console.error("Library loading failed:", name, error);
        return false;
    }

    return false;
}

/* =====================================================
   MESSAGE DISPLAY
===================================================== */

function renderMessageText(content) {
    if (window.marked && window.DOMPurify) {
        const html = marked.parse(String(content || ""));
        return DOMPurify.sanitize(html);
    }

    const safe = document.createElement("div");
    safe.textContent = String(content || "");
    return safe.innerHTML.replace(/\n/g, "<br>");
}

function addMessage(role, content, imageUrl = null) {
    const message = document.createElement("div");

    message.className =
        "message " + (role === "user" ? "user-message" : "ai-message");

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

    if (welcome) {
        welcome.style.display = "none";
    }

    scrollToBottom();

    return message;
}

function scrollToBottom() {
    const chatArea = document.getElementById("chatArea");

    if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

function showTyping() {
    const typing = document.createElement("div");

    typing.className = "message typing-message";
    typing.id = "typingIndicator";

    typing.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <div class="message-name">Gidy AI</div>
            <div class="typing">Thinking...</div>
        </div>
    `;

    messages.appendChild(typing);
    scrollToBottom();
}

function removeTyping() {
    document.getElementById("typingIndicator")?.remove();
}

/* =====================================================
   ATTACHMENT MENU
===================================================== */

function toggleAttachmentMenu() {
    if (!attachmentOptions) return;

    const isHidden =
        attachmentOptions.hidden ||
        getComputedStyle(attachmentOptions).display === "none";

    attachmentOptions.hidden = !isHidden;
    attachmentOptions.style.display = isHidden ? "flex" : "none";
}

attachmentButton?.addEventListener("click", event => {
    event.preventDefault();
    toggleAttachmentMenu();
});

function openFilePicker(input) {
    if (!input) {
        alert("This attachment option is missing from index.html.");
        return;
    }

    if (attachmentOptions) {
        attachmentOptions.hidden = true;
        attachmentOptions.style.display = "none";
    }

    input.click();
}

chooseImage?.addEventListener("click", () => openFilePicker(imageInput));
choosePDF?.addEventListener("click", () => openFilePicker(pdfInput));
chooseDocument?.addEventListener("click", () => openFilePicker(documentInput));
chooseAudio?.addEventListener("click", () => openFilePicker(audioInput));
chooseVideo?.addEventListener("click", () => openFilePicker(videoInput));

/* =====================================================
   FILE HELPERS
===================================================== */

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

        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read file."));

        reader.readAsText(file);
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read file."));

        reader.readAsArrayBuffer(file);
    });
}

/* =====================================================
   ATTACHMENT PREVIEW
===================================================== */

function renderAttachmentPreview() {
    if (!attachmentPreview) return;

    attachmentPreview.innerHTML = "";

    attachments.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "attachment-preview-item";

        const icon = document.createElement("span");
        icon.className = "attachment-file-icon";
        icon.textContent = item.icon || "📎";

        const info = document.createElement("div");
        info.style.minWidth = "0";

        const fileName = document.createElement("div");
        fileName.className = "attachment-file-name";
        fileName.textContent = item.name;

        const fileSize = document.createElement("small");
        fileSize.textContent = item.size
            ? formatBytes(item.size)
            : "Ready";

        fileSize.style.color = "var(--muted)";

        info.appendChild(fileName);
        info.appendChild(fileSize);

        card.appendChild(icon);
        card.appendChild(info);

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
        remove.setAttribute("aria-label", "Remove " + item.name);

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

/* =====================================================
   FILE VALIDATION AND ADDING
===================================================== */

function addFiles(fileList, type) {
    const files = Array.from(fileList || []);

    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            alert(
                file.name + " is too large. Maximum file size is 20 MB."
            );
            continue;
        }

        const duplicate = attachments.some(
            item => item.name === file.name &&
                item.size === file.size &&
                item.type === type
        );

        if (duplicate) continue;

        if (type === "image") {
            const allowed = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif"
            ];

            if (!allowed.includes(file.type)) {
                alert("Unsupported image format: " + file.name);
                continue;
            }

            if (attachments.filter(a => a.type === "image").length >= MAX_IMAGES) {
                alert("You can attach up to 8 images.");
                continue;
            }
        }

        if (type === "pdf" && file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            continue;
        }

        if (type === "audio" &&
            !file.type.startsWith("audio/") &&
            !/\.(mp3|wav|m4a|ogg|webm|mp4|mpeg|mpga)$/i.test(file.name)) {
            alert("Please select a supported audio file.");
            continue;
        }

        if (type === "video" &&
            !file.type.startsWith("video/") &&
            !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
            alert("Please select a supported video file.");
            continue;
        }

        const item = {
            file,
            name: file.name,
            size: file.size,
            type,
            icon: {
                image: "🖼️",
                pdf: "📕",
                document: "📄",
                audio: "🎵",
                video: "🎬"
            }[type],
            previewURL: null
        };

        if (type === "image" || type === "video" || type === "audio") {
            item.previewURL = URL.createObjectURL(file);
        }

        attachments.push(item);
    }

    renderAttachmentPreview();
}

imageInput?.addEventListener("change", event => {
    addFiles(event.target.files, "image");
    event.target.value = "";
});

pdfInput?.addEventListener("change", event => {
    addFiles(event.target.files, "pdf");
    event.target.value = "";
});

documentInput?.addEventListener("change", event => {
    addFiles(event.target.files, "document");
    event.target.value = "";
});

audioInput?.addEventListener("change", event => {
    addFiles(event.target.files, "audio");
    event.target.value = "";
});

videoInput?.addEventListener("change", event => {
    addFiles(event.target.files, "video");
    event.target.value = "";
});

/* =====================================================
   IMAGE PROCESSING
===================================================== */

async function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not open image: " + file.name));
        };

        image.src = url;
    });
}

function drawScaledImage(context, image, x, y, width, height) {
    const ratio = Math.min(
        width / image.width,
        height / image.height
    );

    const w = image.width * ratio;
    const h = image.height * ratio;

    context.drawImage(
        image,
        x + (width - w) / 2,
        y + (height - h) / 2,
        w,
        h
    );
}

async function makeImageContactSheet(imageFiles, videoFrames = []) {
    const sources = [];

    for (const file of imageFiles) {
        const image = await loadImage(file);
        sources.push({
            image,
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

    if (sources.length === 1) {
        const canvas = document.createElement("canvas");
        const image = sources[0].image;

        const scale = Math.min(
            1,
            1600 / image.width,
            1600 / image.height
        );

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL("image/jpeg", 0.82);
    }

    const columns = 2;
    const cellWidth = 600;
    const cellHeight = 430;
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

        context.fillStyle = "#eeeeee";
        context.fillRect(x, y, cellWidth, cellHeight);

        drawScaledImage(
            context,
            source.image,
            x + 10,
            y + 35,
            cellWidth - 20,
            cellHeight - 45
        );

        context.fillStyle = "#111111";
        context.font = "18px Arial";
        context.fillText(
            source.label.slice(0, 55),
            x + 12,
            y + 25
        );
    });

    return canvas.toDataURL("image/jpeg", 0.82);
}

/* =====================================================
   PDF TEXT EXTRACTION
===================================================== */

async function extractPDF(file) {
    if (!window.pdfjsLib) {
        throw new Error(
            "PDF reader is not loaded. Check the PDF.js script in index.html."
        );
    }

    const buffer = await readFileAsArrayBuffer(file);

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer)
    }).promise;

    let output = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        const pageText = content.items
            .map(item => item.str)
            .join(" ");

        output += "\n\n--- Page " + pageNumber + " ---\n";
        output += pageText;

        if (output.length > MAX_TOTAL_DOCUMENT_TEXT) {
            output = output.slice(0, MAX_TOTAL_DOCUMENT_TEXT);
            output += "\n\n[Document text truncated due to length.]";
            break;
        }
    }

    if (!output.trim()) {
        throw new Error(
            "No selectable text found in this PDF. It may be a scanned document."
        );
    }

    return output;
}

/* =====================================================
   WORD DOCUMENT EXTRACTION
===================================================== */

async function extractDOCX(file) {
    const loaded = await ensureLibrary("mammoth");

    if (!loaded) {
        throw new Error("Could not load the DOCX document reader.");
    }

    const buffer = await readFileAsArrayBuffer(file);

    const result = await mammoth.extractRawText({
        arrayBuffer: buffer
    });

    return result.value || "";
}

/* =====================================================
   EXCEL EXTRACTION
===================================================== *