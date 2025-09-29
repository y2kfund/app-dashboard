<template>
  <div class="auth-form">
    <h2>Reset Password</h2>
    <form @submit.prevent="handleResetPassword">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          :disabled="loading"
          placeholder="Enter your email address"
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Sending...' : 'Send Reset Link' }}
      </button>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
    </form>
    
    <div class="auth-links">
      <button @click="$emit('switch-mode', 'login')" class="link-button">
        Back to Sign In
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../../composables/useAuth'

defineEmits<{
  'switch-mode': [mode: 'login' | 'signup' | 'forgot-password']
}>()

const { resetPassword } = useAuth()
const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleResetPassword() {
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const { error: authError } = await resetPassword(email.value)
    
    if (authError) {
      error.value = authError.message
    } else {
      success.value = 'Password reset link sent! Check your email.'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 8px;
  background: var(--surface-color, #ffffff);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color, #374151);
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 2px var(--primary-color-alpha, rgba(59, 130, 246, 0.1));
}

button {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background: var(--primary-color-dark, #2563eb);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link-button {
  background: none;
  color: var(--primary-color, #3b82f6);
  border: none;
  cursor: pointer;
  text-decoration: underline;
  width: auto;
  padding: 0;
}

.error {
  margin-top: 1rem;
  color: var(--error-color, #dc2626);
  font-size: 0.875rem;
}

.success {
  margin-top: 1rem;
  color: var(--success-color, #059669);
  font-size: 0.875rem;
}

.auth-links {
  margin-top: 1rem;
  text-align: center;
}
</style>