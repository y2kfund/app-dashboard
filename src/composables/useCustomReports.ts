import { ref } from 'vue'
import { useSupabase } from '@y2kfund/core'
import { useAuth } from './useAuth'

export interface CustomReport {
  id: string
  user_id: string
  name: string
  url_params: string
  created_at: string
}

export function useCustomReports() {
  const supabase = useSupabase()
  const { user } = useAuth()
  const reports = ref<CustomReport[]>([])
  const isLoading = ref(false)

  // Load reports
  const loadReports = async () => {
    if (!user.value?.id) return
    
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .schema('hf')
        .from('custom_reports')
        .select('*')
        .eq('user_id', user.value.id)
        .eq('archived', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      reports.value = data || []
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      isLoading.value = false
    }
  }

  const setDefaultReport = async (reportId: string) => {
    if (!user.value?.id) return
    try {
      // Unset previous default
      await supabase
        .schema('hf')
        .from('custom_reports')
        .update({ is_default: false })
        .eq('user_id', user.value.id)
      // Set new default
      await supabase
        .schema('hf')
        .from('custom_reports')
        .update({ is_default: true })
        .eq('id', reportId)
        .eq('user_id', user.value.id)
      await loadReports()
    } catch (error) {
      console.error('Failed to set default report:', error)
      throw error
    }
  }

  // Get default report
  const getDefaultReport = async () => {
    if (!user.value?.id) return null
    try {
      const { data, error } = await supabase
        .schema('hf')
        .from('custom_reports')
        .select('*')
        .eq('user_id', user.value.id)
        .eq('is_default', true)
        .eq('archived', false)
        .limit(1)
        .single()
      if (error) return null
      return data
    } catch (error) {
      return null
    }
  }

  // Save report
  const saveReport = async (name: string) => {
    if (!user.value?.id || !name.trim()) return
    
    const urlParams = new URLSearchParams(window.location.search).toString()
    
    try {
      const { error } = await supabase
        .schema('hf')
        .from('custom_reports')
        .insert([{
          user_id: user.value.id,
          name: name.trim(),
          url_params: urlParams
        }])
      
      if (error) throw error
      await loadReports() // Refresh list
    } catch (error) {
      console.error('Failed to save report:', error)
      throw error
    }
  }

  // Update report with current URL (simplified)
  const updateReport = async (reportId: string) => {
    if (!user.value?.id) return
    
    const urlParams = new URLSearchParams(window.location.search).toString()
    
    try {
      const { error } = await supabase
        .schema('hf')
        .from('custom_reports')
        .update({ url_params: urlParams })
        .eq('id', reportId)
        .eq('user_id', user.value.id)
      
      if (error) {
        console.error('Update error:', error)
        throw error
      }
      
      await loadReports() // Refresh list
    } catch (error) {
      console.error('Failed to update report:', error)
      throw error
    }
  }

  // Delete report
  const archiveReport = async (reportId: string) => {
    if (!user.value?.id) return
    
    try {
      const { error } = await supabase
        .schema('hf')
        .from('custom_reports')
        .update({ archived: true })
        .eq('id', reportId)
        .eq('user_id', user.value.id)
      
      if (error) throw error
      await loadReports() // Refresh list
    } catch (error) {
      console.error('Failed to delete report:', error)
      throw error
    }
  }

  return {
    reports,
    isLoading,
    loadReports,
    saveReport,
    updateReport,
    archiveReport,
    setDefaultReport,
    getDefaultReport
  }
}