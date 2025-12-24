<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { AiReccomendations } from '@y2kfund/ai-recommendations-for-single-instrument'
import '@y2kfund/ai-recommendations-for-single-instrument/dist/style.css'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const { user } = useAuth()

const noteId = route.params.noteId as string
</script>

<template>
  <div class="risk-management-app">
    <main class="app-content">
      <div class="content-layout">
        <AiReccomendations 
            :symbol-root="`NotePage`"
            :user-id="user?.id"
            :note-id="noteId"
          />
      </div>
    </main>
  </div>
</template>

<style scoped>

</style>
