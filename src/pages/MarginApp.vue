<script setup lang="ts">
import { Margin } from '@y2kfund/margin'
import '@y2kfund/margin/dist/style.css'

interface Props {
  accountId?: string
}

const props = withDefaults(defineProps<Props>(), {
  accountId: 'demo'
})
</script>

<template>
  <div class="margin-app">
    <header class="app-header">
      <h1>Margin</h1>
      <nav class="breadcrumb">
        <router-link to="/">Dashboard</router-link> / Margin
      </nav>
    </header>
    <main class="app-content">
      <Margin :account-id="accountId" />
    </main>
  </div>
</template>

<style scoped>
.margin-app {
  min-height: 100vh;
  background: #f8f9fa;
}

.app-header {
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #dee2e6;
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.breadcrumb {
  font-size: 0.875rem;
  color: #6c757d;
}

.breadcrumb a {
  color: #007bff;
  text-decoration: none;
}

.app-content {
  padding: 2rem;
}
</style>