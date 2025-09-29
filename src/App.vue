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
      <header class="app-header">
        <div class="header-content">
          <h1>Y2K Fund Dashboard</h1>
          <div class="user-menu">
            <span>Welcome, {{ user?.email }}</span>
            <button @click="signOut" class="sign-out-btn">Sign Out</button>
          </div>
        </div>
      </header>
      
      <main class="app-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AuthWrapper from './components/auth/AuthWrapper.vue'
import { useAuth } from './composables/useAuth'

const { user, isAuthenticated, loading: authLoading, signOut } = useAuth()
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

.app-header {
  background: var(--surface-color, #ffffff);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  padding: 1rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  color: var(--text-color, #111827);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sign-out-btn {
  padding: 0.5rem 1rem;
  background: var(--error-color, #dc2626);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sign-out-btn:hover {
  background: var(--error-color-dark, #b91c1c);
}

.app-main {
  flex: 1;
  padding: 2rem;
  margin: 0 auto;
  width: 100%;
}
</style>
