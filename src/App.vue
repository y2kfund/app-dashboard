<script setup lang="ts">
import { Positions } from '@y2kfund/positions'
import '@y2kfund/positions/dist/style.css'
</script>

<template>
  <main class="dashboard">
    <div class="dashboard-grid">
      <!-- Column 1: Welcome Card -->
      <div class="dashboard-column">
        <section class="card">
          <h1>Welcome to the dashboard</h1>
          <p>This is a minimal Vue 3 app.</p>
        </section>
      </div>
      
      <!-- Column 2: Positions -->
      <div class="dashboard-column">
        <Positions accountId="1" />
      </div>
      
      <!-- Column 3: Placeholder for future content -->
      <div class="dashboard-column">
        <section class="card">
          <h2>Analytics</h2>
          <p>Analytics data will be displayed here.</p>
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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

h1 { 
  margin: 0 0 .5rem 0; 
  font-size: 1.6rem; 
  color: #1f2937;
}

h2 {
  margin: 0 0 .5rem 0;
  font-size: 1.4rem;
  color: #1f2937;
}

p { 
  margin: 0; 
  color: #6b7280; 
  line-height: 1.5;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard {
    padding: 0.5rem;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (min-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
