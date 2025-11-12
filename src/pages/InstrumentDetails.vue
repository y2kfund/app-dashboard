<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { putPositions } from '@y2kfund/put-positions-for-single-instrument'
import { callPositions } from '@y2kfund/call-positions-for-single-instrument'
import { currentPositions } from '@y2kfund/current-positions-for-single-instrument'
import '@y2kfund/call-positions-for-single-instrument/dist/style.css'
import '@y2kfund/put-positions-for-single-instrument/dist/style.css'
import '@y2kfund/current-positions-for-single-instrument/dist/style.css'
import { useAuth } from '../composables/useAuth'

const { user } = useAuth()
const route = useRoute()

const currentUserId = computed(() => user.value?.id || undefined)
const symbolRoot = computed(() => (route.params.symbolRoot as string) || '')

</script>

<template>
  <div class="instrument-details-app">
    <main class="app-content">
      <div class="content-layout">
        <!-- Left Section - Positions -->
        <div class="instrument-details-container">

          <!-- Current Positions Section -->
          <section class="positions-section">
            <currentPositions 
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
        </div>

        <!-- Right Section - AI Recommendations -->
        <aside class="ai-sidebar">
          <div class="ai-recommendation-box">
            <h2>AI Recommendation</h2>
            <div class="ai-content">
              <p>AI-powered recommendations will appear here.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.instrument-details-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
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
  gap: 1.5rem;
  height: 100%;
}

.instrument-details-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.positions-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.ai-sidebar {
  width: 450px;
  flex-shrink: 0;
  overflow-y: auto;
}

.ai-recommendation-box {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  position: sticky;
  top: 0;
}

.ai-recommendation-box h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

.ai-content {
  color: #6c757d;
  font-size: 0.875rem;
  line-height: 1.6;
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

  .ai-recommendation-box {
    position: static;
  }
}
</style>