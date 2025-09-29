<template>
  <div class="auth-form">
    <!-- Y2K Fund Gradient Logo -->
    <div class="logo-container">
      <div class="logo">
        <div class="logo-text">
          <span class="y2k">Y2K</span>
          <span class="fund">FUND</span>
        </div>
        <div class="logo-tagline">Investment Dashboard</div>
      </div>
    </div>

    <!-- Reset Password Form -->
    <form @submit.prevent="handleResetPassword" class="reset-form">
      <div class="form-header">
        <h2>Reset Your Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
      </div>
      
      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="Enter your email"
          required
          :disabled="loading"
        />
      </div>
      
      <button type="submit" :disabled="loading || !email.trim()" class="primary-button">
        {{ loading ? 'Sending Reset Link...' : 'Send Reset Link' }}
      </button>
      
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
    </form>
    
    <div class="auth-links">
      <button @click="$emit('switch-mode', 'login')" class="link-button">
        <strong>← Back to Sign In</strong>
      </button>
      <button @click="$emit('switch-mode', 'signup')" class="link-button">
        Don't have an account? <strong>Sign Up</strong>
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
  if (!email.value.trim()) {
    error.value = 'Please enter your email address'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const { error: authError } = await resetPassword(email.value)
    
    if (authError) {
      error.value = authError.message
    } else {
      success.value = 'Password reset link has been sent to your email. Please check your inbox.'
      email.value = ''
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style>
@import '../../assets/styles/logo.css';
@import '../../assets/styles/auth-form.css';

.auth-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 8px;
  background: var(--surface-color, #ffffff);
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-text {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
}

.y2k {
  color: var(--primary-color, #3b82f6);
}

.fund {
  color: var(--secondary-color, #9333ea);
}

.logo-tagline {
  font-size: 1rem;
  color: #64748b;
  margin-top: 0.5rem;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.form-header p {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
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