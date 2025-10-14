<script setup lang="ts">
import { ref, computed, watch, onMounted, provide, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Positions } from '@y2kfund/positions'
import { Summary } from '@y2kfund/summary'
import { Thesis } from '@y2kfund/thesis'
import { Tasks } from '@y2kfund/tasks'
import { aiAnalyseTimelineConversationCard } from '@y2kfund/analyze-timeline'
import '@y2kfund/positions/dist/style.css'
import '@y2kfund/summary/dist/style.css'
import '@y2kfund/thesis/dist/style.css'
import '@y2kfund/tasks/dist/style.css'
import { useAuth } from '../composables/useAuth'
import { eventBus } from '../utils/eventBus'

// Get current user
const { user } = useAuth()
const router = useRouter()

// Computed property for current user ID
const currentUserId = computed(() => user.value?.id || null)

// Provide the event bus to child components
provide('eventBus', eventBus);

interface Column {
  id: string
  title: string
  content: string
  component?: any
}

type ComponentMode = 'window' | 'tab'

const columns = ref<Column[]>([
  { id: 'summary', title: 'Summary', content: '', component: Summary },
  { id: 'positions', title: 'Positions', content: '', component: Positions },
  { id: 'thesis', title: 'Thesis', content: '', component: Thesis },
  { id: 'tasks', title: 'Tasks', content: '', component: Tasks },
  { id: 'aiTimelineCard', title: 'aiTimelineCard', content: '', component: aiAnalyseTimelineConversationCard }
])

// Track mode for each component (window = visible, tab = minimized)
const componentModes = ref<Record<string, ComponentMode>>({
  summary: 'window',
  positions: 'window',
  thesis: 'window',
  tasks: 'window',
  aiTimelineCard: 'window'
})

// Computed properties
const windowColumns = computed(() => 
  columns.value.filter(col => componentModes.value[col.id] === 'window')
)

const tabColumns = computed(() => 
  columns.value.filter(col => componentModes.value[col.id] === 'tab')
)

// URL query parameter management
const updateUrlParams = () => {
  const url = new URL(window.location.href)
  const tabModeApps = Object.entries(componentModes.value)
    .filter(([_, mode]) => mode === 'tab')
    .map(([id]) => id)
  
  if (tabModeApps.length > 0) {
    url.searchParams.set('minimizedApps', tabModeApps.join(','))
  } else {
    url.searchParams.delete('minimizedApps')
  }
  window.history.replaceState({}, '', url.toString())
}

const loadFromUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const minimizedAppsParam = urlParams.get('minimizedApps')
  if (minimizedAppsParam) {
    const minimizedIds = minimizedAppsParam.split(',').filter(id => 
      columns.value.some(col => col.id === id)
    )
    minimizedIds.forEach(id => {
      componentModes.value[id] = 'tab'
    })
  }
}

// Component mode management
const handleMinimize = (columnId: string) => {
  componentModes.value[columnId] = 'tab'
}

const handleRestore = (columnId: string) => {
  componentModes.value[columnId] = 'window'
}

// Watch for changes and update URL
watch(componentModes, updateUrlParams, { deep: true })

// Initialize on mount
const selectedDate = ref('')
const selectedDateConversations = ref<any[]>([])

const handleTimelineConversations = (payload: { date: string, conversations: any[] }) => {
  console.log('[Home] Received conversations from AppHeader:', payload)
  selectedDate.value = payload.date
  selectedDateConversations.value = payload.conversations
}

const closeaiAnalyseTimelineConversationCard = () => {
  selectedDateConversations.value = []
  selectedDate.value = ''
}

onMounted(() => {
  loadFromUrlParams()
  eventBus.on('timeline:conversations', handleTimelineConversations) 
})

onBeforeUnmount(() => {
  eventBus.off('timeline:conversations', handleTimelineConversations)
})

// Navigation handlers
const navigateToThesis = () => {
  router.push('/thesis')
}

const navigateToTasks = () => {
  router.push('/tasks')
}
</script>

<template>
  <main class="dashboard">
    <!-- Minimized apps tabs bar -->
    <div v-if="tabColumns.length > 0" class="tabs-bar">
      <span class="tabs-label">Minimized:</span>
      <button
        v-for="column in tabColumns"
        :key="`tab-${column.id}`"
        @click="handleRestore(column.id)"
        class="app-tab"
        :title="`Click to restore ${column.title} app`"
      >
        {{ column.title }}
      </button>
    </div>

    <div class="dashboard-grid">
      <template v-for="column in windowColumns" :key="column?.id"> 
        <div 
          v-if="column && (column.id !== 'aiTimelineCard' || selectedDateConversations.length > 0)"
          class="dashboard-column"
        >
          <section class="card">
            <!-- Summary content -->
            <template v-if="column.id === 'summary'">
              <Summary 
                :show-header-link="true" 
                :user-id="currentUserId"
                @minimize="handleMinimize('summary')" 
              />
            </template>
            
            <!-- Positions component -->
            <template v-else-if="column.id === 'positions'">
              <Positions 
                accountId="demo" 
                :show-header-link="true" 
                :user-id="currentUserId"
                @minimize="handleMinimize('positions')" 
              />
            </template>

            <!-- Thesis component with navigation -->
            <template v-else-if="column.id === 'thesis'">
              <Thesis 
                :show-header-link="true"
                :user-id="currentUserId"
                @minimize="handleMinimize('thesis')"
                @navigate="navigateToThesis"
              />
            </template>

            <!-- Tasks component with navigation -->
            <template v-else-if="column.id === 'tasks'">
              <Tasks 
                :show-header-link="true"
                :user-id="currentUserId"
                @minimize="handleMinimize('tasks')"
                @navigate="navigateToTasks"
              />
            </template>

            <!-- AI Timeline Card -->
            <template v-else-if="column.id === 'aiTimelineCard'">
              <aiAnalyseTimelineConversationCard
                :date="selectedDate"
                :conversations="selectedDateConversations"
                :is-open="true"
                @close="closeaiAnalyseTimelineConversationCard"
              />
            </template>

            <!-- Other column content -->
            <template v-else>
              <p>{{ column.content }}</p>
            </template>
          </section>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  /*padding: 1rem;*/
  background-color: #f8fafc;
}

.tabs-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid rgba(0,0,0,.1);
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
}

.tabs-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.app-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.app-tab:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.dashboard-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  /* gap: 1.5rem; */
  margin: 0 auto;
}

.dashboard-column {
  display: flex;
  flex-direction: column;
  /* gap: 1rem; */
  height: fit-content;
  align-items: stretch;
}

.card {
  padding: 0.8rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(0,0,0,.1);
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  background: white;
  height: fit-content;
}

.dashboard-container {
  padding:0;
  background-color: none;
}

p { 
  margin: 0; 
  color: #6b7280; 
  line-height: 1.5;
}

/* Responsive behavior for smaller screens */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-auto-flow: row;
    grid-auto-columns: unset;
  }
  
  .tabs-bar {
    flex-wrap: wrap;
  }
}
</style>