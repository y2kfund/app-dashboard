<script setup lang="ts">
import { computed, watch, ref, provide } from 'vue'
import { useRoute } from 'vue-router'
import { putPositions } from '@y2kfund/put-positions-for-single-instrument'
import { callPositions } from '@y2kfund/call-positions-for-single-instrument'
import { currentPositions } from '@y2kfund/current-positions-for-single-instrument'
import { AiReccomendations } from '@y2kfund/ai-recommendations-for-single-instrument'
import { InstrumentInsight } from '@y2kfund/instrument-insights'
import { Trades } from '@y2kfund/all-trades-for-single-instruments'
import { TasksForSingleInstrument } from '@y2kfund/tasks-for-single-instruments'
import '@y2kfund/call-positions-for-single-instrument/dist/style.css'
import '@y2kfund/put-positions-for-single-instrument/dist/style.css'
import '@y2kfund/current-positions-for-single-instrument/dist/style.css'
import '@y2kfund/ai-recommendations-for-single-instrument/dist/style.css'
import '@y2kfund/instrument-insights/dist/style.css'
import '@y2kfund/all-trades-for-single-instruments/dist/style.css'
import '@y2kfund/tasks-for-single-instruments/dist/style.css'
import { useAuth } from '../composables/useAuth'
import { eventBus } from '../utils/eventBus'

const { user } = useAuth()
const route = useRoute()

const currentUserId = computed(() => user.value?.id || undefined)
const symbolRoot = computed(() => (route.params.symbolRoot as string) || '')
const showAISidebar = ref(false)

provide('eventBus', eventBus);

const totalCapitalUsed = ref(null)
function handleCapitalUsedChanged(val) {
  totalCapitalUsed.value = val
  console.log('Total Capital Used updated in InstrumentDetails:', val)
}

// Update document title when symbolRoot changes
/*watch(symbolRoot, (newSymbol) => {
  if (newSymbol) {
    document.title = `${newSymbol} - analysis of current positions | Y2K Fund`
  } else {
    document.title = 'Instrument analysis of current positions | Y2K Fund'
  }
}, { immediate: true })*/

watch([symbolRoot, totalCapitalUsed], ([newSymbol, capital]) => {
  const capitalText = capital !== null ? `Capital Used: $${totalCapitalUsed.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ''
  if (newSymbol) {
    document.title = `${newSymbol} - ${capitalText} | Y2K Fund`
  } else {
    document.title = `${capitalText} | Y2K Fund`
  }
}, { immediate: true })
</script>

<template>
  <div class="instrument-details-app">
    <main class="app-content">
      <div class="content-layout">
        <!-- Left Section - Positions -->
        <div 
          class="instrument-details-container"
          :class="{ 'full-width': !showAISidebar }"
        >

          <!-- Current Positions Section -->
          <section class="positions-section">
            <currentPositions 
              v-if="symbolRoot"
              :symbol-root="symbolRoot"
              :user-id="currentUserId"
              @capitalUsedChanged="handleCapitalUsedChanged"
            />
          </section>

          <!-- Instrument Insight Section -->
          <section class="positions-section">
            <InstrumentInsight 
              v-if="symbolRoot"
              :symbol-root="symbolRoot"
              :user-id="currentUserId"
            />
          </section>

          <section class="positions-section">
            <TasksForSingleInstrument 
              v-if="symbolRoot"
              :symbol-root="symbolRoot"
              :user-id="currentUserId"
            />
          </section>

          <!-- Put Positions Section -->
          <section class="positions-section">
            <putPositions 
              v-if="symbolRoot"
              :symbol-root="symbolRoot"
              :user-id="currentUserId"
            />
          </section>

          <!-- Call Positions Section -->
          <section class="positions-section">
            <callPositions 
              v-if="symbolRoot"
              :symbol-root="symbolRoot"
              :user-id="currentUserId"
            />
          </section>

           <section class="positions-section">
            <Trades 
              v-if="symbolRoot" 
              account-id="demo"
              :symbol-root="symbolRoot"
              :user-id="currentUserId"
            />
          </section>
        </div>

        <!-- Right Section - AI Recommendations -->
        <aside 
          v-if="showAISidebar"
          class="ai-sidebar"
        >
          <AiReccomendations 
            v-if="symbolRoot"
            :symbol-root="symbolRoot"
            :user-id="currentUserId"
          />
        </aside>
      </div>
      <!-- Floating Chat Icon -->
      <button 
        class="chat-float-btn"
        @click="showAISidebar = !showAISidebar"
        aria-label="Toggle AI Recommendations"
      >
        <span v-if="showAISidebar" style="color: #fff;">X</span>
        <span v-else>💬</span>
      </button>
    </main>
  </div>
</template>

<style scoped>
.instrument-details-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
}

.app-header {
  margin-bottom: 1.5rem;
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.75rem;
}

.app-content {
  flex: 1;
  overflow: hidden;
}

.content-layout {
  display: flex;
  gap: 0.25rem;
  height: 100%;
}

.instrument-details-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.instrument-details-container.full-width {
  flex: 1 1 100%;
  max-width: 100%;
}

.positions-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.25rem;
}

.ai-sidebar {
  min-width: 450px;
  max-width: 35%;
  flex-shrink: 0;
  overflow-y: auto;
  transition: all 0.3s;
}

.chat-float-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
  background: #2c3e50;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  font-size: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.chat-float-btn:hover {
  background: #34495e;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .content-layout {
    flex-direction: column;
  }
  .ai-sidebar {
    width: 100%;
    order: -1;
  }
  .instrument-details-container.full-width {
    max-width: 100%;
  }
}
</style>