import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('../pages/Home.vue')
const PositionsApp = () => import('../pages/PositionsApp.vue')
const MarginApp = () => import('../pages/MarginApp.vue')

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/positions/:accountId?', name: 'positions', component: PositionsApp, props: true },
    { path: '/margin/:accountId?', name: 'margin', component: MarginApp, props: true },
    // Catch-all fallback
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})