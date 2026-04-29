<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Genres' })

const UButton = resolveComponent('UButton')
const toast   = useToast()
const api     = useApi()

interface Genre { id: number; name: string }

const loading  = ref(false)
const genres   = ref<Genre[]>([])
const isOpen   = ref(false)
const isSaving = ref(false)
const name     = ref('')

async function fetchGenres() {
  loading.value = true
  try {
    const res = await api.get<{ data: Genre[] }>('/genres')
    genres.value = res.data ?? []
  } catch {
    toast.add({ title: 'Failed to load genres', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchGenres)

async function save() {
  if (!name.value.trim()) return
  isSaving.value = true
  try {
    await api.post('/genres', { name: name.value.trim() })
    toast.add({ title: 'Genre added', color: 'success' })
    isOpen.value = false
    name.value = ''
    fetchGenres()
  } catch (e: any) {
    const msg = e?.data?.details?.name ?? 'Failed to save'
    toast.add({ title: msg, color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function remove(row: Genre) {
  try {
    await api.del(`/genres/${row.id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    fetchGenres()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

const columns: TableColumn<Genre>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
      h(UButton, { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs', onClick: () => remove(row.original) }),
    ]),
  },
]
</script>

<template>
  <UDashboardPanel id="genres">
    <template #header>
      <UDashboardNavbar title="Genres">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" @click="isOpen = true">Add Genre</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <UTable :data="genres" :columns="columns" :loading="loading" class="w-full" />

    <UModal v-model:open="isOpen" title="Add Genre">
      <template #body>
        <UFormField label="Genre name" required>
          <UInput v-model="name" placeholder="e.g. Horror" class="w-full" @keyup.enter="save" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="isOpen = false">Cancel</UButton>
          <UButton :loading="isSaving" :disabled="!name.trim()" @click="save">Add</UButton>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
