<script setup lang="ts">
import { Tasks } from '@y2kfund/tasks'
import '@y2kfund/tasks/dist/style.css'
import { useAuth } from '../composables/useAuth'
import { computed } from 'vue'

// Get current user
const { user } = useAuth()

// Computed property for current user ID
const currentUserId = computed(() => user.value?.id || 'default-user')

function handleMinimize() {
  console.log('Task minimized')
}

function handleNavigate() {
  console.log('Task navigation clicked')
}
</script>

<template>
  <div class="tasks-app">
    <!--header class="app-header">
      <h1>Tasks</h1>
      <nav class="breadcrumb">
        <router-link to="/">Dashboard</router-link> / Tasks
      </nav>
    </header-->
    <main class="app-content">
      <Tasks 
        :user-id="currentUserId"
        :show-header-link="false"
        @minimize="handleMinimize"
        @navigate="handleNavigate"
      />
    </main>
  </div>
</template>

<style scoped>
.tasks-app {
  min-height: 100vh;
  background: #f8f9fa;
}

.app-header {
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #dee2e6;
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #212529;
}

.breadcrumb {
  font-size: 0.875rem;
  color: #6c757d;
}

.breadcrumb a {
  color: #007bff;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.app-content {
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }
  
  .app-content {
    padding: 1rem;
  }
}
</style>