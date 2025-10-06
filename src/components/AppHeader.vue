<template>
  <header class="app-header">
    <div class="header-content">
      <!-- Logo and brand -->
      <div class="brand">
        <div class="logo">
          <div class="logo-text">
            <span class="y2k">Y2K</span>
            <span class="fund">FUND</span>
          </div>
          <div class="logo-tagline">Investment Dashboard</div>
        </div>
      </div>
      
      <!-- Timeline Component -->
      <div class="timeline-wrapper">
        <AnalyzeTimeline 
          :config="timelineConfig"
          @event-selected="handleTimelineEventSelected"
          @navigate="handleTimelineNavigate"
        />
      </div>

      <!-- Custom Reports Dropdown -->
      <div class="custom-reports" ref="reportsDropdownRef">
        <button @click="toggleReports" class="reports-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          Custom Reports
        </button>

        <!-- Dropdown Menu -->
        <div v-if="showReports" class="reports-dropdown">
          <!-- Save Current URL Section -->
          <div class="save-section">
            <div class="save-form">
              <input 
                v-model="newReportName" 
                type="text" 
                placeholder="Report name..." 
                @keyup.enter="handleSaveReport"
                class="report-input"
              />
              <button @click="handleSaveReport" :disabled="!newReportName.trim()" class="save-btn">
                Save
              </button>
            </div>
            <div class="current-url">
              <small>Current: {{ currentUrlParams || 'No parameters' }}</small>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Saved Reports List -->
          <div class="reports-list">
            <div v-if="isLoading" class="loading">Loading...</div>
            
            <div v-else-if="reports.length === 0" class="empty">
              No saved reports
            </div>
            
            <div v-else>
              <div 
                v-for="report in reports" 
                :key="report.id" 
                class="report-item"
              >
                <div class="report-info">
                  <span class="report-name">{{ report.name }}</span>
                  <small class="report-date">{{ formatDate(report.created_at) }}</small>
                </div>
                <div class="report-actions">
                  <button @click="loadReport(report)" class="load-btn">Load</button>
                  <button @click="copyReportUrl(report)" class="copy-btn" title="Copy URL">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                  <button @click="deleteReport(report.id)" class="delete-btn">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Assistant Button -->
      <div class="ai-assistant">
        <button @click="openAIModal" class="ai-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span>Analyze</span>
        </button>
      </div>
      
      <!-- User menu -->
      <div class="user-menu">
        <div class="user-dropdown" ref="dropdownRef">
          <button 
            @click="toggleDropdown" 
            class="user-profile-btn"
            :class="{ 'active': isDropdownOpen }"
          >
            <img 
              :src="userAvatar" 
              :alt="user?.email || 'User'" 
              class="user-avatar"
            />
            <div class="user-info">
              <span class="user-name">{{ userName }}</span>
              <span class="user-email">{{ user?.email }}</span>
            </div>
            <svg 
              class="dropdown-icon" 
              :class="{ 'rotated': isDropdownOpen }"
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
          
          <!-- Dropdown menu -->
          <div v-if="isDropdownOpen" class="dropdown-menu">
            <div class="dropdown-header">
              <img 
                :src="userAvatar" 
                :alt="user?.email || 'User'" 
                class="dropdown-avatar"
              />
              <div class="dropdown-user-info">
                <div class="dropdown-user-name">{{ userName }}</div>
                <div class="dropdown-user-email">{{ user?.email }}</div>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <div class="dropdown-section">
              <span class="dropdown-section-title">Settings</span>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <div class="dropdown-section">
              <button @click="handleSignOut" class="dropdown-item sign-out-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Modal -->
    <AnalyzeChat 
      v-if="showAIModal" 
      :config="analyzeChatConfig"
      @close="closeAIModal"
      @conversation-added="handleConversationAdded"
      @error="handleAnalyzeChatError"
    />

    <!-- Conversation Modal -->
    <ConversationModal
      :is-open="showConversationModal"
      :conversations="selectedDateConversations"
      :date="selectedDate"
      :loading="isLoadingConversations"
      @close="closeConversationModal"
    />
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSupabase } from '@y2kfund/core'
import { AnalyzeChat } from '@y2kfund/analyze-chat'
import type { AnalyzeChatConfig, Conversation } from '@y2kfund/analyze-chat'
import '@y2kfund/analyze-chat/dist/style.css'
import { AnalyzeTimeline, ConversationModal } from '@y2kfund/analyze-timeline'
import type { TimelineEvent } from '@y2kfund/analyze-timeline'
import type { AnalyzeTimelineConfig } from '@y2kfund/analyze-timeline/dist/types'
import '@y2kfund/analyze-timeline/dist/style.css'
import { useCustomReports } from '../composables/useCustomReports'

const router = useRouter()
const route = useRoute()
const { user, signOut } = useAuth()
const supabase = useSupabase()
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement>()
const showAIModal = ref(false)

// Custom Reports
const showReports = ref(false)
const reportsDropdownRef = ref<HTMLElement>()
const newReportName = ref('')
const { reports, isLoading, loadReports, saveReport, deleteReport } = useCustomReports()

// Timeline and conversation modal state
const showConversationModal = ref(false)
const selectedDateConversations = ref<Conversation[]>([])
const selectedDate = ref('')
const isLoadingConversations = ref(false)

// AnalyzeChat configuration with database support
const analyzeChatConfig = computed<AnalyzeChatConfig>(() => ({
  supabaseClient: supabase,
  user: user.value,
  enableDatabase: true
}))

// AnalyzeTimeline configuration with database support
const timelineConfig = computed<AnalyzeTimelineConfig>(() => ({
  supabaseClient: supabase,
  userId: user.value?.id || '',
  enableDatabase: true
}))

// Computed properties for user display
const userName = computed(() => {
  if (user.value?.user_metadata?.full_name) {
    return user.value.user_metadata.full_name
  }
  if (user.value?.email) {
    return user.value.email.split('@')[0]
  }
  return 'User'
})

const userAvatar = computed(() => {
  // Use user's avatar if available, otherwise generate a placeholder
  if (user.value?.user_metadata?.avatar_url) {
    return user.value.user_metadata.avatar_url
  }
  // Generate a simple avatar based on user's initials
  const initials = userName.value.split(' ').map((n: string) => n[0]).join('').toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=fff&size=40`
})

const currentUrlParams = computed(() => {
  const searchParams = new URLSearchParams(window.location.search)
  return searchParams.toString()
})

// Custom Reports Functions
const toggleReports = () => {
  showReports.value = !showReports.value
  if (showReports.value) {
    loadReports()
  }
}

const handleSaveReport = async () => {
  if (!newReportName.value.trim()) return
  
  try {
    await saveReport(newReportName.value)
    newReportName.value = ''
    alert('Report saved successfully!')
  } catch (error) {
    alert('Failed to save report')
  }
}

const loadReport = (report: any) => {
  if (report.url_params) {
    // Build the new URL with saved parameters
    const searchParams = new URLSearchParams(report.url_params)
    const query: Record<string, string> = {}
    
    for (const [key, value] of searchParams.entries()) {
      query[key] = value
    }
    
    // Create the new URL
    const newUrl = router.resolve({ 
      path: route.path,
      query 
    }).href
    
    // Navigate to the new URL and reload the page
    window.location.href = newUrl
  } else {
    // If no parameters, just navigate to the clean path and reload
    window.location.href = route.path
  }
  
  showReports.value = false
}

const copyReportUrl = async (report: any) => {
  try {
    let url = window.location.origin + route.path
    
    if (report.url_params) {
      url += '?' + report.url_params
    }
    
    await navigator.clipboard.writeText(url)
    
    // Optional: Show a brief success indicator
    // You could add a toast notification here if you have one
    alert('URL copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy URL:', error)
    alert('Failed to copy URL')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Other existing functions...
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const handleSignOut = () => {
  closeDropdown()
  signOut()
}

const openAIModal = () => {
  showAIModal.value = true
}

const closeAIModal = () => {
  showAIModal.value = false
}

// Handle conversation added event from AnalyzeChat
const handleConversationAdded = (conversation: Conversation) => {
  console.log('[AppHeader] New conversation added:', conversation)
}

// Handle errors from AnalyzeChat
const handleAnalyzeChatError = (error: Error) => {
  console.error('[AppHeader] AnalyzeChat error:', error)
}

// Handle timeline event selection
const handleTimelineEventSelected = async (event: TimelineEvent) => {
  console.log('[AppHeader] Timeline event selected:', event)
  
  showConversationModal.value = true
  isLoadingConversations.value = true
  selectedDate.value = event.id
  selectedDateConversations.value = []

  try {
    const dateStr = event.id
    const startOfDay = `${dateStr}T00:00:00`
    const endOfDay = `${dateStr}T23:59:59`

    const { data, error } = await supabase
      .schema('hf')
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.value?.id)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: true })

    if (error) throw error
    selectedDateConversations.value = data || []
  } catch (error) {
    console.error('[AppHeader] Error fetching conversations:', error)
    selectedDateConversations.value = []
  } finally {
    isLoadingConversations.value = false
  }
}

const closeConversationModal = () => {
  showConversationModal.value = false
  selectedDateConversations.value = []
  selectedDate.value = ''
}

const handleTimelineNavigate = (direction: 'prev' | 'next') => {
  console.log('[AppHeader] Timeline navigate:', direction)
}

// Close dropdowns when clicking outside
const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
  if (reportsDropdownRef.value && !reportsDropdownRef.value.contains(event.target as Node)) {
    showReports.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 0.3rem 0;
  box-shadow: 
    0 1px 3px 0 rgba(0, 0, 0, 0.1), 
    0 1px 2px 0 rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

/* Brand section */
.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.brand .logo-text {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.025em;
}

.brand .y2k {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand .fund {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-left: 0.1em;
}

.brand .logo-tagline {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

/* Navigation menu */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.nav-link:hover {
  color: #1e293b;
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.nav-link:hover svg {
  color: #3b82f6;
}

.nav-link.active {
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 
    0 4px 14px rgba(59, 130, 246, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.nav-link.active::before {
  opacity: 1;
}

.nav-link.active svg {
  color: #ffffff;
}

.nav-link svg {
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.nav-link span {
  white-space: nowrap;
}

/* AI Assistant Button */
.ai-assistant {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ai-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.ai-button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.ai-button svg {
  flex-shrink: 0;
}

/* Timeline Wrapper */
.timeline-wrapper {
  flex: 1;
  max-width: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 1rem;
}

/* User menu dropdown */
.user-menu {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.user-dropdown {
  position: relative;
}

.user-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.user-profile-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-profile-btn.active {
  background: rgba(255, 255, 255, 1);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.dropdown-icon {
  color: #94a3b8;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
  color: #3b82f6;
}

/* Dropdown menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1), 
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
  z-index: 50;
  animation: dropdownSlide 0.2s ease-out;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.dropdown-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dropdown-user-info {
  flex: 1;
  min-width: 0;
}

.dropdown-user-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-user-email {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0.125rem;
}

.dropdown-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(226, 232, 240, 0.8) 50%, transparent 100%);
  margin: 0.5rem 0;
}

.dropdown-section {
  padding: 0.5rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  text-align: left;
  text-decoration: none;
}

.dropdown-item:hover {
  background: rgba(59, 130, 246, 0.08);
  color: #1e293b;
  transform: translateX(2px);
}

.dropdown-item svg {
  color: #94a3b8;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.dropdown-item:hover svg {
  color: #3b82f6;
}

.sign-out-item {
  color: #dc2626;
  margin-top: 0.25rem;
}

.sign-out-item:hover {
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
}

.sign-out-item svg {
  color: #f87171;
}

.sign-out-item:hover svg {
  color: #dc2626;
}

/* Custom Reports Dropdown */
.custom-reports {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.reports-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
}

.reports-button:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.reports-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 350px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 50;
  overflow: hidden;
}

.save-section {
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.save-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.report-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.report-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.save-btn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  width: auto;
}

.save-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.save-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.current-url {
  font-size: 0.75rem;
  color: #64748b;
}

.current-url small {
  word-break: break-all;
}

.divider {
  height: 1px;
  background: #e2e8f0;
}

.reports-list {
  padding: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.loading, .empty {
  padding: 2rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
}

.report-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.report-item:hover {
  background: #f1f5f9;
}

.report-info {
  flex: 1;
  min-width: 0;
}

.report-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-date {
  font-size: 0.75rem;
  color: #64748b;
}

.report-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.load-btn, .copy-btn, .delete-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.load-btn {
  background: #10b981;
  color: white;
}

.load-btn:hover {
  background: #059669;
}

.copy-btn {
  background: #6366f1;
  color: white;
  width: 28px;
  height: 24px;
}

.copy-btn:hover {
  background: #4f46e5;
}

.delete-btn {
  background: #ef4444;
  color: white;
  width: 24px;
  height: 24px;
}

.delete-btn:hover {
  background: #dc2626;
}

/* Responsive design */
@media (max-width: 1024px) {
  .header-content {
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
    gap: 1rem;
  }
  
  .brand .logo-text {
    font-size: 1.5rem;
  }
  
  .brand .logo-tagline {
    font-size: 0.65rem;
  }
  
  .user-info {
    display: none;
  }
  
  .dropdown-menu {
    width: 280px;
  }
}

@media (max-width: 640px) {
  .brand .logo-text {
    font-size: 1.25rem;
  }
  
  .brand .logo-tagline {
    display: none;
  }
  
  .dropdown-menu {
    width: 260px;
    right: -1rem;
  }
}
</style>