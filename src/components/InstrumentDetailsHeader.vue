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
          <button @click="toggleRefresh" class="refresh-button" :disabled="isRefreshing" :title="isRefreshing ? 'Data refresh in progress' : 'Manual Data Refresh'">
            <svg v-if="!isRefreshing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            <svg v-else class="spinning" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <!--{{ isRefreshing ? 'Refreshing...' : 'Refresh Data' }}-->
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
                  Net Liquidation Value<span style="font-size: 10px;">(Docker)</span>
                </button>
                <button 
                  class="status-arrow-btn"
                  :class="{ 'active': expandedEndpoint === 'nlv' }"
                  @click.stop="toggleEndpointStatus('nlv')"
                  title="View fetch history"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                
                <!-- NLV Fetch Status Popover -->
                <div v-if="expandedEndpoint === 'nlv'" class="fetch-status-popover-container" @click.stop>
                  <FetchStatusPopover 
                    title="Net Liquidation Value"
                    :data="getStatusData('nlv')"
                    :accounts="accountAliases"
                    :is-loading="isLoadingFetchStatus"
                  />
                </div>
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
                  Maintenance Margin<span style="font-size: 10px;">(Docker)</span>
                </button>
                <button 
                  class="status-arrow-btn"
                  :class="{ 'active': expandedEndpoint === 'maintenance-margin' }"
                  @click.stop="toggleEndpointStatus('maintenance-margin')"
                  title="View fetch history"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                
                <!-- Maintenance Margin Fetch Status Popover -->
                <div v-if="expandedEndpoint === 'maintenance-margin'" class="fetch-status-popover-container" @click.stop>
                  <FetchStatusPopover 
                    title="Maintenance Margin"
                    :data="getStatusData('maintenance-margin')"
                    :accounts="accountAliases"
                    :is-loading="isLoadingFetchStatus"
                  />
                </div>
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
                  Positions<span style="font-size: 10px;">(Docker)</span>
                </button>
                <button 
                  class="status-arrow-btn"
                  :class="{ 'active': expandedEndpoint === 'positions' }"
                  @click.stop="toggleEndpointStatus('positions')"
                  title="View fetch history"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                
                <!-- Positions Fetch Status Popover -->
                <div v-if="expandedEndpoint === 'positions'" class="fetch-status-popover-container" @click.stop>
                  <FetchStatusPopover 
                    title="Positions"
                    :data="getStatusData('positions')"
                    :accounts="accountAliases"
                    :is-loading="isLoadingFetchStatus"
                  />
                </div>
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
                  Current Market Prices<span style="font-size: 10px;">(Docker)</span>
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
                  Current Margin Impact<span style="font-size: 10px;">(Docker)</span>
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
                  Trades<span style="font-size: 10px;">(Flex Query)</span>
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
                  Cash Transactions<span style="font-size: 10px;">(Flex Query)</span>
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
                  Transfers<span style="font-size: 10px;">(Flex Query)</span>
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
                  Current Delta<span style="font-size: 10px;">(Docker)</span>
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
                  Financial Data<span style="font-size: 10px;">(Docker)</span>
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
                  Orders<span style="font-size: 10px;">(Flex Query)</span>
                </button>
              </div>

              <div class="refresh-option-with-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isEndpointSelected('today-orders-trades')"
                  @change="toggleEndpointSelection('today-orders-trades')"
                  :disabled="isRefreshing"
                  class="refresh-checkbox"
                />
                <button 
                  @click="refreshData('today-orders-trades')" 
                  :disabled="isRefreshing"
                  class="refresh-option"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Today's Orders and Trades<span style="font-size: 10px;">(Flex Query)</span>
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
            <button @click="toggleReports" class="reports-button" title="Custom Reports">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <!--Custom Reports-->
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

        <!-- Sections Visibility Dropdown -->
        <div class="sections-dropdown-container" ref="sectionsDropdownRef" v-if="route.name === 'instrument-details'" title="Sections Visibility">
          <button @click="toggleSectionsDropdown" class="sections-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
            </svg>
            <!--Sections-->
          </button>

          <!-- Dropdown Menu -->
          <div v-if="showSectionsDropdown" class="sections-dropdown">
            <div class="sections-header">
              <div class="sections-header-content">
                <h4>Show/Hide Sections</h4>
                <p>Toggle visibility of page sections</p>
              </div>
              <button @click="showSectionsDropdown = false" class="close-sections-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="sections-list">
              <div 
                v-for="section in availableSections" 
                :key="section.id"
                class="section-item"
              >
                <label class="section-label">
                  <input 
                    type="checkbox" 
                    :checked="isSectionVisible(section.id)"
                    @change="toggleSection(section.id)"
                    class="section-checkbox"
                  />
                  <span class="section-name">{{ section.label }}</span>
                </label>
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
import { useFetchStatus } from '../composables/useFetchStatus'
import FetchStatusPopover from './FetchStatusPopover.vue'

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

// Fetch Status
const { 
  fetchStatusData, 
  accountAliases, 
  isLoadingFetchStatus, 
  fetchAccountAliases, 
  fetchStatusForEndpoint, 
  getStatusData 
} = useFetchStatus()
const expandedEndpoint = ref<string | null>(null)

// Toggle endpoint status panel
const toggleEndpointStatus = (endpoint: string) => {
  if (expandedEndpoint.value === endpoint) {
    expandedEndpoint.value = null
  } else {
    expandedEndpoint.value = endpoint
    fetchStatusForEndpoint(endpoint)
  }
}

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

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// Add this function
const closeDropdown = () => {
  isDropdownOpen.value = false
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

const refreshData = async (endpoint: 'positions' | 'maintenance-margin' | 'nlv' | 'current-market-price' | 'trades' | 'current-margin-impact' | 'cash-transactions' | 'transfers' | 'current-delta' | 'financial-data' | 'orders' | 'today-orders-trades') => {
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
    'orders': 'Orders',
    'today-orders-trades': 'Today\'s Orders & Trades'
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
  const endpoints: Array<'positions' | 'maintenance-margin' | 'nlv' | 'current-market-price' | 'trades' | 'transfers' | 'cash-transactions' | 'current-margin-impact' | 'current-delta' | 'orders' | 'financial-data' | 'today-orders-trades'> = [
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
    'financial-data',
    'today-orders-trades'
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

// Sections visibility state
const showSectionsDropdown = ref(false)
const sectionsDropdownRef = ref<HTMLElement>()

// Define available sections
const availableSections = [
  { id: 'current-positions', label: 'Current Positions', default: true },
  { id: 'instrument-insight', label: 'Key Factors / Plan', default: true },
  { id: 'tasks', label: 'Tasks', default: true },
  { id: 'put-positions', label: 'Put Positions', default: true },
  { id: 'call-positions', label: 'Call Positions', default: true },
  { id: 'trades', label: 'Orders / Trades', default: true }
]

// Get visible sections from URL or defaults
const visibleSections = computed(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const sectionsParam = urlParams.get('sections')
  
  if (sectionsParam) {
    return new Set(sectionsParam.split(','))
  }
  
  // Return all sections by default
  return new Set(availableSections.map(s => s.id))
})

// Toggle section visibility
const toggleSection = (sectionId: string) => {
  // Get current sections from URL
  const urlParams = new URLSearchParams(window.location.search)
  const sectionsParam = urlParams.get('sections')
  
  // Create a set from current URL state, not from computed property
  const currentSections = sectionsParam 
    ? new Set(sectionsParam.split(','))
    : new Set(availableSections.map(s => s.id))
  
  if (currentSections.has(sectionId)) {
    currentSections.delete(sectionId)
  } else {
    currentSections.add(sectionId)
  }
  
  // Update URL
  if (currentSections.size === availableSections.length) {
    // If all sections are visible, remove the parameter
    urlParams.delete('sections')
  } else {
    urlParams.set('sections', Array.from(currentSections).join(','))
  }
  
  // Update URL without reload
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`
  window.history.pushState({}, '', newUrl)
  
  // Emit event to parent component
  eventBus.emit('sections-visibility-changed', Array.from(currentSections))
}

// Toggle sections dropdown
const toggleSectionsDropdown = () => {
  showSectionsDropdown.value = !showSectionsDropdown.value
}

// Check if section is visible
const isSectionVisible = (sectionId: string) => {
  return visibleSections.value.has(sectionId)
}

// Modify the existing handleClickOutside function:
const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
  if (reportsDropdownRef.value && !reportsDropdownRef.value.contains(event.target as Node)) {
    showReports.value = false
  }
  if (refreshDropdownRef.value && !refreshDropdownRef.value.contains(event.target as Node)) {
    showRefresh.value = false
    expandedEndpoint.value = null // Also close fetch status popover
  }
  if (sectionsDropdownRef.value && !sectionsDropdownRef.value.contains(event.target as Node)) {
    showSectionsDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadReports()
  fetchAccountAliases() // Load account aliases for fetch status popover
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
@import '../styles/instrumentDetailsHeader.css';
</style>