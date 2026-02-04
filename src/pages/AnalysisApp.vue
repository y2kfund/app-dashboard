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
        <div class="modal-body prompt-manager-layout">
          <!-- LEFT PANEL: Add Form + Prompts List -->
          <div class="prompts-list-panel" :class="{ 'shrunk': editingPromptId }">
            
            <!-- Add New Prompt Form (collapses when editing) -->
            <div class="add-prompt-section" :class="{ 'collapsed': editingPromptId }">
              <h4>Add New Prompt</h4>
              <div v-if="!editingPromptId" class="form-grid">
                <div class="form-group full-width relative">
                  <label>Title</label>
                  <input v-model="newPrompt.title" type="text" placeholder="e.g. Daily Risk Check" />
                </div>
                <div class="form-group">
                  <label>Schedule Time (UTC)<small> [Note: NYSE opens at 02:30 pm UTC]</small></label>
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
                  <textarea v-model="newPrompt.prompt_text" rows="20" placeholder="Enter system instructions..."></textarea>
                </div>
                <div class="form-actions">
                  <button @click="addPrompt" :disabled="isSaving || !isValidNewPrompt" class="btn-primary btn-sm">
                    {{ isSaving ? 'Saving...' : 'Save Prompt' }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!editingPromptId" class="divider"></div>

            <!-- Existing Prompts List (Simplified when editing) -->
            <div class="existing-prompts-section">
              <h4>Existing Prompts</h4>
              <div v-if="isLoadingPrompts" class="loading-state">Loading prompts...</div>
              <div v-else-if="prompts.length === 0" class="empty-list">No prompts configured</div>
              
              <div v-else class="prompts-list">
                <div 
                  v-for="prompt in prompts" 
                  :key="prompt.id" 
                  class="prompt-list-item"
                  :class="{ 'active': editingPromptId === prompt.id }"
                  @click="startEdit(prompt)"
                >
                  <div class="prompt-item-content">
                    <label class="switch" @click.stop>
                      <input 
                        type="checkbox" 
                        :checked="prompt.is_active" 
                        @change="togglePromptActive(prompt)"
                      >
                      <span class="slider round"></span>
                    </label>
                    <div class="prompt-item-info">
                      <span class="prompt-item-title">{{ prompt.title }}</span>
                      <span class="prompt-item-schedule">{{ formatTime(prompt.schedule_time) }} · {{ formatDays(prompt.schedule_days) }}</span>
                    </div>
                  </div>
                  <div class="prompt-item-actions" @click.stop>
                    <button @click="deletePrompt(prompt.id)" class="icon-btn delete" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT PANEL: Edit Form (slides in when editing) -->
          <div v-if="editingPromptId" class="edit-panel">
            <div class="edit-panel-header">
              <h4>Edit Prompt</h4>
              <button @click="cancelEdit" class="close-edit-btn" title="Close">×</button>
            </div>
            
            <div class="edit-form">
              <div class="form-group">
                <label>Title</label>
                <input v-model="editForm.title" type="text" class="edit-input" />
              </div>

              <div class="form-group">
                <label>Prompt Template</label>
                <textarea v-model="editForm.prompt_text" rows="20" class="edit-input"></textarea>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label>Schedule Time (UTC)</label>
                  <input v-model="editForm.schedule_time" type="time" class="edit-input" />
                </div>
                
                <div class="form-group relative">
                  <label>Days to Run</label>
                  <div class="custom-select-trigger" @click="showEditPromptDayDropdown = !showEditPromptDayDropdown">
                    {{ formatDays(editForm.schedule_days) }}
                    <span class="arrow">▼</span>
                  </div>
                  <div v-if="showEditPromptDayDropdown" class="custom-select-dropdown">
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
              </div>

              <div class="form-group">
                <label>Email Notification</label>
                <div class="toggle-row">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="editForm.email_notification" />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="toggle-label">{{ editForm.email_notification ? 'On' : 'Off' }}</span>
                </div>
              </div>

              <div class="edit-form-actions">
                <button @click="cancelEdit" class="btn-secondary">Cancel</button>
                <button @click="saveEdit(editingPromptId)" class="btn-primary">Save Changes</button>
              </div>
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
          <!-- Model Section (always visible, small) -->
          <div class="payload-section">
            <label>Model</label>
            <div class="payload-value tag">{{ selectedReport?.metadata?.model || 'Unknown' }}</div>
          </div>

          <!-- System Instruction (Collapsible) -->
          <div class="payload-section collapsible">
            <div class="section-header" @click="expandedSections.system = !expandedSections.system">
              <label>System Instruction (Persona & Rules)</label>
              <span class="chevron" :class="{ expanded: expandedSections.system }">▶</span>
            </div>
            <div v-show="expandedSections.system" class="payload-value code-block system-instruction">
              {{ selectedReport?.metadata?.system_instruction || 'N/A' }}
            </div>
          </div>

          <!-- User Instruction (Collapsible) -->
          <div class="payload-section collapsible">
            <div class="section-header" @click="expandedSections.user = !expandedSections.user">
              <label>User Instruction (Data & Task)</label>
              <span class="chevron" :class="{ expanded: expandedSections.user }">▶</span>
            </div>
            <div v-show="expandedSections.user" class="payload-value code-block markdown-content" v-html="renderMarkdown(selectedReport?.llm_payload || '')">
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
  schedule_time: '14:35',
  schedule_days: ['All'] as string[],
  email_notification: true
})

const showPayloadModal = ref(false)
const expandedSections = ref({
  system: false,
  user: false
})

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

<style scoped src="../styles/AnalysisApp.css"></style>
