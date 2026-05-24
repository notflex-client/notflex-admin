import type { RouterConfig } from '@nuxt/schema'
import type { RouteRecordRaw } from 'vue-router'

export default {
  routes: (_routes) => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/',
        component: () => import('~/views/HomePage.vue')
      },
      {
        path: '/login',
        component: () => import('~/views/LoginPage.vue'),
        meta: { layout: false }
      },
      {
        path: '/titles',
        component: () => import('~/views/TitlesPage.vue')
      },
      {
        path: '/genres',
        component: () => import('~/views/GenresPage.vue')
      },
      {
        path: '/users',
        component: () => import('~/views/UsersPage.vue')
      },
      {
        path: '/tags',
        component: () => import('~/views/TagsPage.vue')
      },
      {
        path: '/plans',
        component: () => import('~/views/PlansPage.vue')
      },
      {
        path: '/banners',
        component: () => import('~/views/BannersPage.vue')
      },
      {
        path: '/payments',
        component: () => import('~/views/PaymentsPage.vue')
      },
      {
        path: '/settings',
        component: () => import('~/views/SettingsPage.vue'),
        children: [
          {
            path: '',
            component: () => import('~/views/Settings/GeneralPage.vue')
          },
          {
            path: 'members',
            component: () => import('~/views/Settings/MembersPage.vue')
          },
          {
            path: 'notifications',
            component: () => import('~/views/Settings/NotificationsPage.vue')
          },
          {
            path: 'security',
            component: () => import('~/views/Settings/SecurityPage.vue')
          }
        ]
      }
    ]

    return routes
  }
} satisfies RouterConfig
