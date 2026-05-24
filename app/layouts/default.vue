<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  to: '/',
  onSelect: () => { open.value = false }
}, {
  label: 'Titles',
  icon: 'i-lucide-film',
  to: '/titles',
  onSelect: () => { open.value = false }
}, {
  label: 'Users',
  icon: 'i-lucide-users',
  to: '/users',
  onSelect: () => { open.value = false }
}, {
  label: 'Genres',
  icon: 'i-lucide-tag',
  to: '/genres',
  onSelect: () => { open.value = false }
}, {
  label: 'Tags',
  icon: 'i-lucide-hash',
  to: '/tags',
  onSelect: () => { open.value = false }
}, {
  label: 'Plans',
  icon: 'i-lucide-credit-card',
  to: '/plans',
  onSelect: () => { open.value = false }
}, {
  label: 'Banners',
  icon: 'i-lucide-image',
  to: '/banners',
  onSelect: () => { open.value = false }
}, {
  label: 'Payments',
  icon: 'i-lucide-receipt',
  to: '/payments',
  onSelect: () => { open.value = false }
}, {
  label: 'Settings',
  to: '/settings',
  icon: 'i-lucide-settings',
  defaultOpen: false,
  type: 'trigger',
  children: [{
    label: 'General',
    to: '/settings',
    exact: true,
    onSelect: () => { open.value = false }
  }, {
    label: 'Members',
    to: '/settings/members',
    onSelect: () => { open.value = false }
  }]
}], []] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
