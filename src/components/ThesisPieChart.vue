<script setup lang="ts">
import { computed, ref, shallowRef, watch, nextTick, onBeforeUnmount, inject } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  useCapitalAcrossThesisQuery,
  type ThesisCapitalGroup,
  type SymbolDetail
} from '@y2kfund/core/capitalAcrossThesisForRiskManagement'

// Register ECharts components
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

interface Props {
  userId?: string | null
  window?: string | null
  showHeaderLink?: boolean
  accountId?: string
}

const props = withDefaults(defineProps<Props>(), {
  userId: null,
  window: null,
  showHeaderLink: false,
  accountId: 'demo'
})

const emit = defineEmits<{
  'minimize': []
  'maximize': []
}>()

// Inject event bus for cross-component communication
const eventBus = inject<any>('eventBus')

// Fetch capital across thesis data
const { data: thesisData, isLoading, error } = useCapitalAcrossThesisQuery(props.userId)

// Breadcrumb navigation state
interface BreadcrumbItem {
  label: string
  level: 'parent' | 'child' | 'symbol'
  parentThesisId?: string | null
  thesisId?: string | null
}

const breadcrumbs = ref<BreadcrumbItem[]>([
  { label: 'All Theses', level: 'parent' }
])

// Current view state
const currentView = ref<'parent' | 'child' | 'symbol'>('parent')
const selectedParentThesisId = ref<string | null>(null)
const selectedChildThesisId = ref<string | null>(null)

// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  } else if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${value.toFixed(0)}`
}

// Color palette — vibrant, modern, with great contrast
const COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#3b82f6', // blue
  '#a855f7', // purple
  '#84cc16', // lime
  '#e11d48', // rose
  '#0ea5e9', // sky
  '#10b981', // emerald
]

const getColor = (index: number): string => COLORS[index % COLORS.length]

// Computed: Group data by parent thesis
const parentThesisGroups = computed(() => {
  if (!thesisData.value || thesisData.value.length === 0) return []

  const parentMap = new Map<string, {
    parentThesisId: string | null
    parentThesisTitle: string
    totalCapital: number
    childTheses: ThesisCapitalGroup[]
  }>()

  thesisData.value.forEach(thesis => {
    const parentKey = thesis.parentThesisId || 'NO_PARENT'
    const parentTitle = thesis.parentThesisTitle ||
      (thesis.thesisId === null ? 'Unassigned' : 'No Parent Thesis')

    if (!parentMap.has(parentKey)) {
      parentMap.set(parentKey, {
        parentThesisId: thesis.parentThesisId,
        parentThesisTitle: parentTitle,
        totalCapital: 0,
        childTheses: []
      })
    }

    const group = parentMap.get(parentKey)!
    group.totalCapital += thesis.totalCapital
    group.childTheses.push(thesis)
  })

  return Array.from(parentMap.values())
    .sort((a, b) => b.totalCapital - a.totalCapital)
})

// Computed: Get child theses for selected parent
const childThesesForParent = computed(() => {
  if (!selectedParentThesisId.value) return []
  const parentGroup = parentThesisGroups.value.find(
    g => (g.parentThesisId || 'NO_PARENT') === selectedParentThesisId.value
  )
  return parentGroup?.childTheses || []
})

// Computed: Get symbols for selected child thesis
const symbolsForChild = computed(() => {
  if (!selectedChildThesisId.value) return []
  const childThesis = thesisData.value?.find(
    t => (t.thesisId || 'UNASSIGNED') === selectedChildThesisId.value
  )
  return childThesis?.symbols || []
})

// Total capital for current view
const currentTotal = computed(() => {
  if (currentView.value === 'parent') {
    return parentThesisGroups.value.reduce((sum, g) => sum + g.totalCapital, 0)
  } else if (currentView.value === 'child') {
    return childThesesForParent.value.reduce((sum, t) => sum + t.totalCapital, 0)
  } else {
    return symbolsForChild.value.reduce((sum, s) => sum + s.capitalInvested, 0)
  }
})

// ECharts option
const chartOption = computed(() => {
  let pieData: any[] = []

  if (currentView.value === 'parent') {
    pieData = parentThesisGroups.value.map((group, index) => ({
      name: group.parentThesisTitle,
      value: group.totalCapital,
      itemStyle: { color: getColor(index) },
      parentThesisId: group.parentThesisId || 'NO_PARENT'
    }))
  } else if (currentView.value === 'child') {
    pieData = childThesesForParent.value.map((thesis, index) => ({
      name: thesis.thesisTitle,
      value: thesis.totalCapital,
      itemStyle: { color: getColor(index) },
      thesisId: thesis.thesisId || 'UNASSIGNED'
    }))
  } else {
    pieData = symbolsForChild.value.map((symbol, index) => ({
      name: symbol.symbolRoot,
      value: symbol.capitalInvested,
      itemStyle: { color: getColor(index) }
    }))
  }

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(99, 102, 241, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 13 },
      formatter: (params: any) => {
        const percentage = params.percent.toFixed(1)
        const value = formatCurrency(params.value)
        return `<strong style="color:#fff">${params.name}</strong><br/>Capital: ${value}<br/>Share: ${percentage}%`
      }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      type: 'scroll',
      pageButtonPosition: 'end',
      textStyle: { color: '#64748b', fontSize: 12 },
      pageTextStyle: { color: '#94a3b8' },
      formatter: (name: string) => {
        const item = pieData.find(d => d.name === name)
        if (item) {
          const pct = currentTotal.value > 0
            ? ((item.value / currentTotal.value) * 100).toFixed(1)
            : '0'
          return `${name}  ${pct}%`
        }
        return name
      }
    },
    series: [
      {
        name: 'Thesis Capital',
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          color: '#475569',
          fontSize: 12,
          formatter: (params: any) => {
            if (params.percent < 5) return ''
            return `${params.name}\n${params.percent.toFixed(1)}%`
          }
        },
        labelLine: {
          lineStyle: { color: '#cbd5e1' }
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#1e293b'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(99, 102, 241, 0.4)'
          },
          scaleSize: 8
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 60,
        data: pieData
      }
    ]
  }
})

// Chart instance reference
const chartRef = shallowRef()

// Handle chart click for drill-down + emit thesis filter to positions table
const handleChartClick = (params: any) => {
  if (currentView.value === 'parent') {
    const parentThesisId = params.data.parentThesisId
    selectedParentThesisId.value = parentThesisId
    currentView.value = 'child'
    breadcrumbs.value.push({
      label: params.name,
      level: 'child',
      parentThesisId
    })

    // Emit all child thesis titles under this parent to filter positions
    const parentGroup = parentThesisGroups.value.find(
      g => (g.parentThesisId || 'NO_PARENT') === parentThesisId
    )
    if (parentGroup && eventBus) {
      const thesisTitles = parentGroup.childTheses.map(t => t.thesisTitle)
      eventBus.emit('thesis-filter-changed', { thesisTitles, source: 'thesisPieChart' })
    }
  } else if (currentView.value === 'child') {
    const thesisId = params.data.thesisId
    selectedChildThesisId.value = thesisId
    currentView.value = 'symbol'
    breadcrumbs.value.push({
      label: params.name,
      level: 'symbol',
      thesisId
    })

    // Emit single child thesis title to filter positions
    if (eventBus) {
      eventBus.emit('thesis-filter-changed', { thesisTitles: [params.name], source: 'thesisPieChart' })
    }
  }
}

// Navigate breadcrumb
const navigateTo = (index: number) => {
  const item = breadcrumbs.value[index]
  if (item.level === 'parent') {
    currentView.value = 'parent'
    selectedParentThesisId.value = null
    selectedChildThesisId.value = null
    // Clear thesis filter when navigating back to top level
    if (eventBus) {
      eventBus.emit('thesis-filter-changed', { thesisTitles: [], source: 'thesisPieChart' })
    }
  } else if (item.level === 'child') {
    currentView.value = 'child'
    selectedParentThesisId.value = item.parentThesisId || null
    selectedChildThesisId.value = null
    // Re-emit parent-level thesis filter
    const parentGroup = parentThesisGroups.value.find(
      g => (g.parentThesisId || 'NO_PARENT') === item.parentThesisId
    )
    if (parentGroup && eventBus) {
      const thesisTitles = parentGroup.childTheses.map(t => t.thesisTitle)
      eventBus.emit('thesis-filter-changed', { thesisTitles, source: 'thesisPieChart' })
    }
  } else if (item.level === 'symbol') {
    currentView.value = 'symbol'
    selectedChildThesisId.value = item.thesisId || null
  }
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
}

// Setup chart event listener when data is loaded
watch(thesisData, async (newData) => {
  if (newData && newData.length > 0) {
    await nextTick()
    setTimeout(() => {
      if (chartRef.value) {
        const chartInstance = (chartRef.value as any)?.chart
        if (chartInstance) {
          chartInstance.on('click', handleChartClick)
        }
      }
    }, 300)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (chartRef.value) {
    const chartInstance = (chartRef.value as any)?.chart
    if (chartInstance) {
      chartInstance.off('click', handleChartClick)
    }
  }
})

// View level labels
const viewLabel = computed(() => {
  if (currentView.value === 'parent') return 'Parent Thesis'
  if (currentView.value === 'child') return 'Child Thesis'
  return 'Symbols'
})

const drillHint = computed(() => {
  if (currentView.value === 'parent') return 'Click a slice to drill into child theses'
  if (currentView.value === 'child') return 'Click a slice to see individual symbols'
  return 'Symbol level — use breadcrumbs to navigate back'
})
</script>

<template>
  <div class="thesis-pie-chart dashboard-container">
    <!-- Header -->
    <div class="tpc-header">
      <div class="tpc-header-left">
        <h3 class="tpc-title">Thesis Capital</h3>
        <span class="tpc-badge">{{ viewLabel }}</span>
      </div>
      <div class="tpc-header-right">
        <button class="tpc-btn tpc-btn-icon" @click="emit('maximize')" title="Maximize">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2h5v2H4v3H2V2zm7 0h5v5h-2V4H9V2zM2 9h2v3h3v2H2V9zm12 0v5H9v-2h3V9h2z" fill="currentColor"/></svg>
        </button>
        <button class="tpc-btn tpc-btn-icon" @click="emit('minimize')" title="Minimize">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading || !thesisData" class="tpc-state">
      <div class="tpc-spinner"></div>
      <p>Loading thesis data…</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="tpc-state tpc-error">
      <p>⚠️ {{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="thesisData.length === 0" class="tpc-state">
      <p>No thesis data available</p>
    </div>

    <!-- Main Content -->
    <div v-else class="tpc-content">
      <!-- Breadcrumb -->
      <div class="tpc-breadcrumb" v-if="breadcrumbs.length > 1">
        <span
          v-for="(crumb, index) in breadcrumbs"
          :key="index"
          class="tpc-crumb"
          :class="{ active: index === breadcrumbs.length - 1 }"
          @click="navigateTo(index)"
        >
          {{ crumb.label }}
          <span v-if="index < breadcrumbs.length - 1" class="tpc-crumb-sep">›</span>
        </span>
      </div>

      <!-- Chart -->
      <div class="tpc-chart-wrap">
        <v-chart
          ref="chartRef"
          class="tpc-chart"
          :option="chartOption"
          autoresize
        />
      </div>

      <!-- Drill hint -->
      <div class="tpc-hint">
        <span class="tpc-hint-icon">💡</span>
        <span>{{ drillHint }}</span>
      </div>

      <!-- Stats row -->
      <div class="tpc-stats">
        <div class="tpc-stat">
          <div class="tpc-stat-label">Total Capital</div>
          <div class="tpc-stat-value">{{ formatCurrency(currentTotal) }}</div>
        </div>
        <div class="tpc-stat">
          <div class="tpc-stat-label">Thesis Groups</div>
          <div class="tpc-stat-value">{{ parentThesisGroups.length }}</div>
        </div>
        <div class="tpc-stat">
          <div class="tpc-stat-label">Total Theses</div>
          <div class="tpc-stat-value">{{ thesisData.length }}</div>
        </div>
        <div class="tpc-stat">
          <div class="tpc-stat-label">Unique Symbols</div>
          <div class="tpc-stat-value">
            {{ new Set(thesisData.flatMap(t => t.symbols.map(s => s.symbolRoot))).size }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thesis-pie-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.tpc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.tpc-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tpc-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.tpc-badge {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  background: #eef2ff;
  color: #6366f1;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tpc-header-right {
  display: flex;
  gap: 0.25rem;
}

.tpc-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.tpc-btn-icon:hover {
  background: #f1f5f9;
  color: #475569;
}

/* States */
.tpc-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #94a3b8;
  font-size: 0.9rem;
}

.tpc-state p {
  margin: 0;
}

.tpc-error {
  color: #ef4444;
}

.tpc-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: tpc-spin 0.8s linear infinite;
}

@keyframes tpc-spin {
  to { transform: rotate(360deg); }
}

/* Content */
.tpc-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0.5rem 0.75rem 0.75rem;
  gap: 0.5rem;
  min-height: 0;
}

/* Breadcrumb */
.tpc-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.4rem 0.6rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.8rem;
}

.tpc-crumb {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  color: #6366f1;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  transition: all 0.15s;
}

.tpc-crumb:hover:not(.active) {
  background: #eef2ff;
}

.tpc-crumb.active {
  color: #1e293b;
  font-weight: 600;
  cursor: default;
}

.tpc-crumb-sep {
  color: #cbd5e1;
  font-size: 1rem;
  pointer-events: none;
}

/* Chart */
.tpc-chart-wrap {
  flex: 1;
  min-height: 280px;
  background: #fff;
  border-radius: 8px;
}

.tpc-chart {
  width: 100%;
  height: 100%;
  min-height: 280px;
}

/* Drill hint */
.tpc-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  background: #eef2ff;
  border-left: 3px solid #6366f1;
  border-radius: 0 6px 6px 0;
  font-size: 0.78rem;
  color: #4338ca;
}

.tpc-hint-icon {
  font-size: 0.85rem;
}

/* Stats */
.tpc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.tpc-stat {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  text-align: center;
  transition: all 0.2s;
}

.tpc-stat:hover {
  border-color: #c7d2fe;
  background: #eef2ff;
  transform: translateY(-1px);
}

.tpc-stat-label {
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
  margin-bottom: 0.2rem;
}

.tpc-stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

/* Responsive */
@media (max-width: 600px) {
  .tpc-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .tpc-chart {
    min-height: 220px;
  }
}
</style>
