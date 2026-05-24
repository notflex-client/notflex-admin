<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Tags' })

const UButton = resolveComponent('UButton')
const toast = useToast()
const api = useApi()

interface Tag { id: number, name: string, slug: string }

const loading = ref(false)
const tags = ref<Tag[]>([])
const isOpen = ref(false)
const isSaving = ref(false)
const editing = ref<Tag | null>(null)
const form = reactive({ name: '', slug: '' })

async function fetchTags() {
  loading.value = true
  try {
    const res = await api.get<Tag[]>('/tags')
    tags.value = Array.isArray(res) ? res : []
  } catch {
    toast.add({ title: 'Failed to load tags', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchTags)

function openCreate() {
  editing.value = null
  form.name = ''
  form.slug = ''
  isOpen.value = true
}

function openEdit(tag: Tag) {
  editing.value = tag
  form.name = tag.name
  form.slug = tag.slug
  isOpen.value = true
}

async function save() {
  if (!form.name.trim() || !form.slug.trim()) return
  isSaving.value = true
  try {
    if (editing.value) {
      await api.put(`/admin/tags/${editing.value.id}`, { name: form.name.trim(), slug: form.slug.trim() })
      toast.add({ title: 'Tag updated', color: 'success' })
    } else {
      await api.post('/admin/tags', { name: form.name.trim(), slug: form.slug.trim() })
      toast.add({ title: 'Tag created', color: 'success' })
    }
    isOpen.value = false
    fetchTags()
  } catch (e: unknown) {
    const error = e as { data?: { details?: Record<string, string>, message?: string } }
    const msg = error.data?.details?.slug ?? error.data?.message ?? 'Failed to save'
    toast.add({ title: msg, color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function remove(tag: Tag) {
  if (!confirm(`Delete tag "${tag.name}"?`)) return
  try {
    await api.del(`/admin/tags/${tag.id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    fetchTags()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

const columns: TableColumn<Tag>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'slug', header: 'Slug' },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, { icon: 'i-lucide-pencil', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => openEdit(row.original) }),
      h(UButton, { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs', onClick: () => remove(row.original) }),
    ])
  }
]
</script>

<template>
  <UDashboardPanel id="tags">
    <template #header>
      <UDashboardNavbar title="Tags">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="flex items-center justify-between gap-2 px-6 py-4 border-b border-default">
      <h1 class="text-xl font-semibold">
        Tags
      </h1>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate">
        Add Tag
      </UButton>
    </div>

    <UTable :data="tags" :columns="columns" :loading="loading" class="w-full" />

    <UModal v-model:open="isOpen" :title="editing ? 'Edit Tag' : 'Add Tag'">
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Name" required>
            <UInput v-model="form.name" placeholder="e.g. Trending" class="w-full" />
          </UFormField>
          <UFormField label="Slug" required>
            <UInput v-model="form.slug" placeholder="e.g. trending" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="isOpen = false">Cancel</UButton>
          <UButton :loading="isSaving" :disabled="!form.name.trim() || !form.slug.trim()" @click="save">
            {{ editing ? 'Save' : 'Add' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
