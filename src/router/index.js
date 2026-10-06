import { createRouter, createWebHashHistory } from 'vue-router'

import CatalogView from '../views/CatalogView.vue'
import MovieView from '../views/MovieView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import AdminLoginView from '../views/admin/AdminLoginView.vue'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'

const routes = [
  {
    path: '/',
    name: 'catalog',
    component: CatalogView,
    meta: { showDock: true }
  },
  {
    path: '/movie/:id',
    name: 'movie',
    component: MovieView,
    meta: { showDock: false }
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: FavoritesView,
    meta: { showDock: true }
  },

  // Скрытый закрытый маршрут админки
  {
    path: '/control-panel',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { requiresAdminAuth: true, showDock: false }
  },
  {
    path: '/control-panel/login',
    name: 'admin-login',
    component: AdminLoginView,
    meta: { showDock: false }
  },

  // Всё неизвестное — на главную
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const adminToken = sessionStorage.getItem('admin_token')

  if (to.meta.requiresAdminAuth && !adminToken) {
    return { name: 'admin-login' }
  }
})

export default router