<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Banners' })

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const toast = useToast()
const api = useApi()

interface Banner {
  id: string
  movie_id: string | null
  title: string
  description: string
  image_url: string
  link_url: string
  page: string
  position: number
  is_active: boolean
}

const PAGE_OPTIONS = [
  { label: 'Home (Browse)',    value: 'browse' },
  { label: 'Films',           value: 'films' },
  { label: 'Series',          value: 'series' },
  { label: 'New & Popular',   value: 'new-and-popular' },
]

const config = useRuntimeConfig()
const apiBase = (config.public.apiUrl as string) || 'http://localhost:8080'

const loading = ref(false)
const banners = ref<Banner[]>([])
const isOpen = ref(false)
const isSaving = ref(false)
const isUploading = ref(false)
const editing = ref<Banner | null>(null)
const form = reactive({
  movie_id: '',
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  page: 'browse',
  position: 0,
  is_active: true,
})

function fullImageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${apiBase}${url}`
}

async function fetchBanners() {
  loading.value = true
  try {
    const res = await api.get<Banner[]>('/admin/banners')
    banners.value = Array.isArray(res) ? res : []
  } catch {
    toast.add({ title: 'Failed to load banners', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchBanners)

function openCreate() {
  editing.value = null
  form.movie_id = ''
  form.title = ''
  form.description = ''
  form.image_url = ''
  form.link_url = ''
  form.page = 'browse'
  form.position = 0
  form.is_active = true
  isOpen.value = true
}

function openEdit(banner: Banner) {
  editing.value = banner
  form.movie_id = banner.movie_id ?? ''
  form.title = banner.title
  form.description = banner.description ?? ''
  form.image_url = banner.image_url
  form.link_url = banner.link_url
  form.page = banner.page || 'browse'
  form.position = banner.position
  form.is_active = banner.is_active
  isOpen.value = true
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  isUploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    const res = await api.postForm<{ url: string }>('/admin/uploads/image', body)
    form.image_url = res.url
    toast.add({ title: 'Image uploaded', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to upload image', color: 'error' })
  } finally {
    isUploading.value = false
    input.value = ''
  }
}

async function save() {
  if (!form.title.trim() || !form.image_url.trim()) return
  isSaving.value = true
  try {
    const payload = {
      movie_id: form.movie_id.trim() || null,
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim(),
      page: form.page || 'browse',
      position: Number(form.position),
      is_active: form.is_active,
    }
    if (editing.value) {
      await api.put(`/admin/banners/${editing.value.id}`, payload)
      toast.add({ title: 'Banner updated', color: 'success' })
    } else {
      await api.post('/admin/banners', payload)
      toast.add({ title: 'Banner created', color: 'success' })
    }
    isOpen.value = false
    fetchBanners()
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    toast.add({ title: error.data?.message ?? 'Failed to save', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function remove(banner: Banner) {
  if (!confirm(`Delete banner "${banner.title}"?`)) return
  try {
    await api.del(`/admin/banners/${banner.id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    fetchBanners()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

const columns: TableColumn<Banner>[] = [
  {
    accessorKey: 'image_url',
    header: 'Image',
    cell: ({ row }) => h('img', { src: fullImageUrl(row.original.image_url), class: 'w-24 h-12 object-cover rounded' })
  },
  { accessorKey: 'title', header: 'Title' },
  {
    accessorKey: 'page',
    header: 'Page',
    cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () =>
      PAGE_OPTIONS.find(p => p.value === row.original.page)?.label ?? row.original.page
    )
  },
  { accessorKey: 'position', header: 'Pos' },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => h(UBadge, {
      color: row.original.is_active ? 'success' : 'neutral',
      variant: 'subtle',
    }, () => row.original.is_active ? 'Active' : 'Inactive')
  },
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
  <UDashboardPanel id="banners">
    <template #header>
      <UDashboardNavbar title="Banners">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="flex items-center justify-between gap-2 px-6 py-4 border-b border-default">
      <h1 class="text-xl font-semibold">
        Banners
      </h1>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate">
        Add Banner
      </UButton>
    </div>

    <UTable :data="banners" :columns="columns" :loading="loading" class="w-full" />

    <UModal v-model:open="isOpen" :title="editing ? 'Edit Banner' : 'Add Banner'">
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Title" required>
            <UInput v-model="form.title" class="w-full" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="form.description" :rows="3" placeholder="Short description shown below the title on the hero" class="w-full" />
          </UFormField>

          <UFormField label="Image" required hint="Upload from your computer">
            <div class="flex flex-col gap-2">
              <UInput
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                :disabled="isUploading"
                class="w-full"
                @change="uploadImage"
              />
              <p v-if="isUploading" class="text-xs text-muted">
                Uploading...
              </p>
              <img
                v-if="form.image_url"
                :src="fullImageUrl(form.image_url)"
                class="rounded border border-default max-h-32 object-cover"
                alt="Banner preview"
              >
            </div>
          </UFormField>

          <UFormField label="Image URL (optional)" hint="Use this if you don't want to upload — paste a direct image link">
            <UInput v-model="form.image_url" placeholder="https://..." class="w-full" />
          </UFormField>

          <UFormField label="Page" required>
            <USelect
              v-model="form.page"
              :items="PAGE_OPTIONS"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Movie ID (optional)">
            <UInput v-model="form.movie_id" placeholder="UUID of related movie" class="w-full" />
          </UFormField>

          <UFormField label="Link URL (optional)">
            <UInput v-model="form.link_url" placeholder="https://..." class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Position">
              <UInput v-model="form.position" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Active">
              <USwitch v-model="form.is_active" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="isOpen = false">Cancel</UButton>
          <UButton :loading="isSaving" :disabled="!form.title.trim() || !form.image_url.trim()" @click="save">
            {{ editing ? 'Save' : 'Add' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
