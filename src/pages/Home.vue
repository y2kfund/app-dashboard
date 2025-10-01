<script setup lang="ts">
import { ref, computed, watch, onMounted, provide } from 'vue'
import { Positions } from '@y2kfund/positions'
import { Summary } from '@y2kfund/summary'
import '@y2kfund/positions/dist/style.css'
import '@y2kfund/summary/dist/style.css'

// Simple event bus
const eventBus = {
  events: {},
  emit(event: string, data: any) {
    if (this.events[event]) {
      this.events[event].forEach((callback: Function) => callback(data));
    }
  },
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb: Function) => cb !== callback);
    }
  }
};

// Provide the event bus to child components
provide('eventBus', eventBus);

interface Column {
  id: string
  title: string
  content: string
  component?: any
}

const columns = ref<Column[]>([
  { id: 'summary', title: 'Summary', content: '', component: Summary },
  { id: 'positions', title: 'Positions', content: '', component: Positions }
])

const hiddenApps = ref<Set<string>>(new Set())

// Computed properties
const visibleColumns = computed(() => 
  columns.value.filter(col => !hiddenApps.value.has(col.id))
)

const hiddenAppsList = computed(() => 
  columns.value.filter(col => hiddenApps.value.has(col.id))
)

// URL query parameter management
const updateUrlParams = () => {
  const url = new URL(window.location.href)
  if (hiddenApps.value.size > 0) {
    url.searchParams.set('hiddenApps', Array.from(hiddenApps.value).join(','))
  } else {
    url.searchParams.delete('hiddenApps')
  }
  window.history.replaceState({}, '', url.toString())
}

const loadFromUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const hiddenAppNamesParam = urlParams.get('hiddenApps')
  if (hiddenAppNamesParam) {
    hiddenApps.value = new Set(hiddenAppNamesParam.split(',').filter(id => 
      columns.value.some(col => col.id === id)
    ))
  }
}

// Column visibility methods
const hideColumn = (columnId: string) => {
  hiddenApps.value.add(columnId)
}

const showColumn = (columnId: string) => {
  hiddenApps.value.delete(columnId)
}

// Watch for changes and update URL
watch(hiddenApps, updateUrlParams, { deep: true })

// Initialize on mount
onMounted(() => {
  loadFromUrlParams()
})
</script>

<template>
  <main class="dashboard">
    <!-- Hidden apps tags -->
    <div v-if="hiddenAppsList.length > 0" class="hidden-apps-bar">
      <span class="hidden-apps-label">Hidden apps:</span>
      <button
        v-for="column in hiddenAppsList"
        :key="`hidden-${column.id}`"
        @click="showColumn(column.id)"
        class="hidden-app-tag"
        :title="`Click to show ${column.title} app`"
      >
        {{ column.title }}
      </button>
    </div>

    <div class="dashboard-grid">
      <div 
        v-for="column in visibleColumns" 
        :key="column.id"
        class="dashboard-column"
      >
        <section class="card">
          <div class="card-header">
            <h1 v-if="column.id === 'summary'" class="card-title">Summary</h1>
            <h2 v-else class="card-title">{{ column.title }}</h2>
            <button 
              @click="hideColumn(column.id)"
              class="hide-button"
              :title="`Hide ${column.title} app`"
            >
              −
            </button>
          </div>

          <!-- Summary content -->
          <template v-if="column.id === 'summary'">
            <Summary :show-header-link="true" />
          </template>
          
          <!-- Positions component -->
          <template v-else-if="column.id === 'positions'">
            <Positions accountId="demo" :show-header-link="true" />
          </template>
          
          <!-- Other column content -->
          <template v-else>
            <p>{{ column.content }}</p>
          </template>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 1rem;
  background-color: #f8fafc;
}

.hidden-apps-bar {
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

.hidden-apps-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.hidden-app-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.hidden-app-tag:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.restore-icon {
  font-size: 0.75rem;
  color: #6b7280;
}

.dashboard-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 1.5rem;
  margin: 0 auto;
}

.dashboard-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: fit-content;
  align-items: stretch;
}

.card {
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(0,0,0,.1);
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  background: white;
  height: fit-content;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.card-title {
  margin: 0;
  color: #1f2937;
}

h1.card-title { 
  font-size: 1.6rem; 
}

h2.card-title {
  font-size: 1.4rem;
}

.hide-button {
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  color: #6b7280;
  transition: all 0.2s;
  flex-shrink: 0;
}

.hide-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
  transform: scale(1.05);
}

.hide-button:active {
  transform: scale(0.95);
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
  
  .hidden-apps-bar {
    flex-wrap: wrap;
  }
}
</style>