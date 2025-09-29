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
      <nav class="nav-menu">
        <router-link to="/" class="nav-link" exact-active-class="active">
          Home
        </router-link>
        <router-link to="/positions" class="nav-link" active-class="active">
          Positions
        </router-link>
        <router-link to="/margin" class="nav-link" active-class="active">
          Margin
        </router-link>
      </nav>
      
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
              <router-link 
                to="/" 
                class="dropdown-item nav-item" 
                @click="closeDropdown"
                exact-active-class="active"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                Home
              </router-link>
              
              <router-link 
                to="/positions" 
                class="dropdown-item nav-item" 
                @click="closeDropdown"
                active-class="active"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Positions
              </router-link>
              
              <router-link 
                to="/margin" 
                class="dropdown-item nav-item" 
                @click="closeDropdown"
                active-class="active"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Margin
              </router-link>
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
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../composables/useAuth'

const { user, signOut } = useAuth()
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

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
  const initials = userName.value.split(' ').map(n => n[0]).join('').toUpperCase()
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
/* Import the same logo styles */
@import '../assets/styles/logo.css';

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--surface-color, #ffffff);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  padding: 0.75rem 0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.04);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

/* Brand section - using same logo styles as login */
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.brand .logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
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
  margin-left: 0.15em;
}

.brand .logo-tagline {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 0.125rem;
}

/* Navigation menu */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--primary-color, #3b82f6);
  background: var(--primary-bg-hover, #eff6ff);
}

.nav-link.active {
  color: var(--primary-color, #3b82f6);
  background: var(--primary-bg, #dbeafe);
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
  padding: 0.5rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}

.user-profile-btn:hover {
  background: var(--gray-50, #f9fafb);
  border-color: var(--gray-200, #e5e7eb);
}

.user-profile-btn.active {
  background: var(--gray-50, #f9fafb);
  border-color: var(--gray-300, #d1d5db);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
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
  color: var(--gray-900, #111827);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.user-email {
  font-size: 0.75rem;
  color: var(--gray-500, #6b7280);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.dropdown-icon {
  color: var(--gray-400, #9ca3af);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

/* Dropdown menu */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 280px;
  background: white;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  z-index: 50;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--gray-50, #f9fafb);
}

.dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.dropdown-user-info {
  flex: 1;
  min-width: 0;
}

.dropdown-user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-900, #111827);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-user-email {
  font-size: 0.75rem;
  color: var(--gray-500, #6b7280);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background: var(--gray-200, #e5e7eb);
}

.dropdown-section {
  padding: 0.5rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.875rem;
  color: var(--gray-700, #374151);
  text-align: left;
  text-decoration: none;
}

.dropdown-item:hover {
  background: var(--gray-100, #f3f4f6);
}

.dropdown-item svg {
  color: var(--gray-400, #9ca3af);
  flex-shrink: 0;
}

/* Navigation item active states */
.nav-item.active {
  background: var(--primary-bg, #dbeafe);
  color: var(--primary-color, #3b82f6);
}

.nav-item.active svg {
  color: var(--primary-color, #3b82f6);
}

.sign-out-item {
  color: var(--red-600, #dc2626);
}

.sign-out-item:hover {
  background: var(--red-50, #fef2f2);
}

.sign-out-item svg {
  color: var(--red-500, #ef4444);
}

/* Responsive design */
@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
    gap: 1rem;
  }
  
  .brand .logo-text {
    font-size: 1.25rem;
  }
  
  .brand .logo-tagline {
    font-size: 0.625rem;
  }
  
  .nav-menu {
    gap: 0.25rem;
  }
  
  .nav-link {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .user-info {
    display: none;
  }
  
  .dropdown-menu {
    width: 260px;
  }
}

@media (max-width: 640px) {
  .nav-menu {
    order: 3;
    flex: none;
  }
  
  .user-menu {
    order: 2;
  }
  
  .brand .logo-text {
    font-size: 1rem;
  }
  
  .brand .logo-tagline {
    display: none;
  }
  
  .dropdown-menu {
    width: 240px;
    right: -1rem;
  }
}
</style>