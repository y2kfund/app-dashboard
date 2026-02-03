<template>
  <div class="analysis-page">
    <div class="header-section">
      <div class="header-content">
        <h2>AI Analysis</h2>
        <button @click="openNewAnalysisModal" class="btn-primary new-analysis-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Manage Prompts
        </button>
      </div>
    </div>

    <div class="analysis-container">
      <!-- Left Sidebar: Report List -->
      <div class="report-list">
        <div v-if="isLoadingReports" class="loading-state">Loading reports...</div>
        <div v-else-if="!reports || reports.length === 0" class="empty-list">No reports yet</div>
        <template v-else>
          <div v-for="(group, dateKey) in groupedReports" :key="dateKey" class="report-group">
            <div class="group-header">-- {{ dateKey }} --</div>
            <div 
              v-for="report in group" 
              :key="report.id" 
              class="report-item" 
              :class="{ active: selectedReportId === report.id }"
              @click="selectReport(report.id)"
            >
              <div class="report-item-header">
                <div class="header-left">
                  <h4 class="report-title">{{ report.prompt_title }}</h4>
                </div>
                <div class="header-right">
                  <span class="report-date">{{ formatTimeOnly(report.created_at) }}</span>
                  <button @click.stop="deleteReport(report.id)" class="delete-report-btn" title="Delete Report">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <p class="report-preview">{{ report.llm_response_summary }}</p>
            </div>
          </div>
        </template>
      </div>

      <!-- Right Content: Detailed Report -->
      <div class="report-content">
        <div v-if="selectedReport" class="report-detail">
          <div class="detail-header">
            <h3>{{ selectedReport.prompt_title }}</h3>
            <div class="detail-meta">
              <span @click="showPayloadModal = true" class="btn-payload">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </span>
              <span class="detail-date">{{ formatDate(selectedReport.created_at) }}</span>
            </div>
          </div>
          <div class="detail-body" v-html="renderMarkdown(selectedReport.llm_response_content)"></div>
        </div>
        <div v-else class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" color="#ccc">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          <p>Select a report to view details</p>
        </div>
      </div>
    </div>

    <!-- Configure Analysis Modal (Prompt Manager) -->
    <div v-if="showModal" class="modal-backdrop" @click="closeModal">
      <div class="modal-content modal-lg" @click.stop>
        <div class="modal-header">
          <h3>Configure Analysis & Prompts</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          
          <!-- Add New Prompt Form -->
          <div class="add-prompt-section">
            <h4>Add New Prompt</h4>
            <div class="form-grid">
              <div class="form-group full-width relative">
                <label>Title</label>
                <input v-model="newPrompt.title" type="text" placeholder="e.g. Daily Risk Check" />
              </div>
              <div class="form-group">
                <label>Schedule Time (UTC)</label>
                <input v-model="newPrompt.schedule_time" type="time" />
              </div>
              
              <div class="form-row-flex">
                <!-- Days to Run -->
                <div class="form-group relative">
                  <label>Days to Run</label>
                  <div class="custom-select-trigger" @click="showNewPromptDayDropdown = !showNewPromptDayDropdown">
                     {{ formatDays(newPrompt.schedule_days) }}
                     <span class="arrow">▼</span>
                  </div>
                  
                  <div v-if="showNewPromptDayDropdown" class="custom-select-dropdown">
                    <!-- All Days Option -->
                    <label class="dropdown-item special">
                      <input 
                        type="checkbox" 
                        class="days-checkbox"
                        :checked="isAllSelected(newPrompt.schedule_days)" 
                        @change="toggleAllDays(newPrompt, $event)"
                      />
                      <span>All Days</span>
                    </label>
                    <div class="dropdown-divider"></div>
                    <!-- Individual Days -->
                    <label v-for="day in availableDays" :key="day.value" class="dropdown-item">
                      <input 
                        type="checkbox" 
                        class="days-checkbox"
                        :value="day.value" 
                        :checked="isDaySelected(newPrompt.schedule_days, day.value)"
                        @change="toggleIndividualDay(newPrompt, day.value)"
                      />
                      <span>{{ day.label }}</span>
                    </label>
                  </div>
                </div>

                <!-- Email Notification -->
                <div class="form-group">
                  <label>Email Notification</label>
                  <div class="toggle-row">
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="newPrompt.email_notification" />
                      <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">{{ newPrompt.email_notification ? 'On' : 'Off' }}</span>
                  </div>
                </div>
              </div>

              <div class="form-group full-width">
                <label>Prompt Template</label>
                <textarea v-model="newPrompt.prompt_text" rows="8" placeholder="Enter system instructions..."></textarea>
              </div>
              <div class="form-actions">
                <button @click="addPrompt" :disabled="isSaving || !isValidNewPrompt" class="btn-primary btn-sm">
                  {{ isSaving ? 'Saving...' : 'Save Prompt' }}
                </button>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Existing Prompts List -->
          <div class="existing-prompts-section">
            <h4>Existing Prompts</h4>
            <div v-if="isLoadingPrompts" class="loading-state">Loading prompts...</div>
            <div v-else-if="prompts.length === 0" class="empty-list">No prompts configured</div>
            
            <div v-else class="prompts-table-container">
              <table class="prompts-table">
                <thead>
                  <tr>
                    <th style="width: 40px">Active</th>
                    <th style="width: 200px">Title</th>
                    <th>Prompt</th>
                    <th style="width: 150px">Schedule (UTC)</th>
                    <th style="width: 60px">Email</th>
                    <th style="width: 60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prompt in prompts" :key="prompt.id">
                    <td>
                      <!-- Active Toggle -->
                      <label class="switch">
                        <input 
                          type="checkbox" 
                          :checked="prompt.is_active" 
                          @change="togglePromptActive(prompt)"
                        >
                        <span class="slider round"></span>
                      </label>
                    </td>
                    <td>
                      <input 
                        v-if="editingPromptId === prompt.id" 
                        v-model="editForm.title" 
                        class="inline-input"
                      />
                      <span v-else class="text-display" @click="startEdit(prompt)">{{ prompt.title }}</span>
                    </td>
                    <td>
                      <textarea
                        v-if="editingPromptId === prompt.id" 
                        v-model="editForm.prompt_text" 
                        class="inline-input"
                        rows="11"
                      ></textarea>
                      <span v-else class="text-display truncate" @click="startEdit(prompt)" :title="prompt.prompt_text">{{ prompt.prompt_text }}</span>
                    </td>
                    <td>
                      <div v-if="editingPromptId === prompt.id" class="edit-schedule relative">
                         <input v-model="editForm.schedule_time" type="time" class="inline-input mb-1" />
                         
                         <div class="custom-select-trigger small" @click="showEditPromptDayDropdown = !showEditPromptDayDropdown">
                           {{ formatDays(editForm.schedule_days) }}
                         </div>

                         <div v-if="showEditPromptDayDropdown" class="custom-select-dropdown small">
                            <label class="dropdown-item special">
                              <input 
                                type="checkbox" 
                                :checked="isAllSelected(editForm.schedule_days)" 
                                @change="toggleAllDays(editForm, $event)"
                              />
                              <span>All Days</span>
                            </label>
                            <div class="dropdown-divider"></div>
                            <label v-for="day in availableDays" :key="day.value" class="dropdown-item">
                              <input 
                                type="checkbox" 
                                :value="day.value" 
                                :checked="isDaySelected(editForm.schedule_days, day.value)"
                                @change="toggleIndividualDay(editForm, day.value)"
                              />
                              <span>{{ day.label }}</span>
                            </label>
                         </div>
                      </div>
                      <div v-else class="text-display" @click="startEdit(prompt)">
                        <div>{{ formatTime(prompt.schedule_time) }}</div>
                        <div class="days-badge">{{ formatDays(prompt.schedule_days) }}</div>
                      </div>
                    </td>
                    <td>
                      <!-- Email Notification Toggle (Edit Mode) -->
                      <div v-if="editingPromptId === prompt.id">
                        <label class="switch">
                          <input 
                            type="checkbox" 
                            v-model="editForm.email_notification"
                          >
                          <span class="slider round"></span>
                        </label>
                      </div>
                      <div v-else class="text-display" @click="startEdit(prompt)">
                        <span :class="['email-badge', prompt.email_notification ? 'on' : 'off']">
                          {{ prompt.email_notification ? 'On' : 'Off' }}
                        </span>
                      </div>
                    </td>
                    <td class="actions-cell">
                      <div v-if="editingPromptId === prompt.id" class="edit-actions">
                         <button @click="saveEdit(prompt.id)" class="icon-btn save" title="Save">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button @click="cancelEdit" class="icon-btn cancel" title="Cancel">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                      <div v-else class="row-actions">
                        <button @click="deletePrompt(prompt.id)" class="icon-btn delete" title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
    <!-- Payload Modal -->
    <div v-if="showPayloadModal" class="modal-backdrop" @click="showPayloadModal = false">
      <div class="modal-content modal-xl" @click.stop>
        <div class="modal-header">
          <h3>LLM Payload Data</h3>
          <button @click="showPayloadModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="payload-section">
            <label>Model</label>
            <div class="payload-value tag">{{ selectedReport?.metadata?.model || 'Unknown' }}</div>
          </div>

          <div class="payload-section">
            <label>System Instruction (Persona & Rules)</label>
            <div class="payload-value code-block system-instruction">
              {{ selectedReport?.metadata?.system_instruction || 'N/A' }}
            </div>
          </div>

          <div class="payload-section">
            <label>User Instruction (Data & Task)</label>
            <div class="payload-value code-block">
              {{ selectedReport?.llm_payload }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSupabase } from '@y2kfund/core'
import { useAuth } from '../composables/useAuth'
import { marked } from 'marked'

// Router for URL management
const router = useRouter()
const route = useRoute()

// Props from route params (for direct URL navigation)
const props = defineProps<{
  reportId?: string
  promptTitle?: string
  createdAt?: string
}>()

/**
 * Interfaces & Types
 */
interface Report {
  id: string
  prompt_title: string
  created_at: string
  llm_response_summary: string
  llm_response_content: string
  llm_payload: string
}

// ... (Report interface above)

interface AnalysisPrompt {
  id: string
  title: string
  prompt_text: string
  schedule_time: string
  schedule_days: string[] // Added
  email_notification: boolean
  is_active: boolean
  created_by: string
}

// ...

// ...

const { user } = useAuth()
const supabase = useSupabase()

/**
 * State
 */
const reports = ref<Report[]>([])
const selectedReportId = ref<string | null>(null)
const isLoadingReports = ref(false)

const prompts = ref<AnalysisPrompt[]>([])
const isLoadingPrompts = ref(false)
const showModal = ref(false)
const isSaving = ref(false)

const availableDays = [
  { label: 'Mon', value: 'Mon' },
  { label: 'Tue', value: 'Tue' },
  { label: 'Wed', value: 'Wed' },
  { label: 'Thu', value: 'Thu' },
  { label: 'Fri', value: 'Fri' },
  { label: 'Sat', value: 'Sat' },
  { label: 'Sun', value: 'Sun' }
]

const newPrompt = ref({
  title: '',
  prompt_text: '',
  schedule_time: '14:30',
  schedule_days: ['All'] as string[],
  email_notification: true
})

const showPayloadModal = ref(false)

const editingPromptId = ref<string | null>(null)
const editForm = ref<Partial<AnalysisPrompt>>({})

const showNewPromptDayDropdown = ref(false)
const showEditPromptDayDropdown = ref(false)

// Dropdown Logic
const isAllSelected = (currentDays: string[] | undefined) => {
  if (!currentDays) return false
  return currentDays.includes('All') || currentDays.length === 7
}

const isDaySelected = (currentDays: string[] | undefined, day: string) => {
  if (!currentDays) return false
  if (currentDays.includes('All')) return true
  return currentDays.includes(day)
}

const toggleAllDays = (targetObj: any, event: Event) => {
  const isChecked = (event.target as HTMLInputElement).checked
  if (isChecked) {
    targetObj.schedule_days = ['All']
  } else {
    targetObj.schedule_days = []
  }
}

const toggleIndividualDay = (targetObj: any, day: string) => {
  let days = targetObj.schedule_days || []
  
  // If currently 'All', expand it to all 7 days first, then toggle the specific one
  if (days.includes('All')) {
    days = availableDays.map(d => d.value)
  }

  if (days.includes(day)) {
    days = days.filter(d => d !== day)
  } else {
    days.push(day)
  }

  // If now all 7 are selected, convert back to 'All'
  if (days.length === 7) {
    days = ['All']
  }

  // If empty, keep empty (user must explicitly select at least one effectively, but empty is allowed as "runs never")
  
  targetObj.schedule_days = days
}

const selectedReport = computed(() => 
  reports.value.find(r => r.id === selectedReportId.value)
)

// Helpers
const formatDays = (days: string[] | undefined) => {
  if (!days || days.length === 0 || (days.length === 1 && days[0] === 'All')) {
    return 'Every Day'
  }
  return days.join(', ')
}

const groupedReports = computed(() => {
  const groups: Record<string, Report[]> = {}
  
  reports.value.forEach(report => {
    const date = new Date(report.created_at)
    // Use UTC to prevent date shifting
    const dateKey = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    }) // e.g., "Jan 28"
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(report)
  })
  
  return groups
})

const isValidNewPrompt = computed(() => {
  return newPrompt.value.title.trim().length > 0 && 
         newPrompt.value.prompt_text.trim().length > 0
})

const fetchReports = async () => {
  if (!user.value?.id) return

  isLoadingReports.value = true
  try {
    const { data, error } = await supabase
      .schema('hf')
      .from('ai_analysis_reports')
      .select('*')
      .eq('created_by', user.value.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching reports:', error)
      if (error.code === '42P01') { 
        console.warn('Table not found. Using empty list.')
        reports.value = []
      }
    } else {
      reports.value = data || []
      if (reports.value && reports.value.length > 0 && !selectedReportId.value) {
        selectedReportId.value = reports.value[0].id
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  } finally {
    isLoadingReports.value = false
  }
}

const selectReport = (id: string) => {
  selectedReportId.value = id
  
  // Update browser tab title with report name
  const report = reports.value.find(r => r.id === id)
  if (report?.prompt_title) {
    document.title = `${report.prompt_title} | AI Analysis Reports`
    
    // Update URL with report details (date only, no time)
    const createdDate = new Date(report.created_at).toISOString().split('T')[0] // e.g., 2026-02-02
    const slugTitle = report.prompt_title.replace(/\s+/g, '-').toLowerCase()
    
    router.replace({
      name: 'analysis',
      params: {
        reportId: report.id,
        promptTitle: slugTitle,
        createdAt: createdDate
      }
    })
  }
}

const deleteReport = async (id: string) => {
  if (!confirm('Are you sure you want to delete this report?')) return

  try {
    const { error } = await supabase
      .schema('hf')
      .from('ai_analysis_reports')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Remove from local list
    reports.value = reports.value.filter(r => r.id !== id)
    
    // If deleted report was selected, select the first one available or null
    if (selectedReportId.value === id) {
      selectedReportId.value = reports.value.length > 0 ? reports.value[0].id : null
    }
  } catch (err) {
    console.error('Error deleting report:', err)
    alert('Failed to delete report')
  }
}

/**
 * Methods: Prompt Manager (CRUD)
 */
const fetchPrompts = async () => {
  if (!user.value?.id) return

  isLoadingPrompts.value = true
  try {
    const { data, error } = await supabase
      .schema('hf')
      .from('ai_analysis_prompts')
      .select('*')
      .eq('created_by', user.value.id)
      .order('title', { ascending: true })

    if (error) throw error
    prompts.value = data || []
  } catch (err) {
    console.error('Error fetching prompts:', err)
  } finally {
    isLoadingPrompts.value = false
  }
}

const addPrompt = async () => {
  console.log('User ID:', user.value?.id)
  
  const payload = {
    title: newPrompt.value.title,
    prompt_text: newPrompt.value.prompt_text,
    schedule_time: newPrompt.value.schedule_time,
    schedule_days: newPrompt.value.schedule_days && newPrompt.value.schedule_days.length > 0 
      ? newPrompt.value.schedule_days 
      : ['All'],
    email_notification: newPrompt.value.email_notification ?? true,
    created_by: user.value.id,
    is_active: true
  }
  console.log('Sending Payload:', payload)

  isSaving.value = true
  try {
    const { data, error } = await supabase
      .schema('hf')
      .from('ai_analysis_prompts')
      .insert(payload)
      .select()

    if (error) throw error
    
    // Add to list and reset form
    if (data && data[0]) {
      prompts.value.push(data[0])
      newPrompt.value = { title: '', prompt_text: '', schedule_time: '09:00', schedule_days: ['All'], email_notification: true }
    }
  } catch (err) {
    console.error('Error saving prompt:', err)
    alert('Failed to save prompt')
  } finally {
    isSaving.value = false
  }
}

const deletePrompt = async (id: string) => {
  if (!confirm('Are you sure you want to delete this prompt?')) return

  try {
    const { error } = await supabase
      .schema('hf')
      .from('ai_analysis_prompts')
      .delete()
      .eq('id', id)

    if (error) throw error

    prompts.value = prompts.value.filter(p => p.id !== id)
  } catch (err) {
    console.error('Error deleting prompt:', err)
    alert('Failed to delete prompt')
  }
}

const togglePromptActive = async (prompt: AnalysisPrompt) => {
  const newValue = !prompt.is_active
  // Optimistic update
  prompt.is_active = newValue
  
  try {
    const { error } = await supabase
      .schema('hf')
      .from('ai_analysis_prompts')
      .update({ is_active: newValue })
      .eq('id', prompt.id)

    if (error) {
      prompt.is_active = !newValue // Revert
      throw error
    }
  } catch (err) {
    console.error('Error toggling status:', err)
  }
}

const startEdit = (prompt: AnalysisPrompt) => {
  editingPromptId.value = prompt.id
  editForm.value = { ...prompt }
}

const cancelEdit = () => {
  editingPromptId.value = null
}

const saveEdit = async (id: string) => {
  try {
    const { error } = await supabase
      .schema('hf')
      .from('ai_analysis_prompts')
      .update({
        title: editForm.value.title,
        prompt_text: editForm.value.prompt_text,
        schedule_time: editForm.value.schedule_time,
        schedule_days: editForm.value.schedule_days && editForm.value.schedule_days.length > 0 
          ? editForm.value.schedule_days 
          : ['All'],
        email_notification: editForm.value.email_notification ?? true
      })
      .eq('id', id)

    if (error) throw error

    // Update local state
    const index = prompts.value.findIndex(p => p.id === id)
    if (index !== -1) {
      prompts.value[index] = { ...prompts.value[index], ...editForm.value }
    }
    editingPromptId.value = null
  } catch (err) {
    console.error('Error updating prompt:', err)
    alert('Failed to update prompt')
  }
}


/**
 * Helpers
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const formatTimeOnly = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })
}

const formatTime = (timeString: string) => {
  // Simple check to remove seconds if cleaner
  return timeString ? timeString.substring(0, 5) : ''
}

const renderMarkdown = (content: string) => {
  if (!content) return ''
  try {
    return marked.parse(content)
  } catch (e) {
    console.error('Markdown rendering error:', e)
    return content
  }
}

const openNewAnalysisModal = () => {
  showModal.value = true
  fetchPrompts() // Refresh list on open
}
const closeModal = () => showModal.value = false

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
// ... (imports)

// ... (rest of code)

// Initial Load
onMounted(() => {
  if (user.value?.id) {
    fetchReports()
  }
})

// Watch for auth to be ready and handle URL params
watch(() => user.value, async (newUser) => {
  if (newUser?.id) {
    await fetchReports()
    
    // If reportId is in URL params (from props), select that report
    if (props.reportId) {
      let report = reports.value.find(r => r.id === props.reportId)
      
      // If report not in user's list, fetch it by ID (shared report from another user)
      if (!report) {
        try {
          const { data, error } = await supabase
            .schema('hf')
            .from('ai_analysis_reports')
            .select('*')
            .eq('id', props.reportId)
            .single()
          
          if (!error && data) {
            // Add the shared report to the list for display
            reports.value.unshift(data)
            report = data
          }
        } catch (err) {
          console.error('Error fetching shared report:', err)
        }
      }
      
      // Select the report if found
      if (report) {
        selectedReportId.value = props.reportId
        if (report.prompt_title) {
          document.title = `${report.prompt_title} | AI Analysis Reports`
        }
      }
    }
  }
}, { immediate: true })

// Reset title when leaving page
onUnmounted(() => {
  document.title = 'Dashboard'
})
</script>

<style scoped>
/* Markdown*/
/* Custom Select Dropdown */
.relative { position: relative; }

.custom-select-trigger {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  min-height: 38px;
}
.custom-select-trigger.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  min-height: 28px;
}
.custom-select-trigger:hover {
  border-color: #9ca3af;
}

.custom-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px 0;
}
.custom-select-dropdown.small {
  width: 200px; /* Fixed width for the mini editor */
}

.dropdown-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  gap: 0.75rem;
  text-align: left;
}
.dropdown-item input {
  margin: 0;
  flex-shrink: 0;
  width: 14px;
}
.dropdown-item span {
  flex-grow: 0;
  white-space: nowrap;
}
.dropdown-item:hover {
  background: #f3f4f6;
}
.dropdown-item.special {
  font-weight: 600;
  color: #111827;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.arrow {
  font-size: 0.7rem;
  color: #6b7280;
}

/* Form Row Flex - for horizontal alignment */
.form-row-flex {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
}
.form-row-flex .form-group {
  flex: 1;
  min-width: 0;
}
.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

/* Toggle Switch */
.toggle-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toggle-group label:first-child {
  min-width: 120px;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}
.toggle-switch input:checked + .toggle-slider {
  background-color: #10b981;
}
.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}
.toggle-label {
  font-size: 0.85rem;
  color: #6b7280;
}


.days-badge {
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 0.1rem;
  background: #f3f4f6;
  padding: 0 4px;
  border-radius: 4px;
  display: inline-block;
}

/* Scrollbar styling */
:deep(.detail-body) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #374151;
  line-height: 1.6;
}

:deep(.detail-body h1), :deep(.detail-body h2), :deep(.detail-body h3) {
  color: #111827;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

:deep(.detail-body h1) { font-size: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
:deep(.detail-body h2) { font-size: 1.25rem; }
:deep(.detail-body h3) { font-size: 1.1rem; }

:deep(.detail-body p) {
  margin-bottom: 1rem;
}

:deep(.detail-body ul), :deep(.detail-body ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

:deep(.detail-body li) {
  margin-bottom: 0.25rem;
}

:deep(.detail-body strong) {
  color: #000;
  font-weight: 600;
}

:deep(.detail-body pre) {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

:deep(.detail-body code) {
  background: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85em;
  font-family: monospace;
}

:deep(.detail-body blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin-left: 0;
  color: #6b7280;
  font-style: italic;
}

:deep(.detail-body table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

:deep(.detail-body th), :deep(.detail-body td) {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}

:deep(.detail-body th) {
  background: #f9fafb;
  font-weight: 600;
}
</style>

<style scoped>
.analysis-page {
  height: calc(100vh - 60px); 
  display: flex;
  flex-direction: column;
  background: var(--bg);
  padding: 1rem;
}

.header-section {
  margin-bottom: 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.new-analysis-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #000;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
  width: 150px;
}

.new-analysis-btn:hover {
  opacity: 0.8;
}

.analysis-container {
  display: flex;
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

/* Sidebar List */
.report-list {
  width: 30%;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  background: #f9fafb;
}

.empty-list {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.report-group {
  margin-bottom: 0.5rem;
}

.group-header {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f9fafb;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  border-top: 1px solid #f3f4f6;
  margin-bottom: 0;
}

.report-item {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s;
}

.report-item:hover {
  background: #f3f4f6;
}

.report-item.active {
  background: #eef2ff;
  border-left: 3px solid #4f46e5;
}

.report-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.delete-report-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s;
}


.delete-report-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.report-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.report-date {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

.report-preview {
  margin: 0;
  font-size: 0.85rem;
  color: #4b5563;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Main Content */
.report-content {
  width: 70%;
  padding: 2rem;
  overflow-y: auto;
}

.detail-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.detail-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.detail-date {
  color: #6b7280;
}

.detail-body {
  line-height: 1.6;
  color: #374151;
}

.empty-state, .loading-state, .empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #9ca3af;
  height: 100%;
}

.empty-list {
  height: auto;
  font-style: italic;
}


/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-lg {
  width: 1200px;
  max-width: 95%;
}

.modal-xl {
  width: 95%;
  height: 90vh;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-payload {
  background: white;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn-payload:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.btn-text {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  padding: 0;
}
.btn-text:hover { color: #4338ca; }

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.payload-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.payload-section label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.payload-value.tag {
  align-self: flex-start;
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
}

.payload-value.code-block {
  background: #1e1e1e; /* Dark theme for code */
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 8px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap; /* Preserve formatting */
  overflow-x: auto;
  border: 1px solid #374151;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.2);
}

.json-display {
  display: none;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.form-group input, .form-group textarea {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}
.form-group textarea {
  resize: vertical;
}

.form-actions {
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: #000;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 1.5rem 0;
}

/* Prompts Table */
.prompts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.prompts-table th {
  text-align: left;
  padding: 0.75rem;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  color: #6b7280;
  font-weight: 600;
}

.prompts-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}

.text-display {
  display: block;
  cursor: pointer;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: 4px;
}
.text-display:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.text-display.truncate {
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inline-input {
  width: 100%;
  padding: 4px;
  border: 1px solid #4f46e5;
  border-radius: 4px;
  font-size: inherit;
  font-family: inherit;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(16px);
}

.slider.round {
  border-radius: 20px;
}
.slider.round:before {
  border-radius: 50%;
}

.actions-cell {
  text-align: right;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin-left: 4px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-btn:hover {
  background: #f3f4f6;
}
.icon-btn.delete { color: #ef4444; }
.icon-btn.save { color: #10b981; }
.icon-btn.cancel { color: #6b7280; }

.edit-actions, .row-actions {
  display: flex;
  justify-content: flex-end;
}


.days-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
