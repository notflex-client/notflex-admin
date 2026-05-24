<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Genres' })

const UButton = resolveComponent('UButton')
const toast = useToast()
const api = useApi()

interface Genre { id: number, name: string }

const loading = ref(false)
const genres = ref<Genre[]>([])
const isOpen = ref(false)
const isSaving = ref(false)
const editing = ref<Genre | null>(null)
const form = reactive({ name: '' })

async function fetchGenres() {
  loading.value = true
  try {
    const res = await api.get<Genre[]>('/genres')
    genres.value = Array.isArray(res) ? res : []
  } catch {
    toast.add({ title: 'Failed to load genres', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchGenres)

function openCreate() {
  editing.value = null
  form.name = ''
  isOpen.value = true
}

function openEdit(genre: Genre) {
  editing.value = genre
  form.name = genre.name
  isOpen.value = true
}

async function save() {
  if (!form.name.trim()) return
  isSaving.value = true
  try {
    if (editing.value) {
      await api.put(`/admin/genres/${editing.value.id}`, { name: form.name.trim() })
      toast.add({ title: 'Genre updated', color: 'success' })
    } else {
      await api.post('/admin/genres', { name: form.name.trim() })
      toast.add({ title: 'Genre created', color: 'success' })
    }
    isOpen.value = false
    fetchGenres()
  } catch (e: unknown) {
    const error = e as { data?: { details?: Record<string, string>, message?: string } }
    const msg = error.data?.details?.name ?? error.data?.message ?? 'Failed to save'
    toast.add({ title: msg, color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function remove(genre: Genre) {
  if (!confirm(`Delete genre "${genre.name}"?`)) return
  try {
    await api.del(`/admin/genres/${genre.id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    fetchGenres()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

const columns: TableColumn<Genre>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, { icon: 'i-lucide-pencil', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => openEdit(row.original) }),
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
      </UDashboardNavbar>
    </template>

    <div class="flex items-center justify-between gap-2 px-6 py-4 border-b border-default">
      <h1 class="text-xl font-semibold">
        Genres
      </h1>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate">
        Add Genre
      </UButton>
    </div>

    <UTable :data="genres" :columns="columns" :loading="loading" class="w-full" />

    <UModal v-model:open="isOpen" :title="editing ? 'Edit Genre' : 'Add Genre'">
      <template #body>
        <UFormField label="Name" required>
          <UInput
            v-model="form.name"
            placeholder="e.g. Action"
            class="w-full"
            @keyup.enter="save"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="isOpen = false">
            Cancel
          </UButton>
          <UButton :loading="isSaving" :disabled="!form.name.trim()" @click="save">
            {{ editing ? 'Save' : 'Add' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
