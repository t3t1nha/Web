// DOM Elements
const btn = document.getElementById('sendBtn');
const input = document.getElementById('promptInput');
const messagesContainer = document.getElementById('messagesContainer');
const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');
const settingsBtn = document.getElementById('settingsBtn');
const helpBtn = document.getElementById('helpBtn');
const charCounter = document.getElementById('charCounter');
const chatSearchInput = document.getElementById('chatSearch');
const modalOverlay = document.getElementById('modalOverlay');
const exportBtn = document.getElementById('exportBtn');
const clearAllChatsBtn = document.getElementById('clearAllChats');

// State
let currentChatId = null;
let chats = {};
let firstMessage = true;
let currentTheme = localStorage.getItem('theme') || 'dark';
let searchQuery = '';
let currentUser = localStorage.getItem('currentUser') || null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser) {
        showLoginScreen();
    } else {
        showChatApp();
        loadChatsFromStorage();
        loadSettings();
        setupEventListeners();
        applyTheme(currentTheme);
    }
});

function setupEventListeners() {
    newChatBtn.addEventListener('click', createNewChat);
    btn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    input.addEventListener('input', updateCharCounter);
    
    // Settings and Help buttons
    settingsBtn.addEventListener('click', () => openModal('settingsModal'));
    helpBtn.addEventListener('click', () => openModal('helpModal'));
    exportBtn.addEventListener('click', exportChat);
    clearAllChatsBtn.addEventListener('click', clearAllChatsWithConfirmation);
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Chat search
    chatSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderChatList();
    });
    
    // Theme buttons
    document.getElementById('darkThemeBtn')?.addEventListener('click', () => setTheme('dark'));
    document.getElementById('lightThemeBtn')?.addEventListener('click', () => setTheme('light'));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function updateCharCounter() {
    const length = input.value.length;
    const maxLength = 2000;
    charCounter.textContent = `${length}/${maxLength}`;
    
    if (length > maxLength) {
        input.value = input.value.substring(0, maxLength);
        charCounter.textContent = `${maxLength}/${maxLength}`;
    }
    
    if (length > maxLength * 0.9) {
        charCounter.style.color = '#ff6b6b';
    } else {
        charCounter.style.color = '#666';
    }
}

// ====== Modal Functions ======
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modalOverlay.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Check if any modals are still open
    const anyOpen = document.querySelector('.modal.active');
    if (!anyOpen) {
        modalOverlay.classList.remove('active');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    modalOverlay.classList.remove('active');
}

// ====== Theme Management ======
function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    
    // Update active button
    document.getElementById('darkThemeBtn')?.classList.toggle('active', theme === 'dark');
    document.getElementById('lightThemeBtn')?.classList.toggle('active', theme === 'light');
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        root.style.setProperty('--primary', '#3b82f6');
        root.style.setProperty('--primary-dark', '#2563eb');
        root.style.setProperty('--bg', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f5f5f5');
        root.style.setProperty('--text', '#000000');
        root.style.setProperty('--text-secondary', '#666666');
        root.style.setProperty('--border', '#e0e0e0');
        root.style.setProperty('--msg-user-bg', '#2563eb');
        root.style.setProperty('--msg-user-hover', '#1d4ed8');
        root.style.setProperty('--msg-ai-bg', '#f5f5f5');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#000000';
    } else {
        root.style.setProperty('--primary', '#3b82f6');
        root.style.setProperty('--primary-dark', '#2563eb');
        root.style.setProperty('--bg', '#000000');
        root.style.setProperty('--bg-secondary', '#0a0a0a');
        root.style.setProperty('--text', '#e8e8e8');
        root.style.setProperty('--text-secondary', '#888888');
        root.style.setProperty('--border', '#1a1a1a');
        root.style.setProperty('--msg-user-bg', '#2563eb');
        root.style.setProperty('--msg-user-hover', '#1d4ed8');
        root.style.setProperty('--msg-ai-bg', '#0a0a0a');
        document.body.style.backgroundColor = '#000000';
        document.body.style.color = '#e8e8e8';
    }
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
}

// ====== Settings Management ======
function loadSettings() {
    const autoSave = localStorage.getItem('autoSave') !== 'false';
    const showTimestamps = localStorage.getItem('showTimestamps') === 'true';
    const autoScroll = localStorage.getItem('autoScroll') !== 'false';
    
    const autoSaveToggle = document.getElementById('autoSaveToggle');
    const timestampToggle = document.getElementById('timestampToggle');
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    
    if (autoSaveToggle) autoSaveToggle.checked = autoSave;
    if (timestampToggle) timestampToggle.checked = showTimestamps;
    if (autoScrollToggle) autoScrollToggle.checked = autoScroll;
    
    // Set theme button active state
    document.getElementById('darkThemeBtn')?.classList.toggle('active', currentTheme === 'dark');
    document.getElementById('lightThemeBtn')?.classList.toggle('active', currentTheme === 'light');
    
    // Add listeners
    autoSaveToggle?.addEventListener('change', (e) => {
        localStorage.setItem('autoSave', e.target.checked);
    });
    timestampToggle?.addEventListener('change', (e) => {
        localStorage.setItem('showTimestamps', e.target.checked);
        renderChatMessages();
    });
    autoScrollToggle?.addEventListener('change', (e) => {
        localStorage.setItem('autoScroll', e.target.checked);
    });
}

// ====== Keyboard Shortcuts ======
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'k':
                e.preventDefault();
                createNewChat();
                break;
            case 'l':
                e.preventDefault();
                input.focus();
                break;
            case 's':
                e.preventDefault();
                chatSearchInput.focus();
                break;
        }
    }
    
    if (e.key === '?') {
        e.preventDefault();
        const helpModal = document.getElementById('helpModal');
        if (helpModal.classList.contains('active')) {
            closeModal('helpModal');
        } else {
            openModal('helpModal');
        }
    }
}

// ====== Chat Management ======
function loadChatsFromStorage() {
    const stored = localStorage.getItem('chats');
    chats = stored ? JSON.parse(stored) : {};
    renderChatList();
    
    // Load last chat or create new one
    if (Object.keys(chats).length > 0) {
        const lastChatId = Object.keys(chats)[0];
        loadChat(lastChatId);
    } else {
        createNewChat();
    }
}

function saveChatsToStorage() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

function createNewChat() {
    const chatId = Date.now().toString();
    const chatTitle = `Chat ${new Date().toLocaleDateString()}`;
    
    chats[chatId] = {
        id: chatId,
        title: chatTitle,
        createdAt: Date.now(),
        messages: []
    };
    
    saveChatsToStorage();
    renderChatList();
    loadChat(chatId);
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats[chatId];
    
    if (!chat) return;
    
    // Update active state
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');
    
    // Load messages
    renderChatMessages();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderChatMessages() {
    const chat = chats[currentChatId];
    if (!chat) return;
    
    messagesContainer.innerHTML = '';
    firstMessage = true;
    
    if (chat.messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <p>👋 Hello! I'm your AI Assistant. Ask me anything!</p>
            </div>
        `;
    } else {
        chat.messages.forEach(msg => {
            if (msg.type === 'user') {
                addMessageToUI(msg.text, 'user', false);
            } else if (msg.type === 'text') {
                addMessageToUI(msg.text, 'ai', false);
            }
        });
        firstMessage = false;
    }
}

function renderChatList() {
    let sortedChats = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt);
    
    // Filter by search query
    if (searchQuery) {
        sortedChats = sortedChats.filter(chat => 
            chat.title.toLowerCase().includes(searchQuery)
        );
    }
    
    if (sortedChats.length === 0) {
        chatList.innerHTML = '<p class="no-chats">' + (searchQuery ? 'No matching chats' : 'No chats yet') + '</p>';
        return;
    }
    
    chatList.innerHTML = sortedChats.map(chat => `
        <div class="chat-item ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
            <span class="chat-item-text" ondblclick="startEditChat('${chat.id}')">${escapeHtml(chat.title)}</span>
            <button class="chat-item-rename" onclick="startEditChat('${chat.id}')">✎</button>
            <button class="chat-item-delete" onclick="deleteChat('${chat.id}')">✕</button>
        </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('chat-item-delete') && 
                !e.target.classList.contains('chat-item-rename') &&
                !e.target.classList.contains('chat-edit-input')) {
                loadChat(item.dataset.chatId);
            }
        });
    });
}

function startEditChat(chatId) {
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (!chatItem) return;
    
    const textSpan = chatItem.querySelector('.chat-item-text');
    const currentTitle = chats[chatId].title;
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chat-edit-input';
    input.value = currentTitle;
    
    // Replace text with input
    textSpan.replaceWith(input);
    input.focus();
    input.select();
    
    // Save on blur
    const saveEdit = () => {
        const newTitle = input.value.trim() || currentTitle;
        updateChatTitle(chatId, newTitle);
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
}

function deleteChat(chatId) {
    delete chats[chatId];
    saveChatsToStorage();
    renderChatList();
    
    if (currentChatId === chatId) {
        const remaining = Object.keys(chats);
        if (remaining.length > 0) {
            loadChat(remaining[0]);
        } else {
            createNewChat();
        }
    }
}

function updateChatTitle(chatId, newTitle) {
    if (chats[chatId]) {
        chats[chatId].title = newTitle;
        saveChatsToStorage();
        renderChatList();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====== Messaging ======
async function sendMessage() {
    const prompt = input.value.trim();
    if (!prompt) return;
    
    if (firstMessage) {
        messagesContainer.innerHTML = '';
        firstMessage = false;
        
        // Generate smart title from first prompt using AI
        generateSmartTitleFromAI(currentChatId, prompt);
    }
    
    // Add user message to UI and storage
    addMessageToUI(prompt, 'user');
    addMessageToStorage('user', prompt);
    
    input.value = '';
    updateCharCounter();
    input.focus();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    btn.disabled = true;
    
    // Typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        const response = await fetch('http://localhost:3000/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: prompt,
                model: 'gemini-2.5-flash'
            })
        });
        
        const data = await response.json();
        typingDiv.remove();
        
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message ai';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        aiMessageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(aiMessageDiv);
        
        await streamText(data.text, contentDiv);
        addMessageToStorage('text', data.text);
    } catch (error) {
        typingDiv.remove();
        const errorMsg = `Error: Make sure server.js is running!\n\n${error.message}`;
        addMessageToUI(errorMsg, 'ai');
        addMessageToStorage('text', errorMsg);
    } finally {
        btn.disabled = false;
        const autoScroll = localStorage.getItem('autoScroll') !== 'false';
        if (autoScroll) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
}

async function generateSmartTitleFromAI(chatId, prompt) {
    try {
        const modelToUse = 'gemini-2.5-flash';
        const response = await fetch('http://localhost:3000/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: `Generate a very short title (3-6 words maximum) that describes what the user is asking. The title should be a simple, clear description. Do NOT use quotes. Just respond with the title only.\n\nUser's request: "${prompt}"`,
                model: modelToUse
            })
        });
        
        const data = await response.json();
        let title = data.text || 'New Chat';
        
        // Clean up the title (remove quotes, trim, limit length)
        title = title.replace(/^["']|["']$/g, '').trim();
        if (title.length > 50) {
            title = title.substring(0, 50) + '...';
        }
        
        updateChatTitle(chatId, title);
    } catch (error) {
        console.error('Error generating title:', error);
        // Fallback to simple extraction
        const fallbackTitle = extractSimpleTitle(prompt);
        updateChatTitle(chatId, fallbackTitle);
    }
}

function extractSimpleTitle(prompt) {
    // Extract first 30-40 chars or first sentence
    let title = prompt;
    
    // Try to find first sentence
    const sentenceMatch = prompt.match(/^[^.!?]*[.!?]/);
    if (sentenceMatch) {
        title = sentenceMatch[0].trim();
    }
    
    // Limit to ~6 words or 40 characters
    const words = title.split(/\s+/);
    if (words.length > 6) {
        title = words.slice(0, 6).join(' ') + '...';
    } else if (title.length > 40) {
        title = title.substring(0, 40).trim() + '...';
    }
    
    return title;
}

function addMessageToUI(text, type, scroll = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Create wrapper for content
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    // Add timestamp if enabled
    const showTimestamps = localStorage.getItem('showTimestamps') === 'true';
    if (showTimestamps) {
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        wrapper.appendChild(timestamp);
    }
    
    wrapper.appendChild(contentDiv);
    messageDiv.appendChild(wrapper);
    
    // Add copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.title = 'Copy message';
    copyBtn.innerHTML = '📋';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text);
        copyBtn.textContent = '✓';
        setTimeout(() => {
            copyBtn.innerHTML = '📋';
        }, 1500);
    });
    
    messageDiv.appendChild(copyBtn);
    messagesContainer.appendChild(messageDiv);
    
    if (scroll) messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function addMessageToStorage(type, text) {
    if (!chats[currentChatId]) return;
    
    const message = { type, text, timestamp: Date.now() };
    chats[currentChatId].messages.push(message);
    saveChatsToStorage();
    
    // Auto-save draft
    saveDraft(currentChatId, text);
}

function saveDraft(chatId, text) {
    const autoSave = localStorage.getItem('autoSave') !== 'false';
    if (autoSave) {
        localStorage.setItem(`draft_${chatId}`, text);
    }
}

async function streamText(text, contentDiv) {
    let displayedText = '';
    
    for (let i = 0; i < text.length; i++) {
        displayedText += text[i];
        
        // Parse markdown and update HTML in real-time
        contentDiv.innerHTML = marked.parse(displayedText);
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, 15));
    }
}

// ====== Authentication ======
function showLoginScreen() {
    const app = document.querySelector('.main-container');
    if (app) app.style.display = 'none';
    
    let loginContainer = document.getElementById('loginContainer');
    if (!loginContainer) {
        loginContainer = document.createElement('div');
        loginContainer.id = 'loginContainer';
        loginContainer.className = 'login-container';
        loginContainer.innerHTML = `
            <div class="login-box">
                <h1>🤖 AI Chat Login</h1>
                <form id="loginForm">
                    <input type="text" id="usernameInput" placeholder="Username" required>
                    <input type="password" id="passwordInput" placeholder="Password" required>
                    <button type="submit">Login</button>
                    <p>Demo: user / pass</p>
                </form>
            </div>
        `;
        document.body.appendChild(loginContainer);
        
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    
    // Simple validation (username: user, password: pass)
    // In production, send this to backend for secure authentication
    if (username && password) {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        localStorage.setItem('loginTime', Date.now());
        
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) loginContainer.style.display = 'none';
        
        showChatApp();
        loadModels();
        loadChatsFromStorage();
        loadSettings();
        setupEventListeners();
        applyTheme(currentTheme);
    } else {
        alert('Invalid credentials');
    }
}

function showChatApp() {
    const app = document.querySelector('.main-container');
    if (app) app.style.display = 'flex';
    
    // Display username
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = `👤 ${currentUser}`;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    currentUser = null;
    location.reload();
}

// ====== Models ======


// ====== Export & Clear Functions ======
function exportChat() {
    if (!currentChatId || !chats[currentChatId]) {
        alert('No chat to export');
        return;
    }
    
    const chat = chats[currentChatId];
    const chatData = {
        title: chat.title,
        createdAt: new Date(chat.createdAt).toISOString(),
        messages: chat.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp).toISOString()
        }))
    };
    
    const jsonString = JSON.stringify(chatData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function clearAllChatsWithConfirmation() {
    if (Object.keys(chats).length === 0) {
        alert('No chats to clear');
        return;
    }
    
    if (confirm('Are you sure you want to delete ALL chats? This cannot be undone.')) {
        chats = {};
        saveChatsToStorage();
        chatSearchInput.value = '';
        searchQuery = '';
        renderChatList();
        createNewChat();
    }
}


