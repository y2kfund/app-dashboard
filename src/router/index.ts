import { createRouter, createWebHistory } from 'vue-router'
import { useSupabase } from '@y2kfund/core'

const Home = () => import('../pages/Home.vue')
const PositionsApp = () => import('../pages/PositionsApp.vue')
const SummaryApp = () => import('../pages/SummaryApp.vue')
const ThesisApp = () => import('../pages/ThesisApp.vue')
const AuthCallback = () => import('../pages/AuthCallback.vue')
const TasksApp = () => import('../pages/TasksApp.vue')
const InstrumentDetails = () => import('../pages/InstrumentDetails.vue')
const RiskManagement = () => import('../pages/RiskManagement.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/positions/:accountId?', name: 'positions', component: PositionsApp, props: true },
    { path: '/summary/:accountId?', name: 'summary', component: SummaryApp, props: true },
    { path: '/thesis/:accountId?', name: 'thesis', component: ThesisApp, props: true },
    { path: '/auth/callback', name: 'auth-callback', component: AuthCallback },
    {
      path: '/tasks',
      name: 'tasks',
      component: TasksApp,
      meta: { requiresAuth: true }
    },
    { 
      path: '/instrument-details/:symbolRoot', 
      name: 'instrument-details', 
      component: InstrumentDetails, 
      props: true
    },
    { 
      path: '/risk-management', 
      name: 'risk-management', 
      component: RiskManagement
    },
    // Catch-all fallback
    { path: '/:pathMatch(.*)*', redirect: '/' },
    {
      path: '/notes/:noteId',
      name: 'notes',
      component: () => import('../pages/Notes.vue'),
      props: true
    }
  ]
})

// Optional: Add route guards for protected pages
router.beforeEach(async (to, from) => {
  // Skip auth check for public routes
  const publicRoutes = ['/login', '/signup', '/auth/callback']
  if (publicRoutes.includes(to.path)) {
    return true
  }

  // Allow navigation - App.vue will handle showing auth forms if not authenticated
  return true
})

export default router