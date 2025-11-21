<script setup lang="ts">
import { ref, watch } from 'vue'
import { relativeCapitalDeployed } from '@y2kfund/relative-capital-deployed-risk-management'
import '@y2kfund/relative-capital-deployed-risk-management/dist/style.css'
import { capitalAcrossThesis } from '@y2kfund/capital-across-thesis-risk-management'
import '@y2kfund/capital-across-thesis-risk-management/dist/style.css'
import { useAuth } from '../composables/useAuth'

const { user } = useAuth()

// Active tab state
type TabType = 'capital-deployed' | 'capital-across-thesis' | 'pe-ratio'
const activeTab = ref<TabType>('capital-deployed')

// Update document title
watch(activeTab, (newTab) => {
  const titles: Record<TabType, string> = {
    'capital-deployed': 'Capital Deployed Across Assets - Risk Management | Y2K Fund',
    'capital-across-thesis': 'Capital Across Thesis - Risk Management | Y2K Fund',
    'pe-ratio': 'P/E Ratio of Companies - Risk Management | Y2K Fund'
  }
  document.title = titles[newTab]
}, { immediate: true })

function switchTab(tab: TabType) {
  activeTab.value = tab
}
</script>

<template>
  <div class="risk-management-app">
    <main class="app-content">
      <div class="content-layout">
        <!-- Left Section - Static Tabs -->
        <aside class="tabs-sidebar">
          <div class="tabs-header">
            <h2>Risk Management</h2>
            <p class="subtitle">Analyze portfolio risk metrics</p>
          </div>
          
          <nav class="tabs-nav">
            <button 
              class="tab-button" 
              :class="{ active: activeTab === 'capital-deployed' }"
              @click="switchTab('capital-deployed')"
            >
              <svg class="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Capital Deployed Across Assets</span>
            </button>
            
            <button 
              class="tab-button" 
              :class="{ active: activeTab === 'capital-across-thesis' }"
              @click="switchTab('capital-across-thesis')"
            >
              <svg class="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Capital Across Thesis</span>
            </button>
            
            <button 
              class="tab-button" 
              :class="{ active: activeTab === 'pe-ratio' }"
              @click="switchTab('pe-ratio')"
            >
              <svg class="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
              <span>P/E Ratio of Companies</span>
            </button>
          </nav>
        </aside>

        <!-- Right Section - Content -->
        <div class="content-container">
          <!-- Capital Deployed Tab -->
          <section v-if="activeTab === 'capital-deployed'" class="content-section">
            <relativeCapitalDeployed 
              :user-id="user?.id || null"
            />
          </section>

          <!-- Capital Across Thesis Tab -->
          <section v-else-if="activeTab === 'capital-across-thesis'" class="content-section">
            <capitalAcrossThesis 
              :user-id="user?.id || null"
            />
          </section>

          <!-- P/E Ratio Tab (Placeholder) -->
          <section v-else-if="activeTab === 'pe-ratio'" class="content-section">
            <div class="placeholder-content">
              <div class="placeholder-icon">📊</div>
              <h3>P/E Ratio Analysis</h3>
              <p>This feature is coming soon. It will display P/E ratio analysis across companies in your portfolio.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.risk-management-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.app-content {
  flex: 1;
  overflow: hidden;
  padding: 1rem;
}

.content-layout {
  display: flex;
  gap: 1.5rem;
  height: 100%;
}

/* Tabs Sidebar */
.tabs-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
}

.tabs-header h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.tabs-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #495057;
  text-align: left;
  transition: all 0.2s ease;
}

.tab-button:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.tab-button.active {
  background: #e7f3ff;
  border-color: #007bff;
  color: #007bff;
}

.tab-button.active .tab-icon {
  stroke: #007bff;
}

.tab-icon {
  flex-shrink: 0;
  stroke: #6c757d;
  transition: stroke 0.2s ease;
}

/* Content Container */
.content-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.content-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* Placeholder Content */
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  height: 100%;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.placeholder-content h3 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.placeholder-content p {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
  max-width: 500px;
  line-height: 1.6;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-layout {
    flex-direction: column;
  }

  .tabs-sidebar {
    width: 100%;
  }

  .tabs-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .tab-button {
    min-width: 250px;
  }
}

@media (max-width: 768px) {
  .app-content {
    padding: 0.75rem;
  }

  .content-layout {
    gap: 1rem;
  }

  .tabs-sidebar {
    padding: 1rem;
  }

  .tabs-header h2 {
    font-size: 1.25rem;
  }

  .tab-button {
    padding: 0.75rem;
    font-size: 0.875rem;
    min-width: 200px;
  }

  .placeholder-content {
    padding: 2rem 1rem;
  }

  .placeholder-icon {
    font-size: 3rem;
  }

  .placeholder-content h3 {
    font-size: 1.25rem;
  }

  .placeholder-content p {
    font-size: 0.9rem;
  }
}
</style>
