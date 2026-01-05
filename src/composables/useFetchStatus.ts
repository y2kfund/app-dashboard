import { ref } from 'vue'
import { useSupabase } from '@y2kfund/core'

export interface FetchStatusRecord {
  id: number
  run_id: string
  script_type: string
  internal_account_id: string
  status: 'success' | 'failed' | 'skipped'
  error_message: string | null
  records_fetched: number | null
  api_url: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface AccountAlias {
  id: string
  alias: string
}

// Endpoint to script_type mapping
const endpointToScriptType: Record<string, string> = {
  'nlv': 'nlv',
  'maintenance-margin': 'maintenance-margin',
  'settled-cash': 'settled_cash',
  'positions': 'positions'
}

export function useFetchStatus() {
  const supabase = useSupabase()
  
  const fetchStatusData = ref<Record<string, FetchStatusRecord[]>>({})
  const accountAliases = ref<AccountAlias[]>([])
  const isLoadingFetchStatus = ref(false)
  const isLoadingAliases = ref(false)

  // Fetch account aliases - combines user_accounts_master with user_account_alias
  const fetchAccountAliases = async () => {
    if (accountAliases.value.length > 0) return // Already loaded
    
    isLoadingAliases.value = true
    try {
      // First get all non-archived accounts from user_accounts_master
      const { data: accounts, error: accountsError } = await supabase
        .schema('hf')
        .from('user_accounts_master')
        .select('internal_account_id, legal_entity')
        .eq('archived', false)
        .order('internal_account_id')

      if (accountsError) throw accountsError

      // Then try to get aliases from user_account_alias (if user has any)
      const { data: aliases, error: aliasError } = await supabase
        .schema('hf')
        .from('user_account_alias')
        .select('internal_account_id, alias')

      // Don't throw on alias error - it might be empty or user might not have any
      const aliasMap = new Map<string, string>()
      if (!aliasError && aliases) {
        aliases.forEach(a => aliasMap.set(a.internal_account_id, a.alias))
      }
      
      // Combine: prefer alias, then legal_entity, then fallback to "Account X"
      accountAliases.value = (accounts || []).map(acc => ({
        id: String(acc.internal_account_id),
        alias: aliasMap.get(acc.internal_account_id) 
          || acc.legal_entity 
          || `Account ${acc.internal_account_id}`
      }))
    } catch (error) {
      console.error('Failed to fetch account aliases:', error)
      accountAliases.value = []
    } finally {
      isLoadingAliases.value = false
    }
  }

  // Fetch status data for a specific endpoint/script_type
  const fetchStatusForEndpoint = async (endpoint: string, forceRefresh = false) => {
    const scriptType = endpointToScriptType[endpoint]
    if (!scriptType) {
      console.warn(`Unknown endpoint: ${endpoint}`)
      return
    }

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && fetchStatusData.value[endpoint]?.length > 0) {
      return fetchStatusData.value[endpoint]
    }

    isLoadingFetchStatus.value = true
    try {
      const { data, error } = await supabase
        .schema('hf')
        .from('data_fetch_status')
        .select('*')
        .eq('script_type', scriptType)
        .order('created_at', { ascending: false })
        .limit(100) // Get enough records to cover last 10 runs

      if (error) throw error
      
      fetchStatusData.value[endpoint] = data || []
      return data
    } catch (error) {
      console.error(`Failed to fetch status data for ${endpoint}:`, error)
      fetchStatusData.value[endpoint] = []
      return []
    } finally {
      isLoadingFetchStatus.value = false
    }
  }

  // Get status data for an endpoint (returns cached data or empty array)
  const getStatusData = (endpoint: string): FetchStatusRecord[] => {
    return fetchStatusData.value[endpoint] || []
  }

  // Clear cached data
  const clearCache = (endpoint?: string) => {
    if (endpoint) {
      delete fetchStatusData.value[endpoint]
    } else {
      fetchStatusData.value = {}
    }
  }

  // Get last 10 unique run_ids for an endpoint
  const getLastRuns = (endpoint: string, count = 10): string[] => {
    const data = fetchStatusData.value[endpoint] || []
    const uniqueRunIds = [...new Set(data.map(d => d.run_id))]
    return uniqueRunIds.slice(0, count)
  }

  return {
    fetchStatusData,
    accountAliases,
    isLoadingFetchStatus,
    isLoadingAliases,
    fetchAccountAliases,
    fetchStatusForEndpoint,
    getStatusData,
    clearCache,
    getLastRuns
  }
}
