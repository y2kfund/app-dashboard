<template>
  <div class="fetch-status-popover">
    <div class="popover-header">
      <h4>{{ title }} - Fetch History</h4>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading...</span>
    </div>

    <!-- No Data State -->
    <div v-else-if="!pivotData.rows.length" class="empty-state">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <span>No fetch history available</span>
    </div>

    <!-- Pivot Table -->
    <div v-else class="table-wrapper">
      <table class="status-table">
        <thead>
          <tr>
            <th class="date-col">Date/Time</th>
            <th 
              v-for="account in pivotData.accounts" 
              :key="account.id"
              class="account-col"
            >
              {{ account.alias }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pivotData.rows" :key="row.runId">
            <td class="date-cell">{{ row.dateTime }}</td>
            <td 
              v-for="account in pivotData.accounts" 
              :key="account.id"
              class="status-cell"
            >
              <span 
                :class="['status-badge', getStatusClass(row.statuses[account.id])]"
                :title="row.errors[account.id] || getStatusTooltip(row.statuses[account.id])"
              >
                {{ getStatusLabel(row.statuses[account.id]) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Legend -->
    <div class="popover-footer">
      <div class="legend">
        <span class="legend-item">
          <span class="status-badge success-badge small">✓</span> Success
        </span>
        <span class="legend-item">
          <span class="status-badge failed small">✗</span> Failed
        </span>
        <span class="legend-item">
          <span class="status-badge skipped small">⚠</span> Skipped
        </span>
        <span class="legend-item">
          <span class="status-badge na small">-</span> N/A
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FetchStatusRecord, AccountAlias } from '../composables/useFetchStatus'

interface Props {
  title: string
  data: FetchStatusRecord[]
  accounts: AccountAlias[]
  isLoading: boolean
}

const props = defineProps<Props>()

// Transform data into pivot table format
const pivotData = computed(() => {
  if (!props.data || props.data.length === 0 || !props.accounts.length) {
    return { accounts: [], rows: [] }
  }

  // Get unique run_ids (last 10)
  const uniqueRunIds = [...new Set(props.data.map(d => d.run_id))].slice(0, 10)
  
  // Build rows
  const rows = uniqueRunIds.map(runId => {
    const runData = props.data.filter(d => d.run_id === runId)
    const firstRecord = runData[0]
    
    // Build status map for each account
    const statuses: Record<string, string> = {}
    const errors: Record<string, string> = {}
    const recordCounts: Record<string, number | null> = {}
    
    props.accounts.forEach(account => {
      const record = runData.find(d => String(d.internal_account_id) === account.id)
      statuses[account.id] = record?.status || 'N/A'
      errors[account.id] = record?.error_message || ''
      recordCounts[account.id] = record?.records_fetched ?? null
    })
    
    return {
      runId,
      dateTime: formatDateTime(firstRecord?.created_at),
      statuses,
      errors,
      recordCounts
    }
  })

  return {
    accounts: props.accounts,
    rows
  }
})

const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short'
  })
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'success': return 'success-badge'
    case 'failed': return 'failed'
    case 'skipped': return 'skipped'
    default: return 'na'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'success': return '✓'
    case 'failed': return '✗'
    case 'skipped': return '⚠'
    default: return '-'
  }
}

const getStatusTooltip = (status: string) => {
  switch (status) {
    case 'success': return 'Fetch successful'
    case 'failed': return 'Fetch failed'
    case 'skipped': return 'Skipped (no API URL configured)'
    default: return 'No data'
  }
}
</script>

<style scoped>
.fetch-status-popover {
  min-width: 420px;
  max-width: 650px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: popoverFadeIn 0.2s ease-out;
}

@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popover-header {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.popover-header h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-wrapper {
  max-height: 280px;
  overflow: auto;
}

.status-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.status-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 0.5rem 0.5rem;
  text-align: center;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  font-size: 0.7rem;
}

.status-table th.date-col {
  text-align: left;
  min-width: 110px;
  padding-left: 0.75rem;
}

.status-table th.account-col {
  min-width: 55px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.date-cell {
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
  font-size: 0.7rem;
  padding-left: 0.75rem !important;
}

.status-cell {
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: default;
  transition: transform 0.1s ease;
}

.status-badge:hover {
  transform: scale(1.1);
}

.status-badge.success-badge {
  background: #dcfce7;
  color: #166534;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
  cursor: help;
}

.status-badge.skipped {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.na {
  background: #f1f5f9;
  color: #94a3b8;
}

.status-badge.small {
  width: 16px;
  height: 16px;
  font-size: 0.6rem;
}

/* Hover effect for rows */
.status-table tbody tr:hover {
  background: #f8fafc;
}

/* Footer with legend */
.popover-footer {
  padding: 0.5rem 0.75rem;
  background: #fafafa;
  border-top: 1px solid #e2e8f0;
}

.legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: #64748b;
}

/* Custom scrollbar */
.table-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
