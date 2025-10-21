<script setup lang="ts">
import { ref, computed, watch, onMounted, provide, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Positions } from '@y2kfund/positions'
import { Summary } from '@y2kfund/summary'
import { Thesis } from '@y2kfund/thesis'
import { Tasks } from '@y2kfund/tasks'
import { aiAnalyseTimelineConversationCard, ConversationDropdown } from '@y2kfund/analyze-timeline'
import '@y2kfund/positions/dist/style.css'
import '@y2kfund/summary/dist/style.css'
import '@y2kfund/thesis/dist/style.css'
import '@y2kfund/tasks/dist/style.css'
import { useAuth } from '../composables/useAuth'
import { useSupabase } from '@y2kfund/core'
import { eventBus } from '../utils/eventBus'
import 'gridstack/dist/gridstack.min.css'
import { GridStack } from 'gridstack'

// Get current user and supabase client
const { user } = useAuth()
const supabase = useSupabase()
const router = useRouter()

// Computed property for current user ID
const currentUserId = computed(() => user.value?.id || undefined)

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
  aiTimelineCard: 'tab' // minimized by default
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

function getLayoutFromUrl(): any[] {
  const urlParams = new URLSearchParams(window.location.search)
  const layoutParam = urlParams.get('dashboardLayout')
  if (layoutParam) {
    try {
      return JSON.parse(decodeURIComponent(layoutParam))
    } catch (e) {
      console.error('Failed to parse dashboardLayout param', e)
    }
  }
  return []
}

function setLayoutToUrl(layout: any[]) {
  const url = new URL(window.location.href)
  if (layout.length > 0) {
    url.searchParams.set('dashboardLayout', encodeURIComponent(JSON.stringify(layout)))
  } else {
    url.searchParams.delete('dashboardLayout')
  }
  window.history.replaceState({}, '', url.toString())
}

// --- Replace loadFromUrlParams to also restore layout from URL ---
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
  // Restore visible components at correct positions
  nextTick(() => {
    if (gridInstance.value) {
      let colIdx = 0
      windowColumns.value.forEach((col) => {
        const el = gridstackRef.value?.querySelector(`[data-gs-id="${col.id}"]`)
        if (el && !gridInstance.value.engine.nodes.find(n => n.el === el)) {
          gridInstance.value.addWidget(el, {x: colIdx, y: 0, width: 1, height: 5})
          colIdx++
        }
      })
      // Restore layout from URL param
      const layout = getLayoutFromUrl()
      if (layout && layout.length > 0) {
        nextTick(() => {
          layout.forEach((item: any) => {
            if (componentModes.value[item.id] === 'window') {
              const el = gridstackRef.value?.querySelector(`[data-gs-id="${item.id}"]`)
              if (el) {
                gridInstance.value?.update(el, {
                  x: item.x,
                  y: item.y,
                  w: item.w ?? 1,
                  h: item.h ?? 5,
                  id: item.id
                })
              }
            }
          })
        })
      } else {
        gridInstance.value.engine.nodes.forEach(node => {
          gridInstance.value?.update(node.el, {height: 5});
        });
      }
    }
  })
}

// Component mode management
const handleMinimize = (columnId: string) => {
  componentModes.value[columnId] = 'tab'
  nextTick(() => {
    if (gridInstance.value) {
      const node = gridInstance.value.engine.nodes.find(n => n.el.getAttribute('data-gs-id') === columnId)
      if (node) {
        gridInstance.value.removeWidget(node.el)
      }
    }
  })
}

const handleRestore = (columnId: string) => {
  componentModes.value[columnId] = 'window'
  nextTick(() => {
    if (gridInstance.value) {
      const el = gridstackRef.value?.querySelector(`[data-gs-id="${columnId}"]`)
      if (el) {
        const pos = getNextAvailablePosition(gridInstance.value)
        gridInstance.value.addWidget(el, {x: pos.x, y: pos.y, width: 1, height: 5})
      }
    }
  })
}

// Watch for changes and update URL
watch(componentModes, updateUrlParams, { deep: true })

// Initialize on mount
const selectedDate = ref('')
const selectedDateConversations = ref<any[]>([])
const showDropdown = ref(false)
const dropdownPosition = ref({ x: 0, y: 0 })
const selectedConversation = ref<any>(null)
const dropdownLoading = ref(false)

const handleTimelineShowDropdown = (payload: { date: string, conversations: any[], position: { x: number, y: number }, loading?: boolean, error?: string }) => {
  console.log('[Home] Showing dropdown:', payload)
  
  selectedDate.value = payload.date
  selectedDateConversations.value = payload.conversations
  dropdownPosition.value = payload.position
  dropdownLoading.value = payload.loading || false
  showDropdown.value = true
  
  // If there's an error, you could handle it here
  if (payload.error) {
    console.error('[Home] Dropdown error:', payload.error)
  }
}

const handleConversationSelected = async (conversationId: string) => {
  console.log('[Home] Conversation selected:', conversationId)
  
  // Find the selected conversation
  const conversation = selectedDateConversations.value.find((c: any) => c.id === conversationId)
  
  if (conversation) {
    selectedConversation.value = conversation
    showDropdown.value = false
  }
}

const closeDropdown = () => {
  showDropdown.value = false
}

const closeaiAnalyseTimelineConversationCard = () => {
  selectedConversation.value = null
  selectedDateConversations.value = []
  selectedDate.value = ''
}

const gridstackRef = ref<HTMLDivElement | null>(null)
const gridInstance = ref<GridStack | null>(null)

const getGridColumns = () => {
  if (window.innerWidth < 640) return 1
  if (window.innerWidth < 900) return 2
  if (window.innerWidth < 1200) return 3
  return 8
}

onMounted(() => {
  loadFromUrlParams()
  eventBus.on('timeline:show-dropdown', handleTimelineShowDropdown)
  nextTick(() => {
    if (gridstackRef.value) {
      gridInstance.value = GridStack.init({ 
        column: getGridColumns(),
        float: true,
        margin: 10,
        cellHeight: 100,
        resizable: {
          handles: 'e, se, s, sw, w',
          minHeight: 60
        }
      }, gridstackRef.value);

      // Restore layout from URL param
      const layout = getLayoutFromUrl()
      if (layout && layout.length > 0) {
        nextTick(() => {
          layout.forEach((item: any) => {
            if (componentModes.value[item.id] === 'window') {
              const el = gridstackRef.value?.querySelector(`[data-gs-id="${item.id}"]`)
              if (el) {
                gridInstance.value?.update(el, {
                  x: item.x,
                  y: item.y,
                  w: item.w ?? 1,
                  h: item.h ?? 5,
                  id: item.id
                })
              }
            }
          })
        })
      } else {
        gridInstance.value.engine.nodes.forEach(node => {
          gridInstance.value?.update(node.el, {height: 5});
        });
      }

      gridInstance.value.on('change', saveGridLayout)
    }
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  eventBus.off('timeline:show-dropdown', handleTimelineShowDropdown)
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (gridInstance.value) {
    gridInstance.value.column(getGridColumns())
  }
}

// Navigation handlers
const navigateToThesis = () => {
  router.push('/thesis')
}

const navigateToTasks = () => {
  router.push('/tasks')
}

function getNextAvailablePosition(grid: GridStack) {
  const usedColumns = new Set<number>();
  grid.engine.nodes.forEach(node => {
    usedColumns.add(node.x);
  });
  let x = 0;
  while (usedColumns.has(x)) {
    x++;
  }
  return { x, y: 0 }; // Place in next free column, row 0
}

function saveGridLayout(e) {
  if (!gridInstance.value) return
  const layout = gridInstance.value.engine.nodes.map(node => ({
    id: node.el.getAttribute('data-gs-id'),
    x: node.x,
    y: node.y,
    w: node.w,
    h: node.h
  }))
  setLayoutToUrl(layout)
}
</script>

<template>
  <main class="dashboard">
    <!-- Conversation Dropdown -->
    <ConversationDropdown
      v-if="showDropdown"
      :conversations="selectedDateConversations"
      :position="dropdownPosition"
      :date="selectedDate"
      :is-open="showDropdown"
      :loading="dropdownLoading"
      @conversation-selected="handleConversationSelected"
      @close="closeDropdown"
    />

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
      <div ref="gridstackRef" class="grid-stack">
        <template v-for="(column, idx) in windowColumns" :key="column?.id">
          <div 
            class="grid-stack-item ui-resizable"
            :data-gs-id="column.id"
            gs-width="1"
          >
            <div class="grid-stack-item-content dashboard-column">
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
                    v-if="selectedConversation"
                    :date="selectedDate"
                    :conversations="[selectedConversation]"
                    :is-open="true"
                    :supabase-client="supabase"
                    :user-id="currentUserId"
                    @close="closeaiAnalyseTimelineConversationCard"
                  />
                </template>

                <!-- Other column content -->
                <template v-else>
                  <p>{{ column.content }}</p>
                </template>
              </section>
            </div>
          </div>
        </template>
      </div>
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
  min-height: 0 !important;
  height: 100%;
  box-sizing: border-box;
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

.grid-stack {
  margin: 0 auto;
  height: auto;
  min-height: unset;
}
.grid-stack-item {
  min-height: 100px !important;
}
.grid-stack-item-content {
  min-height: 0 !important;
  height: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  border-radius: 8px;
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

.dashboard-grid, .grid-stack {
  width: 100%;
  overflow: visible;
}
</style>