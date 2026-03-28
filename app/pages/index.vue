<script setup lang="ts">
const DOMAIN = 'firtaet.xyz';
const currentEmail = ref('');
const inbox = ref<any[]>([]);
const modalVisible = ref(false);
const selectedEmail = ref<any>(null);
const toastMsg = ref('');
const showToast = ref(false);

// Methods
const generateRandomEmail = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < 8; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  currentEmail.value = `${res}@${DOMAIN}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem('last_temp_email', currentEmail.value);
  }
  inbox.value = [];
};

const handleNewEmail = () => {
  const custom = prompt('Enter custom name (leave empty for random):');
  if (custom === null) return;
  if (custom.trim() === '') {
    generateRandomEmail();
  } else {
    currentEmail.value = `${custom.trim().toLowerCase()}@${DOMAIN}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_temp_email', currentEmail.value);
    }
    inbox.value = [];
  }
};

const copyAddress = () => {
  if (typeof window !== 'undefined') {
    navigator.clipboard.writeText(currentEmail.value);
    triggerToast('Address copied to clipboard!');
  }
};

const triggerToast = (msg: string) => {
  toastMsg.value = msg;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 2000);
};

const fetchEmails = async () => {
  if (!currentEmail.value) return;
  try {
    const data = await $fetch<any[]>(`/api/emails/${currentEmail.value}`);
    if (JSON.stringify(data) !== JSON.stringify(inbox.value)) {
      inbox.value = data;
    }
  } catch (err) {
    console.error('Polling error:', err);
  }
};

const openEmail = (id: string) => {
  const msg = inbox.value.find((m) => m.id === id);
  if (!msg) return;
  selectedEmail.value = msg;
  modalVisible.value = true;
};

// Polling
let timer: any;
onMounted(() => {
  const saved = localStorage.getItem('last_temp_email');
  if (saved) {
    currentEmail.value = saved;
  } else {
    generateRandomEmail();
  }

  fetchEmails();
  timer = setInterval(fetchEmails, 5000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <div class="page-container">
    <header>
      <h1>TempMail</h1>
      <p>Your one-time anonymous email for social media and surveys.</p>
    </header>

    <div class="container">
      <div class="email-box">
        <div class="email-display">
          <span>{{ currentEmail || 'generating...' }}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </div>
        <div class="email-actions">
          <button @click="copyAddress" class="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy Address
          </button>
          <button @click="fetchEmails" class="btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Refresh Inbox
          </button>
          <button @click="handleNewEmail" class="btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            New Email
          </button>
        </div>
      </div>

      <div class="inbox">
        <div class="inbox-header">
          <h2>Inbox</h2>
          <div class="status">
            <div class="pulse"></div>
            Waiting for emails...
          </div>
        </div>
        <ul class="email-list">
          <template v-if="inbox.length > 0">
            <li v-for="msg in inbox" :key="msg.id" class="email-item" @click="openEmail(msg.id)">
              <div class="item-meta">
                <span class="from">{{ msg.from }}</span>
                <span class="time">{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
              </div>
              <div class="subject">{{ msg.subject }}</div>
              <div class="preview">{{ msg.bodyPlain }}</div>
            </li>
          </template>
          <div v-else class="empty-state">
            <h3>No emails yet</h3>
            <p>Emails will automatically appear here once sent to your address.</p>
          </div>
        </ul>
      </div>
    </div>

    <!-- Email Modal -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="modalVisible = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-header-info">
            <h2>{{ selectedEmail?.subject }}</h2>
            <div class="modal-sub">From: {{ selectedEmail?.from }}</div>
            <div class="modal-sub">Date: {{ new Date(selectedEmail?.timestamp).toLocaleString() }}</div>
          </div>
          <button class="close-btn" @click="modalVisible = false">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedEmail">
          <div v-if="selectedEmail.bodyHtml" v-html="selectedEmail.bodyHtml"></div>
          <pre v-else class="plain-body">{{ selectedEmail.bodyPlain }}</pre>
        </div>
      </div>
    </div>

    <div :class="['toast', { show: showToast }]">{{ toastMsg }}</div>
  </div>
</template>

<style>
:root {
  --bg: #0a0a0c;
  --surface: #141416;
  --surface-hover: #1c1c1f;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --secondary: #27272a;
  --text-main: #f4f4f5;
  --text-dim: #a1a1aa;
  --border: #27272a;
  --success: #10b981;
  --error: #ef4444;
  --radius-main: 12px;
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}

body {
  background-color: var(--bg);
  color: var(--text-main);
  margin: 0;
}

.page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  min-height: 100vh;
}

header {
  width: 100%;
  max-width: 800px;
  text-align: center;
  margin-bottom: 3rem;
}

header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

header p {
  color: var(--text-dim);
  font-size: 1.1rem;
}

.container {
  width: 100%;
  max-width: 800px;
}

.email-box {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-main);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.email-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(to right, var(--primary), #a855f7);
  opacity: 0.3;
}

.email-display {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius-main) - 4px);
  padding: 1rem 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
}

.email-display span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-actions {
  display: flex;
  gap: 1rem;
}

button {
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  flex: 2;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  background-color: var(--secondary);
  color: var(--text-main);
  flex: 1;
}

.btn-secondary:hover {
  background-color: var(--surface-hover);
  transform: translateY(-2px);
}

.inbox {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-main);
  overflow: hidden;
  width: 100%;
}

.inbox-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
}

.inbox-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.status {
  font-size: 0.875rem;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pulse {
  width: 8px;
  height: 8px;
  background-color: var(--success);
  border-radius: 50%;
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.email-list {
  list-style: none;
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-dim);
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: var(--text-main);
}

.email-item {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.email-item:hover {
  background-color: var(--surface-hover);
}

.item-meta {
  display: flex;
  justify-content: space-between;
}

.item-meta .from {
  color: var(--primary);
  font-weight: 600;
  font-size: 0.95rem;
}

.item-meta .time {
  color: var(--text-dim);
  font-size: 0.8rem;
}

.subject {
  font-weight: 500;
  font-size: 1rem;
}

.preview {
  color: var(--text-dim);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-header-info h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.modal-sub {
  color: var(--text-dim);
  font-size: 0.9rem;
}

.close-btn {
  background: none;
  color: var(--text-dim);
  font-size: 2rem;
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-body {
  padding: 1.5rem;
  background: #fff;
  color: #1a1a1a;
  overflow-y: auto;
  line-height: 1.6;
}

.plain-body {
  white-space: pre-wrap;
  font-family: inherit;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 1rem 2rem;
  border-radius: 8px;
  transform: translateY(200%);
  transition: transform 0.3s ease;
  z-index: 1000;
}

.toast.show {
  transform: translateY(0);
}
</style>
