<script setup lang="ts">
import { Positions } from '@y2kfund/positions'
import '@y2kfund/positions/dist/style.css'
</script>

<template>
  <main class="wrapper">
    <section class="card">
      <h1>Welcome to the dashboard</h1>
      <p>This is a minimal Vue 3 app.</p>
    </section>
    
    <!-- Positions component from published package -->
    <Positions accountId="1" />
  </main>
</template>

<style scoped>
.card {
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(0,0,0,.1);
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  background: white;
}
h1 { margin: 0 0 .5rem 0; font-size: 1.6rem; }
p { margin: 0; color: #444; }
</style>
