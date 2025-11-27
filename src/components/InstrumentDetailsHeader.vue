<template>
  <header class="app-header instrument-details-header">
    <div class="header-content">
      <!-- Logo and brand - LEFT SIDE -->
      <div class="brand">
        <a href="/" class="logo-link" @click.prevent="handleLogoClick">
          <div class="logo">
            <div class="logo-text">
              <span class="y2k">Y2K</span>
              <span class="fund">FUND</span>
            </div>
          </div>
        </a>
      </div>
      
      <!-- CENTER: Current Symbol Display -->
      <div class="current-symbol" v-if="currentSymbol">
        <span class="symbol-text">
          <span class="fund">{{ currentSymbol }}&nbsp;</span> 
          <span class="y2k">Across all accounts</span>
        </span>
      </div>
      
      <!-- RIGHT SIDE CONTAINER -->
      <div class="header-right">
        <!-- Data Refresh Dropdown -->
        <div class="data-refresh" ref="refreshDropdownRef">
          <button @click="toggleRefresh" class="refresh-button" :disabled="isRefreshing">
            <svg v-if="!isRefreshing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            <svg v-else class="spinning" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            {{ isRefreshing ? 'Refreshing...' : 'Refresh Data' }}
          </button>

          <!-- Dropdown Menu -->
          <div v-if="showRefresh" class="refresh-dropdown">
            <div class="refresh-header">
              <h4>Manual Data Refresh</h4>
              <p>Update database tables with latest IBKR data</p>
            </div>

            <div class="refresh-options">
              <button 
                @click="refreshSelectedData" 
                :disabled="isRefreshing || selectedEndpoints.size === 0"
                class="refresh-option refresh-selected"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Refresh Selected ({{ selectedEndpoints.size }})
              </button>

              <div class="divider"></div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('nlv')"
                  @change="toggleEndpointSelection('nlv')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('nlv')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Net Liquidation Value
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('maintenance-margin')"
                  @change="toggleEndpointSelection('maintenance-margin')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('maintenance-margin')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Maintenance Margin
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('positions')"
                  @change="toggleEndpointSelection('positions')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('positions')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <path d="M9 9h6v6H9z"/>
                  </svg>
                  Positions
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('current-market-price')"
                  @change="toggleEndpointSelection('current-market-price')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('current-market-price')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Current Market Prices
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('current-margin-impact')"
                  @change="toggleEndpointSelection('current-margin-impact')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('current-margin-impact')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Current Margin Impact
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('trades')"
                  @change="toggleEndpointSelection('trades')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('trades')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3.043V11m0 22v6m17 .043v6m0-30V23M3.077 15.38c.062-2.351 1.627-4.29 3.978-4.365a30 30 0 0 1 1.89 0c2.351.075 3.916 2.014 3.978 4.365c.042 1.636.077 3.823.077 6.62s-.035 4.984-.077 6.62c-.062 2.351-1.627 4.29-3.978 4.365a30 30 0 0 1-1.89 0c-2.351-.075-3.916-2.014-3.978-4.365C3.035 26.984 3 24.797 3 22s.035-4.984.077-6.62m16.961 12.128c.06-2.489 1.82-4.464 4.309-4.503a43 43 0 0 1 1.306 0c2.489.04 4.25 2.014 4.309 4.503c.023.975.038 2.135.038 3.492s-.015 2.517-.038 3.493c-.06 2.488-1.82 4.463-4.309 4.502a43 43 0 0 1-1.306 0c-2.489-.04-4.25-2.014-4.309-4.502C20.015 33.517 20 32.356 20 31s.015-2.517.038-3.492M45 7.607S43 6 40 6c-2.5 0-5 1.607-5 3.75c0 5.357 10 2.143 10 7.5c0 2.143-2.5 3.75-5 3.75c-3 0-5-1.607-5-1.607M40 6V3m0 21v-3"/></svg>
                  Trades
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('cash-transactions')"
                  @change="toggleEndpointSelection('cash-transactions')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('cash-transactions')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Cash Transactions
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('transfers')"
                  @change="toggleEndpointSelection('transfers')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('transfers')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Transfers
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('current-delta')"
                  @change="toggleEndpointSelection('current-delta')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('current-delta')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Current Delta
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('financial-data')"
                  @change="toggleEndpointSelection('financial-data')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('financial-data')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Financial Data
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('orders')"
                  @change="toggleEndpointSelection('orders')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('orders')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Orders
                </button>
              </div>

              <div class="divider"></div>

              <button 
                @click="refreshAllData" 
                :disabled="isRefreshing"
                class="refresh-option refresh-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Refresh All
              </button>
            </div>

            <!-- Status Display -->
            <div v-if="refreshStatus.length > 0" class="refresh-status">
              <div class="status-header">Status:</div>
              <div 
                v-for="status in refreshStatus" 
                :key="status.id"
                class="status-item"
                :class="status.status"
              >
                <span class="status-label">{{ status.label }}:</span>
                <span class="status-message">{{ status.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Reports Dropdown -->
        <div class="custom-reports" ref="reportsDropdownRef">
          <div class="reports-container">
            <button @click="toggleReports" class="reports-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              Custom Reports
            </button>
            
            <!-- Active Report Name Display -->
            <div v-if="activeReportName && activeReportUrl" class="active-report-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <a :href="activeReportUrl" class="active-report-link">{{ activeReportName }}</a>
              <!--a @click="clearActiveReport" class="clear-report-btn" title="Clear report">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </a-->
            </div>
          </div>

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
              <!--div class="current-url">
                <small>Current: {{ currentUrlParams || 'No parameters' }}</small>
              </div-->
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
                    <!-- Editable report name -->
                    <div v-if="editingReportId === report.id" class="edit-name-form">
                      <input
                        v-model="editingReportName"
                        @keyup.enter="saveReportName(report.id)"
                        @keyup.esc="cancelEditReportName"
                        @blur="saveReportName(report.id)"
                        class="edit-name-input"
                        type="text"
                        autofocus
                      />
                    </div>
                    <span 
                      v-else 
                      class="report-name" 
                      @click="loadReport(report)"
                      title="Click to load report"
                    >
                      {{ report.name }}
                    </span>
                    <small class="report-date">{{ formatDate(report.created_at) }}</small>
                  </div>
                  <div class="report-actions">
                    <button @click="startEditReportName(report)" class="rename-btn" title="Rename report">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button @click="handleUpdateReport(report.id)" class="update-btn" title="Update with current URL">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6"/>
                        <path d="M1 20v-6h6"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                      </svg>
                    </button>
                    <button @click="copyReportUrl(report)" class="copy-btn" title="Copy URL">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                    <button @click="archiveReport(report.id)" class="delete-btn" title="Archive Report">×</button>
                    <button 
                      @click="setDefaultReportHandler(report.id)" 
                      class="default-btn" 
                      :title="report.is_default ? 'Default report' : 'Set as default'"
                      :disabled="report.is_default"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3 7h7l-5.5 4.5L17 21l-5-3.5L7 21l1.5-7.5L3 9h7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                <button @click="openActivityLog" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Activity Log
                </button>
              </div>

              <div class="dropdown-section">
                <button @click="openRiskManagement" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/>
                  </svg>
                  Risk Management
                </button>
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
    </div>

    <!-- Activity Log Drawer -->
    <Transition name="drawer-backdrop">
      <div v-if="showActivityLog" class="drawer-backdrop" @click="closeActivityLog"></div>
    </Transition>

    <Transition name="drawer">
      <div v-if="showActivityLog" class="activity-drawer">
        <div class="drawer-header">
          <div class="drawer-title-section">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3>Activity Log</h3>
          </div>
          <button @click="closeActivityLog" class="close-drawer-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="drawer-content">
          <ActivityLog :user-id="user?.id" />
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSupabase } from '@y2kfund/core'
import { useCustomReports } from '../composables/useCustomReports'
import { eventBus } from '../utils/eventBus'
import { ActivityLog } from '@y2kfund/activity-log'
import '@y2kfund/activity-log/dist/style.css'

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
const editingReportId = ref<string | null>(null)
const editingReportName = ref('')
const { reports, isLoading, loadReports, saveReport, updateReport, archiveReport, setDefaultReport, getDefaultReport } = useCustomReports()

const showActivityLog = ref(false)

// Activity Log functions
const openActivityLog = () => {
  showActivityLog.value = true
  closeDropdown()
}

const closeActivityLog = () => {
  showActivityLog.value = false
}

const openRiskManagement = () => {
  router.push({ name: 'risk-management' })
  closeDropdown()
}

const setDefaultReportHandler = async (reportId: string) => {
  try {
    await setDefaultReport(reportId)
    alert('Default report set!')
  } catch (error) {
    alert('Failed to set default report')
  }
}

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

const activeReportUrl = computed(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const reportName = urlParams.get('reportName')
  console.log('reportName: ', reportName)
  if (!reportName) return ''
  
  // Find the report with matching name
  const report = reports.value.find(r => r.name === reportName)
  console.log('report: ', reports, report)
  if (!report) return ''
  
  // Build the full URL with the report's saved path
  const url = window.location.origin + report.url_params
  
  return url
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

const handleUpdateReport = async (reportId: string) => {
  try {
    await updateReport(reportId)
    alert('Report updated successfully!')
  } catch (error) {
    alert('Failed to update report')
  }
}

const loadReport = (report: any) => {
  if (report.url_params) {
    // Parse the saved path to extract path and query params
    const [path, queryString] = report.url_params.split('?')
    const searchParams = new URLSearchParams(queryString || '')
    const query: Record<string, string> = {}
    
    for (const [key, value] of searchParams.entries()) {
      query[key] = value
    }
    
    // Add report name to query parameters
    query['reportName'] = report.name
    
    // Create the new URL
    const newUrl = window.location.origin + path + '?' + new URLSearchParams(query).toString()
    
    // Navigate to the new URL and reload the page
    window.location.href = newUrl
  } else {
    // If no parameters, just navigate with report name and reload
    const newUrl = router.resolve({ 
      path: '/',
      query: { reportName: report.name }
    }).href
    window.location.href = newUrl
  }
  
  showReports.value = false
}

const handleLogoClick = async () => {
  if (user.value?.id) {
    const defaultReport = await getDefaultReport()
    if (defaultReport && defaultReport.url_params) {
      // Parse the saved full path
      const url = window.location.origin + defaultReport.url_params
      window.location.href = url
      return
    }
  }
  window.location.href = '/'
}

const copyReportUrl = async (report: any) => {
  try {
    // Use the full path stored in url_params
    const url = window.location.origin + report.url_params
    
    await navigator.clipboard.writeText(url)
    
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

// Data Refresh state
const showRefresh = ref(false)
const refreshDropdownRef = ref<HTMLElement>()
const isRefreshing = ref(false)
const refreshStatus = ref<Array<{
  id: string
  label: string
  message: string
  status: 'loading' | 'success' | 'error'
}>>([])

// Selected endpoints for batch refresh
const selectedEndpoints = ref<Set<string>>(new Set())

// Data Refresh Functions
const toggleRefresh = () => {
  showRefresh.value = !showRefresh.value
  if (!showRefresh.value) {
    refreshStatus.value = []
  }
}

// Toggle endpoint selection
const toggleEndpointSelection = (endpoint: string) => {
  if (selectedEndpoints.value.has(endpoint)) {
    selectedEndpoints.value.delete(endpoint)
  } else {
    selectedEndpoints.value.add(endpoint)
  }
}

// Check if endpoint is selected
const isEndpointSelected = (endpoint: string) => {
  return selectedEndpoints.value.has(endpoint)
}

// Refresh only selected endpoints
const refreshSelectedData = async () => {
  if (selectedEndpoints.value.size === 0) {
    alert('Please select at least one item to refresh')
    return
  }

  isRefreshing.value = true
  refreshStatus.value = []

  for (const endpoint of Array.from(selectedEndpoints.value)) {
    await refreshData(endpoint as any)
    // Small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  isRefreshing.value = false
  // Clear selection after refresh
  selectedEndpoints.value.clear()
}

const refreshData = async (endpoint: 'positions' | 'maintenance-margin' | 'nlv' | 'current-market-price' | 'trades' | 'current-margin-impact' | 'cash-transactions' | 'transfers' | 'current-delta' | 'financial-data' | 'orders') => {
  const labels = {
    'positions': 'Positions',
    'maintenance-margin': 'Maintenance Margin',
    'nlv': 'Net Liquidation Value',
    'current-market-price': 'Current Market Prices',
    'trades': 'Trades',
    'current-margin-impact': 'Current Margin Impact',
    'cash-transactions': 'Cash Transactions',
    'transfers': 'Transfers',
    'current-delta': 'Current Delta',
    'financial-data': 'Financial Data',
    'orders': 'Orders'
  }

  const statusId = `refresh-${endpoint}-${Date.now()}`
  const label = labels[endpoint]

  // Add loading status
  refreshStatus.value.push({
    id: statusId,
    label,
    message: 'Starting refresh...',
    status: 'loading'
  })

  isRefreshing.value = true

  try {
    const apiBaseUrl = import.meta.env.VITE_IBKR_DATA_FETCH_URL
    const response = await fetch(`${apiBaseUrl}/fetch/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Update status with success
    const statusIndex = refreshStatus.value.findIndex(s => s.id === statusId)
    if (statusIndex !== -1) {
      refreshStatus.value[statusIndex] = {
        id: statusId,
        label,
        message: data.result?.success ? 'Completed successfully' : 'Completed with warnings',
        status: data.result?.success ? 'success' : 'error'
      }
    }

    console.log(`✅ ${label} refresh completed:`, data)
    
  } catch (error) {
    console.error(`❌ ${label} refresh failed:`, error)
    
    // Update status with error
    const statusIndex = refreshStatus.value.findIndex(s => s.id === statusId)
    if (statusIndex !== -1) {
      refreshStatus.value[statusIndex] = {
        id: statusId,
        label,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }
    }
  } finally {
    isRefreshing.value = false
  }
}

const refreshAllData = async () => {
  const endpoints: Array<'positions' | 'maintenance-margin' | 'nlv' | 'current-market-price' | 'trades' | 'transfers' | 'cash-transactions' | 'current-margin-impact' | 'current-delta' | 'orders' | 'financial-data'> = [
    'positions', 
    'maintenance-margin', 
    'nlv',
    'current-market-price',
    'trades',
    'transfers',
    'cash-transactions',
    'current-margin-impact',
    'current-delta',
    'orders',
    'financial-data'
  ]

  isRefreshing.value = true
  refreshStatus.value = []

  for (const endpoint of endpoints) {
    await refreshData(endpoint)
    // Small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  isRefreshing.value = false
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

// Close dropdowns when clicking outside
const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
  if (reportsDropdownRef.value && !reportsDropdownRef.value.contains(event.target as Node)) {
    showReports.value = false
  }
  if (refreshDropdownRef.value && !refreshDropdownRef.value.contains(event.target as Node)) {
    showRefresh.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadReports()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Custom Reports Editing Functions
const startEditReportName = (report: any) => {
  editingReportId.value = report.id
  editingReportName.value = report.name
}

const cancelEditReportName = () => {
  editingReportId.value = null
  editingReportName.value = ''
}

const saveReportName = async (reportId: string) => {
  if (!editingReportName.value.trim()) {
    cancelEditReportName()
    return
  }

  try {
    const { error } = await supabase
      .schema('hf')
      .from('custom_reports')
      .update({ name: editingReportName.value.trim() })
      .eq('id', reportId)
      .eq('user_id', user.value?.id)

    if (error) throw error
    
    await loadReports()
    cancelEditReportName()
  } catch (error) {
    console.error('Failed to update report name:', error)
    alert('Failed to update report name')
  }
}

// Add computed property for active report name from URL
const activeReportName = computed(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const reportName = urlParams.get('reportName')
  if(reportName) {
    document.title = reportName
  }
  return reportName || ''
})

// Get current symbol from route params
const currentSymbol = computed(() => {
  return route.params.symbolRoot as string || null
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

/* Brand section - LEFT SIDE */
.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

/* CENTER: Current Symbol Display */
.current-symbol {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  min-width: 0;
}

.symbol-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

/* Right side container */
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  margin-left: auto;
}

.logo-link {
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 0.25rem;
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

/* Data Refresh Dropdown */
.data-refresh {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
}

.refresh-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.refresh-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refresh-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 300px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 50;
  overflow: hidden;
}

.refresh-header {
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.refresh-header h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.refresh-header p {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.refresh-options {
  padding: 0.5rem;
}

.refresh-option-with-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.refresh-checkbox {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-left: 0.5rem;
  cursor: pointer;
  accent-color: #3b82f6;
}

.refresh-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.refresh-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  text-align: left;
}

.refresh-option:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.08);
  color: #1e293b;
}

.refresh-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-option svg {
  color: #94a3b8;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.refresh-option:hover:not(:disabled) svg {
  color: #3b82f6;
}

.refresh-all {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  font-weight: 600;
}

.refresh-all:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.2);
  color: #b45309;
}

.refresh-all svg {
  color: #f59e0b;
}

.refresh-selected {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.refresh-selected:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.refresh-selected:disabled {
  background: #9ca3af;
  box-shadow: none;
}

.refresh-selected svg {
  color: white;
}

.refresh-status {
  padding: 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  max-height: 200px;
  overflow-y: auto;
}

.status-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.75rem;
}

.status-label {
  font-weight: 600;
  min-width: 80px;
}

.status-message {
  flex: 1;
}

.status-item.loading {
  color: #3b82f6;
}

.status-item.success {
  color: #10b981;
}

.status-item.error {
  color: #ef4444;
}

.status-item.loading .status-label::before {
  content: "⏳ ";
}

.status-item.success .status-label::before {
  content: "✅ ";
}

.status-item.error .status-label::before {
  content: "❌ ";
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
  width: 320px;
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
}

.report-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.report-input:focus {
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
  transition: background-color 0.2s ease;
  width: auto;
}

.save-btn:hover:not(:disabled) {
  background: #2563eb;
}

.save-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.current-url {
  font-size: 0.75rem;
  color: #64748b;
  word-break: break-all;
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0;
}

.reports-list {
  padding: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.loading, .empty {
  padding: 1rem;
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
  transition: background-color 0.2s ease;
  margin-bottom: 0.25rem;
}

.report-item:hover {
  background: #f8fafc;
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
  word-break: break-word;
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.report-name:hover {
  background: #f1f5f9;
  color: #3b82f6;
  text-decoration: underline;
}

.edit-name-form {
  width: 100%;
}

.edit-name-input {
  width: 100%;
  padding: 0.25rem 0.5rem;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.report-date {
  font-size: 0.75rem;
  color: #64748b;
}

.report-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.load-btn, .rename-btn, .copy-btn, .delete-btn, .default-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rename-btn {
  background: #8b5cf6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
}

.rename-btn:hover {
  background: #7c3aed;
}

.load-btn {
  background: #3b82f6;
  color: white;
  font-weight: 600;
}

.load-btn:hover {
  background: #2563eb;
}

.copy-btn {
  background: #6b7280;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
}

.copy-btn:hover {
  background: #4b5563;
}

.delete-btn {
  background: #ef4444;
  color: white;
  font-weight: bold;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: #dc2626;
}

.update-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f59e0b;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
}

.update-btn:hover {
  background: #d97706;
}

/* Responsive design */
@media (max-width: 1024px) {
  .header-content {
    gap: 0.75rem;
  }
  
  .symbol-text {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
    gap: 0.5rem;
  }
  
  .current-symbol {
    padding: 0.25rem 0.5rem;
  }
  
  .symbol-text {
    font-size: 0.8rem;
  }
  
  .header-right {
    gap: 0.5rem;
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
  .symbol-text {
    font-size: 0.75rem;
  }
}
.active-report-badge {
    text-align: center;
    margin-top: 2px;
    font-size: 0.875rem;
    color: #6c757d;
}

span.active-report-name {
    padding-left: 2px;
}
.active-report-badge {
  text-align: center;
  margin-top: 2px;
  font-size: 0.875rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.active-report-link {
  padding-left: 2px;
  color: #8b5cf6;
  text-decoration: none;
  transition: all 0.2s ease;
  border-bottom: 1px dashed #8b5cf6;
}

.active-report-link:hover {
  color: #7c3aed;
  border-bottom-color: #7c3aed;
  border-bottom-style: solid;
}

/* Activity Drawer Styles */
.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(4px);
}

.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.activity-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 450px;
  max-width: 90vw;
  height: 100vh;
  background: white;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  flex-shrink: 0;
}

.drawer-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.drawer-title-section svg {
  color: #3b82f6;
  flex-shrink: 0;
}

.drawer-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.close-drawer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  flex-shrink: 0;
}

.close-drawer-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: scale(1.05);
}

.close-drawer-btn:active {
  transform: scale(0.95);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  background: #ffffff;
  height: 100%;
}

/* Custom scrollbar for drawer */
.drawer-content::-webkit-scrollbar {
  width: 8px;
}

.drawer-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.drawer-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>