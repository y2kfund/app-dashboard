<template>
  <div class="auth-callback">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Completing authentication...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabase } from '@y2kfund/core'

const router = useRouter()
const supabase = useSupabase()

onMounted(async () => {
  try {
    console.log('[AuthCallback] Processing auth callback')
    
    // Handle the auth callback
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[AuthCallback] Error:', error)
      router.push('/')
      return
    }

    if (data.session) {
      console.log('[AuthCallback] Session found, user authenticated')
      
      // Get redirect URL from storage
      const redirectUrl = sessionStorage.getItem('post-login-redirect') || 
                         localStorage.getItem('post-login-redirect') || 
                         '/'
      
      console.log('[AuthCallback] Redirecting to:', redirectUrl)
      
      // Clean up stored redirect URL
      sessionStorage.removeItem('post-login-redirect')
      localStorage.removeItem('post-login-redirect')
      
      // If redirectUrl is external (different origin), use window.location
      if (redirectUrl.startsWith('http') && !redirectUrl.startsWith(window.location.origin)) {
        window.location.href = redirectUrl
      } else {
        // Use router for internal navigation
        const path = redirectUrl.startsWith(window.location.origin) 
          ? redirectUrl.replace(window.location.origin, '') 
          : redirectUrl
        router.push(path || '/')
      }
    } else {
      console.log('[AuthCallback] No session found')
      router.push('/')
    }
  } catch (error) {
    console.error('[AuthCallback] Unexpected error:', error)
    router.push('/')
  }
})
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-color, #f9fafb);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color, #e1e5e9);
  border-top: 4px solid var(--primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>