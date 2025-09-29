<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <!--div class="auth-header">
        <h1>Y2K Fund Dashboard</h1>
        <p v-if="mode === 'login'">Please sign in to access your dashboard</p>
        <p v-else-if="mode === 'signup'">Create your account to get started</p>
        <p v-else-if="mode === 'forgot-password'">Reset your password</p>
      </div-->
      
      <LoginForm v-if="mode === 'login'" @switch-mode="mode = $event" />
      <SignupForm v-else-if="mode === 'signup'" @switch-mode="mode = $event" />
      <ForgotPasswordForm v-else-if="mode === 'forgot-password'" @switch-mode="mode = $event" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoginForm from './LoginForm.vue'
import SignupForm from './SignupForm.vue'
import ForgotPasswordForm from './ForgotPasswordForm.vue'

const mode = ref<'login' | 'signup' | 'forgot-password'>('login')
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-color, #f9fafb);
}

.auth-container {
  width: 100%;
  max-width: 600px;
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  color: var(--text-color, #111827);
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: var(--text-secondary, #6b7280);
}
</style>