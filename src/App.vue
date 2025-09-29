<template>
  <div id="app">
    <!-- Show loading state while checking auth -->
    <div v-if="authLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Show auth forms if not authenticated -->
    <AuthWrapper v-else-if="!isAuthenticated" />

    <!-- Show main app if authenticated -->
    <div v-else class="app-layout">
      <AppHeader />
      
      <main class="app-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AuthWrapper from './components/auth/AuthWrapper.vue'
import AppHeader from './components/AppHeader.vue'
import { useAuth } from './composables/useAuth'

const { isAuthenticated, loading: authLoading } = useAuth()
</script>

<style scoped>
.loading-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--background-color, #f9fafb);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color, #e1e5e9);
  border-top: 4px solid var(--primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  padding: 0;
  margin: 0 auto;
  width: 100%;
}
</style>
