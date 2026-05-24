<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Users' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const toast = useToast()
const api = useApi()

interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserList {
  items: User[]
  page: number
  itemCount: number
  pageCount: number
}

const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' })

const loading = ref(false)
const users = ref<User[]>([])
const page = ref(1)
const itemCount = ref(0)
const search = ref('')
const roleFilter = ref('all')

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'guest', label: 'Guest' },
  { value: 'subscriber', label: 'Subscriber' },
  { value: 'admin', label: 'Admin' },
]

const isOpen = ref(false)
const isSaving = ref(false)
const editing = ref<User | null>(null)
const form = reactive({
  full_name: '',
  role: 'guest',
  is_active: true,
})

async function fetchUsers() {
  loading.value = true
  try {
    const res = await api.get<UserList>('/admin/users', {
      page: page.value,
      pageSize: 20,
      keyword: search.value || undefined,
      role: roleFilter.value !== 'all' ? roleFilter.value : undefined,
    })
    users.value = res.items ?? []
    itemCount.value = res.itemCount ?? 0
  } catch {
    toast.add({ title: 'Failed to load users', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchUsers()
  }, 300)
})
watch([page, roleFilter], fetchUsers)

function openEdit(user: User) {
  editing.value = user
  form.full_name = user.full_name
  form.role = user.role
  form.is_active = user.is_active
  isOpen.value = true
}

async function save() {
  if (!editing.value) return
  isSaving.value = true
  try {
    await api.put(`/admin/users/${editing.value.id}`, {
      full_name: form.full_name,
      role: form.role,
      is_active: form.is_active,
    })
    toast.add({ title: 'User updated', color: 'success' })
    isOpen.value = false
    fetchUsers()
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    toast.add({ title: error.data?.message ?? 'Failed to save', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function remove(user: User) {
  if (!confirm(`Deactivate ${user.email}? They will be signed out and unable to log in.`)) return
  try {
    await api.del(`/admin/users/${user.id}`)
    toast.add({ title: 'User deactivated', color: 'success' })
    fetchUsers()
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    toast.add({ title: error.data?.message ?? 'Failed to deactivate', color: 'error' })
  }
}

function roleColor(role: string): 'error' | 'success' | 'neutral' {
  if (role === 'admin') return 'error'
  if (role === 'subscriber') return 'success'
  return 'neutral'
}

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => row.original.full_name || '—',
  },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => h(UBadge, {
      color: roleColor(row.original.role),
      variant: 'subtle',
      class: 'capitalize',
    }, () => row.original.role),
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => h(UBadge, {
      color: row.original.is_active ? 'success' : 'neutral',
      variant: 'subtle',
    }, () => row.original.is_active ? 'Active' : 'Inactive'),
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    cell: ({ row }) => date.format(new Date(row.original.created_at)),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex gap-1 justify-end' }, [
      h(UButton, { icon: 'i-lucide-pencil', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => openEdit(row.original) }),
      h(UButton, { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs', onClick: () => remove(row.original) }),
    ]),
  },
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

    <div class="flex items-center justify-between gap-2 px-6 py-4 border-b border-default">
      <h1 class="text-xl font-semibold">
        Users
      </h1>
      <div class="flex items-center gap-2">
        <UInput
          v-model="search"
          placeholder="Search email or name..."
          icon="i-lucide-search"
          class="w-64"
        />
        <USelect
          v-model="roleFilter"
          :items="ROLE_OPTIONS"
          value-key="value"
          label-key="label"
          class="w-40"
        />
      </div>
    </div>

    <UTable :data="users" :columns="columns" :loading="loading" class="w-full" />

    <div v-if="itemCount > 20" class="flex justify-center py-4 border-t border-default">
      <UPagination v-model:page="page" :total="itemCount" :items-per-page="20" />
    </div>

    <UModal v-model:open="isOpen" title="Edit User">
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Email">
            <UInput :model-value="editing?.email" disabled class="w-full" />
          </UFormField>
          <UFormField label="Full name">
            <UInput v-model="form.full_name" class="w-full" />
          </UFormField>
          <UFormField label="Role">
            <USelect
              v-model="form.role"
              :items="[
                { value: 'guest', label: 'Guest' },
                { value: 'subscriber', label: 'Subscriber' },
                { value: 'admin', label: 'Admin' },
              ]"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Active">
            <USwitch v-model="form.is_active" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="isOpen = false">
            Cancel
          </UButton>
          <UButton :loading="isSaving" @click="save">
            Save
          </UButton>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
