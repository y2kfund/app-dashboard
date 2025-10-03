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
      
      <!-- Navigation menu -->
      <!--nav class="nav-menu">
        <router-link to="/" class="nav-link" exact-active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          <span>Home</span>
        </router-link>
        <router-link to="/positions" class="nav-link" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Positions</span>
        </router-link>
        <router-link to="/margin" class="nav-link" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Margin</span>
        </router-link>
      </nav-->

      <!-- Timeline Component -->
      <div class="timeline-wrapper">
        <AnalyzeTimeline 
          @event-selected="handleTimelineEventSelected"
          @navigate="handleTimelineNavigate"
        />
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
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useSupabase } from '@y2kfund/core'
import { AnalyzeChat } from '@y2kfund/analyze-chat'
import type { AnalyzeChatConfig, Conversation } from '@y2kfund/analyze-chat'
import '@y2kfund/analyze-chat/dist/style.css'
import { AnalyzeTimeline } from '@y2kfund/analyze-timeline'
import type { TimelineEvent } from '@y2kfund/analyze-timeline'
import '@y2kfund/analyze-timeline/dist/style.css'

const { user, signOut } = useAuth()
const supabase = useSupabase()
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement>()
const showAIModal = ref(false)

// AnalyzeChat configuration with database support
const analyzeChatConfig = computed<AnalyzeChatConfig>(() => ({
  supabaseClient: supabase,
  user: user.value,
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
  // You can add additional handling here if needed
  // e.g., show a success notification, update analytics, etc.
}

// Handle errors from AnalyzeChat
const handleAnalyzeChatError = (error: Error) => {
  console.error('[AppHeader] AnalyzeChat error:', error)
  // You can add additional error handling here if needed
  // e.g., show error notification, log to error tracking service, etc.
}

// Handle timeline event selection
const handleTimelineEventSelected = (event: TimelineEvent) => {
  console.log('[AppHeader] Timeline event selected:', event)
  // You can add additional handling here if needed
  // e.g., navigate to a detail view, show event info, etc.
}

// Handle timeline navigation
const handleTimelineNavigate = (direction: 'prev' | 'next') => {
  console.log('[AppHeader] Timeline navigate:', direction)
  // You can add additional handling here if needed
  // e.g., update analytics, preload data, etc.
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
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
  gap: 3rem;
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

/* Navigation item active states */
.nav-item.active {
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.nav-item.active svg {
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

/* Responsive design */
@media (max-width: 1024px) {
  .header-content {
    gap: 2rem;
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
  
  .nav-menu {
    gap: 0.25rem;
    padding: 0.375rem;
  }
  
  .nav-link {
    padding: 0.625rem 1rem;
    font-size: 0.8rem;
  }
  
  .nav-link span {
    display: none;
  }
  
  .user-info {
    display: none;
  }
  
  .dropdown-menu {
    width: 280px;
  }
}

@media (max-width: 640px) {
  .nav-menu {
    order: 3;
    flex: none;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }
  
  .nav-link {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 8px;
  }
  
  .user-menu {
    order: 2;
  }
  
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