<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Users' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

interface User {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

const rows = ref<User[]>([
  { id: 1, name: 'James Smith', email: 'james@example.com', role: 'admin', created_at: '2024-01-10' },
  { id: 2, name: 'Sarah Lee', email: 'sarah@example.com', role: 'user', created_at: '2024-03-22' }
])

function remove(row: User) {
  // TODO: call Go API DELETE /api/users/:id
  rows.value = rows.value.filter(r => r.id !== row.id)
}

const columns: TableColumn<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => h(UBadge, {
      color: row.getValue('role') === 'admin' ? 'primary' : 'neutral',
      variant: 'subtle',
      class: 'capitalize'
    }, () => row.getValue('role'))
  },
  { accessorKey: 'created_at', header: 'Joined' },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
      h(UButton, {
        icon: 'i-lucide-trash-2',
        color: 'error',
        variant: 'ghost',
        size: 'xs',
        onClick: () => remove(row.original)
      })
    ])
  }
]
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="Users">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <UTable :data="rows" :columns="columns" class="w-full" />
  </UDashboardPanel>
</template>
