<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Titles' })

const UBadge  = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const toast   = useToast()
const api     = useApi()

interface Genre  { id: number; name: string }
interface Title  {
  id:            string
  title:         string
  type:          'movie' | 'series'
  release_year:  number | null
  rating:        string | null
  video_url:     string | null
  youtube_id:    string | null
  poster_url:    string | null
  banner_url:    string | null
  description:   string | null
  is_premium:    boolean
  genres:        Genre[]
}

// ── State ─────────────────────────────────────────────────────
const loading  = ref(false)
const titles   = ref<Title[]>([])
const total    = ref(0)
const page     = ref(1)
const search   = ref('')

const allGenres  = ref<Genre[]>([])
const isOpen     = ref(false)
const isSaving   = ref(false)
const selected   = ref<Title | null>(null)

const form = reactive({
  title:        '',
  type:         'movie' as 'movie' | 'series',
  release_year: '' as string | number,
  rating:       '',
  video_url:    '',
  youtube_id:   '',
  poster_url:   '',
  banner_url:   '',
  description:  '',
  is_premium:   true,
  genre_ids:    [] as number[],
})

const typeOptions = [
  { label: 'Movie',  value: 'movie' },
  { label: 'Series', value: 'series' },
]

// ── Fetch ─────────────────────────────────────────────────────
async function fetchTitles() {
  loading.value = true
  try {
    const res = await api.get<{ items: Title[]; itemCount: number }>('/movies', { page: page.value, keyword: search.value })
    titles.value = res.items ?? []
    total.value  = res.itemCount ?? 0
  } catch {
    toast.add({ title: 'Failed to load titles', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function fetchGenres() {
  try {
    const res = await api.get<Genre[]>('/genres')
    allGenres.value = Array.isArray(res) ? res : []
  } catch {}
}

onMounted(() => { fetchTitles(); fetchGenres() })
watch([page, search], fetchTitles)

// ── Modal ─────────────────────────────────────────────────────
function openAdd() {
  selected.value = null
  Object.assign(form, { title: '', type: 'movie', release_year: '', rating: '', video_url: '', youtube_id: '', poster_url: '', banner_url: '', description: '', is_premium: true, genre_ids: [] })
  isOpen.value = true
}

function openEdit(row: Title) {
  selected.value = row
  Object.assign(form, {
    title:        row.title,
    type:         row.type,
    release_year: row.release_year ?? '',
    rating:       row.rating ?? '',
    video_url:    row.video_url ?? '',
    youtube_id:   row.youtube_id ?? '',
    poster_url:   row.poster_url ?? '',
    banner_url:   row.banner_url ?? '',
    description:  row.description ?? '',
    is_premium:   row.is_premium,
    genre_ids:    row.genres?.map(g => g.id) ?? [],
  })
  isOpen.value = true
}

async function save() {
  isSaving.value = true
  try {
    const payload = {
      ...form,
      release_year: form.release_year ? Number(form.release_year) : null,
      video_url:    form.video_url || null,
      poster_url:   form.poster_url || null,
      banner_url:   form.banner_url || null,
      youtube_id:   form.youtube_id || null,
      description:  form.description || null,
      rating:       form.rating || null,
    }
    if (selected.value) {
      await api.put(`/admin/movies/${selected.value.id}`, payload)
      toast.add({ title: 'Title updated', color: 'success' })
    } else {
      await api.post('/admin/movies', payload)
      toast.add({ title: 'Title added', color: 'success' })
    }
    isOpen.value = false
    fetchTitles()
  } catch {
    toast.add({ title: 'Failed to save', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function remove(row: Title) {
  try {
    await api.del(`/admin/movies/${row.id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    fetchTitles()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

// ── Table columns ─────────────────────────────────────────────
const columns: TableColumn<Title>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => h(UBadge, { color: row.getValue('type') === 'series' ? 'blue' : 'violet', variant: 'subtle', class: 'capitalize' }, () => row.getValue('type')),
  },
  {
    accessorKey: 'release_year',
    header: 'Year',
    cell: ({ row }) => row.getValue('release_year') ?? '—',
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => row.getValue('rating') ?? '—',
  },
  {
    accessorKey: 'youtube_id',
    header: 'YouTube ID',
    cell: ({ row }) => row.getValue('youtube_id') ?? '—',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex gap-2 justify-end' }, [
      h(UButton, { icon: 'i-lucide-pencil', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => openEdit(row.original) }),
      h(UButton, { icon: 'i-lucide-trash-2', color: 'error',   variant: 'ghost', size: 'xs', onClick: () => remove(row.original) }),
    ]),
  },
]

const genreItems = computed(() => allGenres.value.map(g => ({ label: g.name, value: g.id })))
</script>

<template>
  <UDashboardPanel id="titles">
    <template #header>
      <UDashboardNavbar title="Titles">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UInput v-model="search" placeholder="Search..." icon="i-lucide-search" class="w-52" />
          <UButton icon="i-lucide-plus" @click="openAdd">Add Title</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <UTable :data="titles" :columns="columns" :loading="loading" class="w-full" />

    <div class="flex justify-end px-6 py-3 border-t border-default">
      <UPagination v-model:page="page" :total="total" :page-size="20" />
    </div>

    <!-- Add / Edit modal -->
    <UModal v-model:open="isOpen" :title="selected ? 'Edit Title' : 'Add Title'" class="max-w-2xl">
      <template #body>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Title" class="col-span-2" required>
            <UInput v-model="form.title" placeholder="Movie or series title" class="w-full" />
          </UFormField>
          <UFormField label="Type">
            <USelect v-model="form.type" :items="typeOptions" value-key="value" label-key="label" class="w-full" />
          </UFormField>
          <UFormField label="Year">
            <UInput v-model="form.release_year" placeholder="2024" type="number" class="w-full" />
          </UFormField>
          <UFormField label="Rating">
            <UInput v-model="form.rating" placeholder="TV-MA / PG-13 / R" class="w-full" />
          </UFormField>
          <UFormField label="Video Embed URL" class="col-span-2">
            <UInput v-model="form.video_url" placeholder="https://embed.streamc.xyz/embed.php?hash=..." class="w-full" />
          </UFormField>
          <UFormField label="YouTube ID (fallback)">
            <UInput v-model="form.youtube_id" placeholder="YoHD9XEInc0" class="w-full" />
          </UFormField>
          <UFormField label="Poster URL" class="col-span-2">
            <UInput v-model="form.poster_url" placeholder="https://image.tmdb.org/t/p/w500/..." class="w-full" />
          </UFormField>
          <UFormField label="Banner URL" class="col-span-2">
            <UInput v-model="form.banner_url" placeholder="https://image.tmdb.org/t/p/original/..." class="w-full" />
          </UFormField>
          <UFormField label="Genres" class="col-span-2">
            <USelectMenu v-model="form.genre_ids" :items="genreItems" value-key="value" label-key="label" multiple placeholder="Select genres" class="w-full" />
          </UFormField>
          <UFormField label="Description" class="col-span-2">
            <UTextarea v-model="form.description" placeholder="Short description..." :rows="3" class="w-full" />
          </UFormField>
          <UFormField label="Premium content" class="col-span-2">
            <UCheckbox v-model="form.is_premium" label="Require subscription to watch" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="isOpen = false">Cancel</UButton>
          <UButton :loading="isSaving" :disabled="!form.title.trim()" @click="save">
            {{ selected ? 'Save changes' : 'Add title' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
