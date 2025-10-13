<script setup lang="ts">
import { Thesis } from '@y2kfund/thesis'
import '@y2kfund/thesis/dist/style.css'
import { useAuth } from '../composables/useAuth'
import { computed } from 'vue'

// Get current user
const { user } = useAuth()

// Computed property for current user ID
const currentUserId = computed(() => user.value?.id || null)
</script>

<template>
  <main class="thesis-app">
    <div class="thesis-app-content">
      <Thesis 
        :user-id="currentUserId"
        :show-header-link="false"
      />
    </div>
  </main>
</template>

<style scoped>
.thesis-app {
  min-height: 100vh;
  padding: 1rem;
  background-color: #f8fafc;
}

.thesis-app-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(0,0,0,.1);
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  background: white;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .thesis-app {
    padding: 0.5rem;
  }
  
  .thesis-app-content {
    padding: 1rem;
  }
}
</style>