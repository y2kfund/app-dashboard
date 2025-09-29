import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import './assets/styles/logo.css'
import './assets/styles/auth-form.css'
import { createCore } from '@y2kfund/core'

async function initializeApp() {
  try {
    // Check for required environment variables
    const supabaseUrl = import.meta.env.VITE_SUPA_URL
    const supabaseAnon = import.meta.env.VITE_SUPA_ANON

    if (!supabaseUrl || !supabaseAnon) {
      throw new Error('Missing required environment variables: VITE_SUPA_URL and VITE_SUPA_ANON must be set in .env file')
    }

    // Initialize app-core with Supabase and TanStack Query
    const core = await createCore({
      supabaseUrl,
      supabaseAnon,
      idb: { databaseName: 'y2k-cache', storeName: 'tanstack' },
      query: { 
        staleTime: 60_000, 
        gcTime: 86_400_000, 
        refetchOnWindowFocus: false 
      },
      buster: 'v1'
    })

    // Create and mount the app with app-core plugin
    createApp(App)
      .use(core)
      .use(router)  // Add router here
      .mount('#app')

    console.log('✅ Dashboard initialized successfully with app-core')

  } catch (error) {
    console.error('Failed to initialize dashboard:', error)
    
    // Show error message in the DOM
    const app = document.getElementById('app')
    if (app) {
      app.innerHTML = `
        <div style="padding: 2rem; background: #f8d7da; color: #721c24; border-radius: 0.5rem; margin: 1rem;">
          <h2>Dashboard Setup Error</h2>
          <p>Failed to initialize app-core: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <div style="margin: 1rem 0;">
            <h3>Setup Required:</h3>
            <ul style="text-align: left;">
              <li>❓ Create .env file with VITE_SUPA_URL and VITE_SUPA_ANON</li>
              <li>❓ Is Supabase running locally?</li>
            </ul>
          </div>
        </div>
      `
    }
  }
}

initializeApp()
