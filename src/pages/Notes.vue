<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { AiReccomendations } from '@y2kfund/ai-recommendations-for-single-instrument'
import '@y2kfund/ai-recommendations-for-single-instrument/dist/style.css'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const { user } = useAuth()

const noteId = route.params.noteId as string
const pageTitle = ref('Notes')

// Set document title
onMounted(() => {
  document.title = `Notes | Y2K Fund`
})

const handleSelectedEntryUpdate = (entry: any) => {
  if (entry?.title) {
    pageTitle.value = entry.title
    document.title = `${entry.title} | Notes | Y2K Fund`
  } else {
    pageTitle.value = 'Notes'
    document.title = `Notes | Y2K Fund`
  }
}
</script>

<template>
  <div class="risk-management-app">
    <main class="app-content">
      <div class="content-layout">
        <AiReccomendations 
            :symbol-root="`NotePage`"
            :user-id="user?.id"
            :note-id="noteId"
            @update:selected-entry="handleSelectedEntryUpdate"
          />
      </div>
    </main>
  </div>
</template>

<style scoped>

</style>
