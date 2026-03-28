<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { nanoid } from 'nanoid'
import { formatDistanceToNow } from 'date-fns'
import { 
  Clipboard, 
  RefreshCw, 
  Mail, 
  Trash2, 
  ChevronRight, 
  Inbox, 
  X,
  ExternalLink,
  Zap,
  Check
} from 'lucide-vue-next'

// Configuration
const DOMAIN = 'firtaet.xyz'
const POLL_INTERVAL = 5000 // 5 seconds

// State
const currentAddress = ref('')
const emails = ref<any[]>([])
const selectedEmail = ref<any>(null)
const isLoading = ref(false)
const isCopying = ref(false)
const showDetail = ref(false)
const isCustomAddress = ref(false)
const customAddressInput = ref('')

// Initialize email
onMounted(() => {
  const saved = localStorage.getItem('temp_email_address')
  if (saved) {
    currentAddress.value = saved
  } else {
    generateRandomEmail()
  }
  
  fetchEmails()
  startPolling()
})

// Polling
let pollTimer: any = null
const startPolling = () => {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(fetchEmails, POLL_INTERVAL)
}

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// Methods
const generateRandomEmail = () => {
  const id = nanoid(8).toLowerCase()
  const addr = `${id}@${DOMAIN}`
  setAddress(addr)
}

const setAddress = (addr: string) => {
  currentAddress.value = addr
  localStorage.setItem('temp_email_address', addr)
  fetchEmails()
}

const toggleCustom = () => {
  isCustomAddress.value = !isCustomAddress.value
  if (isCustomAddress.value) {
    customAddressInput.value = currentAddress.value.split('@')[0]
  }
}

const applyCustomAddress = () => {
  if (customAddressInput.value) {
    const addr = `${customAddressInput.value.toLowerCase()}@${DOMAIN}`
    setAddress(addr)
    isCustomAddress.value = false
  }
}

const fetchEmails = async () => {
  if (!currentAddress.value) return
  
  try {
    const data = await $fetch(`/api/emails?address=${currentAddress.value}`)
    // If we have new emails, show a notification or just update
    emails.value = (data as any[]) || []
  } catch (err) {
    console.error('Failed to fetch emails', err)
  }
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(currentAddress.value)
  isCopying.value = true
  setTimeout(() => (isCopying.value = false), 2000)
}

const openEmail = (email: any) => {
  selectedEmail.value = email
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
}

const deleteEmail = async (id: number) => {
  // Not implemented in API yet, but could be
  emails.value = emails.value.filter(e => e.id !== id)
  if (selectedEmail.value?.id === id) closeDetail()
}

const clearEmails = async () => {
  if (!confirm('Are you sure you want to clear your inbox?')) return
  try {
    await $fetch(`/api/emails/clear`, {
      method: 'POST',
      body: { address: currentAddress.value }
    })
    emails.value = []
  } catch (err) {
    console.error('Failed to clear emails', err)
  }
}

const formatTime = (ts: number) => {
  return formatDistanceToNow(new Date(ts), { addSuffix: true })
}
</script>

<template>
  <div class="app-wrap">
    <div class="bg-gradient"></div>

    <div class="container">
      <!-- Header Section -->
      <header class="header animate-fade" style="animation-delay: 0.1s">
        <h1>TempMail <span class="accent">Premium</span></h1>
        <p>Private, instant, and secure temporary email for your needs.</p>
      </header>

      <!-- Main Controls -->
      <div class="card animate-fade" style="animation-delay: 0.2s; margin-bottom: 2rem; padding: 2rem;">
        <div class="address-section">
          <label style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.75rem; display: block; font-weight: 600;">YOUR TEMPORARY EMAIL ADDRESS</label>
          
          <div v-if="!isCustomAddress" class="email-box">
            <span class="email-address">{{ currentAddress }}</span>
            <div class="email-actions">
              <button @click="copyToClipboard" class="btn btn-ghost" title="Copy to clipboard">
                <Check v-if="isCopying" :size="18" style="color: #10b981" />
                <Clipboard v-else :size="18" />
                <span>{{ isCopying ? 'Copied' : 'Copy' }}</span>
              </button>
              <button @click="generateRandomEmail" class="btn btn-ghost" title="Refresh address">
                <RefreshCw :size="18" />
                <span>New</span>
              </button>
              <button @click="toggleCustom" class="btn btn-primary">
                <Zap :size="18" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          <div v-else class="email-box" style="padding: 0.5rem;">
             <div style="display: flex; flex: 1; align-items: center; padding-left: 1rem;">
               <input 
                 v-model="customAddressInput" 
                 type="text" 
                 class="custom-input" 
                 placeholder="your-name"
                 @keyup.enter="applyCustomAddress"
               />
               <span style="color: var(--text-muted); font-weight: 600; font-size: 1.2rem;">@{{ DOMAIN }}</span>
             </div>
             <div class="email-actions">
               <button @click="applyCustomAddress" class="btn btn-primary">
                 <Check :size="18" />
                 <span>Save</span>
               </button>
               <button @click="toggleCustom" class="btn btn-ghost">
                 <X :size="18" />
               </button>
             </div>
          </div>
        </div>
      </div>

      <!-- Inbox Section -->
      <div class="card animate-fade" style="animation-delay: 0.3s">
        <div class="inbox-header">
          <div class="inbox-title">
            <Inbox size="20" color="#6366f1" />
            <span>Messages Received</span>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button v-if="emails.length > 0" @click="clearEmails" class="btn btn-ghost" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
              <Trash2 size="14" />
              <span>Clear</span>
            </button>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
              <div class="pulse-icon"></div>
              Live
            </div>
          </div>
        </div>

        <div class="inbox">
          <div v-if="emails.length === 0" class="empty-state">
            <Mail class="empty-icon" />
            <p>Your inbox is empty</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Give someone your email and wait for it to appear here.</p>
          </div>

          <div 
            v-for="email in emails" 
            :key="email.id" 
            class="email-item"
            @click="openEmail(email)"
          >
            <div class="email-from">
              {{ email.from_address }}
            </div>
            <div class="email-subject">
              {{ email.subject }}
            </div>
            <div class="email-time">
              {{ formatTime(email.received_at) }}
            </div>
          </div>
        </div>
      </div>

      <footer style="margin-top: 3rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; padding-bottom: 2rem;">
        &copy; 2026 TempMail Premium. All rights reserved. Built with Nuxt 3 & Mailgun.
      </footer>
    </div>

    <!-- Email Detail Modal -->
    <Transition name="fade">
      <div v-if="showDetail && selectedEmail" class="overlay" @click.self="closeDetail">
        <div class="card detail-card">
          <div class="detail-header">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="detail-from-line">From: <strong>{{ selectedEmail.from_address }}</strong></div>
                <div class="detail-from-line">Sent: <strong>{{ new Date(selectedEmail.received_at).toLocaleString() }}</strong></div>
              </div>
              <button @click="closeDetail" class="btn btn-ghost" style="padding: 0.5rem;">
                <X size="24" />
              </button>
            </div>
            <h2 class="detail-subject">{{ selectedEmail.subject }}</h2>
          </div>
          
          <div class="detail-content">
            <div v-if="selectedEmail.body_html" v-html="selectedEmail.body_html"></div>
            <div v-else style="white-space: pre-wrap;">{{ selectedEmail.body_text }}</div>
          </div>

          <div class="detail-footer">
            <button @click="closeDetail" class="btn btn-primary">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
@import './app.css';

.accent {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.custom-input {
  background: transparent;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--accent);
  outline: none;
  width: 100%;
}

.spin {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pulse-icon {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* Vue Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.inbox-title span {
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.01em;
}
</style>
