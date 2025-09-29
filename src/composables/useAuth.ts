import { ref, computed, onMounted } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { useSupabase } from '@y2kfund/core'

const user = ref<User | null>(null)
const session = ref<Session | null>(null)
const loading = ref(true)

export function useAuth() {
  const supabase = useSupabase()

  const isAuthenticated = computed(() => !!user.value)

  // Get the current origin for redirects (like your reference app)
  const getRedirectUrl = () => {
    return `${window.location.origin}/auth/callback`
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    }
  }

  async function signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl()
      }
    })
    return { data, error }
  }

  async function signInWithOAuth(provider: 'google' | 'github') {
    const redirectTo = getRedirectUrl()
    const currentUrl = window.location.href
    
    console.log('[OAuth] Starting login with provider:', provider)
    console.log('[OAuth] Redirect URL:', redirectTo)
    console.log('[OAuth] Current URL:', currentUrl)
    console.log('[OAuth] Current origin:', window.location.origin)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo,
        queryParams: {
          redirect_origin: currentUrl
        }
      }
    })
    
    if (!error) {
      // Store current URL for redirect after OAuth (like your reference app)
      const redirectUrl = currentUrl || window.location.href
      sessionStorage.setItem('post-login-redirect', redirectUrl)
      localStorage.setItem('post-login-redirect', redirectUrl) // Backup in localStorage
      console.log('[OAuth] Stored redirect URL:', redirectUrl)
    }
    
    return { data, error }
  }

  async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPassword({
      email,
      options: {
        redirectTo: `${window.location.origin}/reset-password`
      }
    })
    return { data, error }
  }

  // Initialize auth state and set up listener
  onMounted(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      session.value = initialSession
      user.value = initialSession?.user ?? null
      loading.value = false
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
        loading.value = false
        
        console.log('Auth state changed:', event, newSession?.user?.email)
        
        // Handle auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', user.value?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery initiated')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        }
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  })

  return {
    user: computed(() => user.value),
    session: computed(() => session.value),
    isAuthenticated,
    loading: computed(() => loading.value),
    signOut,
    signInWithPassword,
    signInWithOAuth,
    signUp,
    resetPassword,
  }
}