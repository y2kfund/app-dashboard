<script setup lang="ts">
import { ref, computed, watch, onMounted, provide, onBeforeUnmount, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Positions } from '@y2kfund/positions'
import { Summary } from '@y2kfund/summary'
import { Thesis } from '@y2kfund/thesis'
import { Tasks } from '@y2kfund/tasks'
import { Trades } from '@y2kfund/trades'
import { Transfers } from '@y2kfund/transfers'
import { CashTransactions } from '@y2kfund/cash-transactions'
import { aiAnalyseTimelineConversationCard, ConversationDropdown } from '@y2kfund/analyze-timeline'
import '@y2kfund/positions/dist/style.css'
import '@y2kfund/summary/dist/style.css'
import '@y2kfund/thesis/dist/style.css'
import '@y2kfund/tasks/dist/style.css'
import '@y2kfund/trades/dist/style.css'
import '@y2kfund/transfers/dist/style.css'
import '@y2kfund/cash-transactions/dist/style.css'
import { useAuth } from '../composables/useAuth'
import { useSupabase } from '@y2kfund/core'
import { eventBus } from '../utils/eventBus'
import 'gridstack/dist/gridstack.min.css'
import { GridStack } from 'gridstack'

// Get current user and supabase client
const { user } = useAuth()
const supabase = useSupabase()
const router = useRouter()
const showAddGridMenu = ref(false)

// Computed property for current user ID
const currentUserId = computed(() => user.value?.id || undefined)

// Provide the event bus to child components
provide('eventBus', eventBus);

interface Column {
  id: string
  title: string
  content: string
  component?: any
  window?: string
}

type ComponentMode = 'window' | 'tab'

const columns = ref<Column[]>([
  { id: 'summary', title: 'Summary', content: '', component: Summary, window: 'window_1' },
  { id: 'positions', title: 'Positions', content: '', component: Positions, window: 'window_1' },
  { id: 'thesis', title: 'Thesis', content: '', component: Thesis, window: 'window_1' },
  { id: 'tasks', title: 'Tasks', content: '', component: Tasks, window: 'window_1' },
  { id: 'trades', title: 'Trades', content: '', component: Trades, window: 'window_1' },
  { id: 'transfers', title: 'Transfers', content: '', component: Transfers, window: 'window_1' },
  { id: 'aiTimelineCard', title: 'aiTimelineCard', content: '', component: aiAnalyseTimelineConversationCard, window: 'window_1' },
  { id: 'cashTransactions', title: 'Cash Transactions', content: '', component: CashTransactions, window: 'window_1' }
])

// Track mode for each component (window = visible, tab = minimized)
const componentModes = ref<Record<string, ComponentMode>>({
  summary: 'window',
  positions: 'window',
  thesis: 'window',
  tasks: 'window',
  trades: 'window',
  transfers: 'window',
  cashTransactions: 'window',
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

  // Update dashboardModes param
  url.searchParams.set('dashboardModes', encodeURIComponent(JSON.stringify(componentModes.value)))

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
    url.searchParams.set('dashboardColumns', encodeURIComponent(JSON.stringify(columns.value.map(col => ({
      id: col.id,
      typeId: col.id.split('_')[0],
      window: col.window
    })))))
    url.searchParams.set('dashboardModes', encodeURIComponent(JSON.stringify(componentModes.value)))
  } else {
    url.searchParams.delete('dashboardLayout')
    url.searchParams.delete('dashboardColumns')
    url.searchParams.delete('dashboardModes')
  }
  window.history.replaceState({}, '', url.toString())
}

function getModesFromUrl(): Record<string, ComponentMode> {
  const urlParams = new URLSearchParams(window.location.search)
  const modesParam = urlParams.get('dashboardModes')
  if (modesParam) {
    try {
      return JSON.parse(decodeURIComponent(modesParam))
    } catch (e) {
      console.error('Failed to parse dashboardModes param', e)
    }
  }
  return {}
}

function getColumnsFromUrl(): Column[] {
  const urlParams = new URLSearchParams(window.location.search)
  const columnsParam = urlParams.get('dashboardColumns')
  if (columnsParam) {
    try {
      const arr = JSON.parse(decodeURIComponent(columnsParam))
      return arr.map((col: any) => {
        const type = gridTypes.find(t => t.id === col.typeId)
        let windowId = col.window
        if (!windowId) {
          // If id is like 'positions_2', use 'window_2'
          const match = col.id.match(/_(\d+)$/)
          windowId = match ? `window_${match[1]}` : 'window_1'
        }
        return {
          id: col.id,
          title: `${type?.title || col.typeId}`,
          content: '',
          component: type?.component,
          window: windowId
        }
      })
    } catch (e) {
      console.error('Failed to parse dashboardColumns param', e)
    }
  }
  return []
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

  const restoredColumns = getColumnsFromUrl()
  if (restoredColumns.length > 0) {
    columns.value = restoredColumns
  }

  const restoredModes = getModesFromUrl()
  if (Object.keys(restoredModes).length > 0) {
    componentModes.value = restoredModes
  }
  
  // Restore visible components at correct positions
  nextTick(() => {
    if (gridInstance.value) {
      let colIdx = 0
      windowColumns.value.forEach((col) => {
        const el = gridstackRef.value?.querySelector(`[data-gs-id="${col.id}"]`)
        if (el && !gridInstance.value.engine.nodes.find(n => n.el === el)) {
          gridInstance.value.makeWidget(el, {x: colIdx, y: 0, width: 1, height: 5})
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
  if (/_\d+$/.test(columnId)) {
    // Remove from columns and componentModes
    columns.value = columns.value.filter(col => col.id !== columnId)
    delete componentModes.value[columnId]
    // Update URL params
    updateUrlParams()
    saveGridLayout()
  }
  else {
    componentModes.value[columnId] = 'tab'
    updateUrlParams()
  }
  
  nextTick(() => {
    if (gridInstance.value) {
      const node = gridInstance.value.engine.nodes.find(n => n.el.getAttribute('data-gs-id') === columnId)
      if (node) {
        gridInstance.value.removeWidget(node.el)
      }
    }
  })
}

/*const handleRestore = (columnId: string) => {
  componentModes.value[columnId] = 'window'
  nextTick(() => {
    if (gridInstance.value) {
      const el = gridstackRef.value?.querySelector(`[data-gs-id="${columnId}"]`)
      if (el) {
        const pos = getNextAvailablePosition(gridInstance.value)
        gridInstance.value.makeWidget(el, { x: pos.x, y: pos.y, width: 1, height: 5 })
      }
    }
  })
}*/

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
const maximizedWidget = ref<string | null>(null)

const getGridColumns = () => {
  if (window.innerWidth < 640) return 1
  if (window.innerWidth < 900) return 2
  if (window.innerWidth < 1200) return 3
  return 8
}

function toggleMaximize(columnId: string) {
  // Use an overlay approach: show the component in a top-layer full-screen panel.
  // This avoids changing gridstack layout and prevents other cards from reflowing on restore.
  if (maximizedWidget.value === columnId) {
    // already maximized -> close overlay
    maximizedWidget.value = null
    document.body.style.overflow = ''
    return
  }
  maximizedWidget.value = columnId
  // prevent background scroll while overlay is open
  document.body.style.overflow = 'hidden'
}

function restoreMaximized(columnId: string | null) {
  if (!columnId) return
  if (maximizedWidget.value === columnId) {
    maximizedWidget.value = null
    document.body.style.overflow = ''
  }
}

onMounted(() => {
  loadFromUrlParams()
  eventBus.on('timeline:show-dropdown', handleTimelineShowDropdown)
  nextTick(() => {
    if (gridstackRef.value) {
      gridInstance.value = GridStack.init({ 
        column: getGridColumns(),
        float: false,
        margin: 10,
        cellHeight: 50,
        resizable: {
          handles: 'e, se, s, sw, w',
          minHeight: 50
        },
        disableOneColumnMode: false, // Allow one column mode on mobile
        animate: true // Smooth animations when items move
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
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  eventBus.off('timeline:show-dropdown', handleTimelineShowDropdown)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)

  if (maximizedWidget.value) {
    maximizedWidget.value = null
    document.body.style.overflow = ''
  }
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (maximizedWidget.value) {
      maximizedWidget.value = null
      document.body.style.overflow = ''
    }
  }
}

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

const navigateToTrades = () => {
  router.push('/trades')
}

const navigateToTransfers = () => {
  router.push('/transfers')
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
/**
 * Automatic resize grid based on content height
 */
function debounce(fn, delay) {
  let timer: number | undefined
  return (...args) => {
    clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), delay)
  }
}

const resizeObservers = ref<Record<string, ResizeObserver>>({})

watch(windowColumns, (cols) => {
  nextTick(() => {
    cols.forEach(col => {
      const el = gridstackRef.value?.querySelector(`[data-gs-id="${col.id}"] .grid-stack-item-content .dashboard-container`)
      if (el && !resizeObservers.value[col.id]) {
        const debouncedResize = debounce((entry, gridItem, cellHeight) => {
          if (gridInstance.value) {
            const newHeight = Math.ceil(entry.contentRect.height / cellHeight)
            const node = gridInstance.value.engine.nodes.find(n => n.el === gridItem)
            if (node && newHeight > 0 && node.h !== newHeight) {
              gridInstance.value.update(gridItem, { h: newHeight })
              gridInstance.value.compact()
            }
          }
        }, 100) // 100ms debounce

        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            const gridItem = entry.target.closest('.grid-stack-item')
            if (gridItem && gridInstance.value) {
              const cellHeight = gridInstance.value.opts.cellHeight as number
              debouncedResize(entry, gridItem, cellHeight)
            }
          }
        })
        observer.observe(el)
        resizeObservers.value[col.id] = observer
      }
    })
  })
}, { immediate: true })

onUnmounted(() => {
  // Disconnect all observers
  Object.values(resizeObservers.value).forEach(obs => obs.disconnect())
  resizeObservers.value = {}
})

// List of available grid types
const gridTypes = [
  { id: 'summary', title: 'Summary', component: Summary },
  { id: 'positions', title: 'Positions', component: Positions },
  { id: 'thesis', title: 'Thesis', component: Thesis },
  { id: 'tasks', title: 'Tasks', component: Tasks },
  { id: 'trades', title: 'Trades', component: Trades },
  { id: 'transfers', title: 'Transfers', component: Transfers },
  { id: 'cashTransactions', title: 'Cash Transactions', component: CashTransactions },
  { id: 'aiTimelineCard', title: 'aiTimelineCard', component: aiAnalyseTimelineConversationCard }
]

// Add a new grid instance
function addGrid(typeId: string) {
  const type = gridTypes.find(t => t.id === typeId)
  if (!type) return
  const count = columns.value.filter(c => c.id.startsWith(typeId)).length + 1
  const newId = `${typeId}_${count}`
  const windowId = `window_${count}`
  columns.value.push({
    id: newId,
    title: `${type.title} ${count}`,
    content: '',
    component: type.component,
    window: windowId
  })
  componentModes.value[newId] = 'window'
  nextTick(() => {
    if (gridInstance.value) {
      const pos = getNextAvailablePosition(gridInstance.value)
      const el = gridstackRef.value?.querySelector(`[data-gs-id="${newId}"]`)
      if (el) {
        gridInstance.value.makeWidget(el, { x: pos.x, y: pos.y, width: 1, height: 5 })
        saveGridLayout()
      }
    }
  })
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

    <div class="dashboard-topbar">
      <div class="tabs-bar" style="background: none;border: none;box-shadow: none;padding: 0;">
        <!--<span class="tabs-label">Minimized:</span>
        <button
          v-for="column in tabColumns"
          :key="`tab-${column.id}`"
          @click="handleRestore(column.id)"
          class="app-tab"
          :title="`Click to restore ${column.title} app`"
        >
          {{ column.title }}
        </button>-->
      </div>
      <!-- Add grid dropdown -->
      <div class="add-grid-dropdown">
        <button class="add-grid-icon-btn" @click="showAddGridMenu = !showAddGridMenu" title="Add Grid">
          <svg width="24" height="24" fill="none">
            <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <div v-if="showAddGridMenu" class="add-grid-menu">
          <button
            v-for="type in gridTypes"
            :key="type.id"
            @click="addGrid(type.id); showAddGridMenu = false"
            class="add-grid-menu-item"
          >
            {{ type.title }}
          </button>
        </div>
      </div>
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
                <!-- Render by type, pass window prop as column.id -->
                <component
                  :is="column.component"
                  v-bind="{
                    window: column.window,
                    accountId: 'demo',
                    showHeaderLink: true,
                    userId: currentUserId
                  }"
                  @minimize="handleMinimize(column.id)"
                  @maximize="toggleMaximize(column.id)"
                  @navigate="column.id.startsWith('thesis') ? navigateToThesis : column.id.startsWith('tasks') ? navigateToTasks : column.id.startsWith('trades') ? navigateToTrades : column.id.startsWith('transfers') ? navigateToTransfers : undefined"
                />
              </section>
            </div>
          </div>
        </template>
      </div>
    </div>
    <!-- Overlay maximized view (renders the same component in a top layer) -->
    <div v-if="maximizedWidget" class="overlay" role="dialog" aria-modal="true">
      <div class="overlay-frame">
        <div class="overlay-actions">
          <button class="overlay-close-btn" @click="restoreMaximized(maximizedWidget)">Close</button>
        </div>
       <div class="overlay-content">
          <component
            :is="columns.find(c => c.id === maximizedWidget)?.component"
            v-if="columns.find(c => c.id === maximizedWidget)"
            v-bind="{
              window: columns.find(c => c.id === maximizedWidget)?.window,
              accountId: 'demo',
              showHeaderLink: true,
              userId: currentUserId
            }"
            @minimize="restoreMaximized(maximizedWidget)"
            @navigate="() => {}"
          />
        </div>
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

.add-grid-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.add-grid-btn {
  padding: 0.25rem 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.add-grid-btn:hover {
  background: #1d4ed8;
}

.tabs-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
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
  min-height:50px !important;
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
.dashboard-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  /*padding: 0.25rem 0.75rem;*/
  background: #f3f4f6;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.tabs-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.add-grid-dropdown {
  position: absolute;
  top: 25px;
  right: 25px;
  z-index: 1050;
}

.add-grid-icon-btn {
  background: #2563eb;
  border: none;
  border-radius: 50%;
  padding: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}
.add-grid-icon-btn:hover {
  background: #1d4ed8;
}

.add-grid-menu {
  position: absolute;
  top: 120%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  min-width: 160px;
  z-index: 10;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
}
.add-grid-menu-item {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  text-align: left;
  font-size: 0.95rem;
  color: #2563eb;
  cursor: pointer;
  transition: background 0.2s;
}
.add-grid-icon-btn svg {
  display: block;
  stroke: white;
}
.add-grid-menu-item:hover {
  background: #f3f4f6;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 2200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0.5rem;
  box-sizing: border-box;
}

.overlay-frame {
  width: 100%;
  /*max-width: 1200px;*/
  height: calc(100% - 4rem);
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(2,6,23,0.4);
}

.overlay-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem;
  background: rgba(0,0,0,0.02);
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.overlay-close-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  width: auto;
}

.overlay-content {
  padding: 1rem;
  height: 100%;
  overflow: auto;
  background: transparent;
}
</style>