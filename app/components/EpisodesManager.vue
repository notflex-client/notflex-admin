<script setup lang="ts">
const props = defineProps<{
  movieId: string
  movieTitle: string
  open: boolean
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const toast = useToast()
const api = useApi()

interface Episode {
  id: string
  season_number: number
  episode_number: number
  title: string
  description: string | null
  video_url: string | null
  duration_mins: number | null
}

const episodes = ref<Episode[]>([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const editingId = ref<string | null>(null)

const emptyForm = () => ({
  season_number: 1,
  episode_number: 1,
  title: '',
  description: '',
  video_url: '',
  duration_mins: '' as string | number,
})

const form = reactive(emptyForm())

const seasonGroups = computed(() => {
  const map = new Map<number, Episode[]>()
  for (const ep of episodes.value) {
    if (!map.has(ep.season_number)) map.set(ep.season_number, [])
    map.get(ep.season_number)!.push(ep)
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0])
})

async function fetchEpisodes() {
  if (!props.movieId) return
  loading.value = true
  try {
    const res = await api.get<{ items: Episode[] }>(`/admin/movies/${props.movieId}/episodes`)
    episodes.value = res.items ?? []
  } catch {
    toast.add({ title: 'Failed to load episodes', color: 'error' })
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (val) => {
  if (val) {
    fetchEpisodes()
    startAdd()
  }
})

function startAdd() {
  editingId.value = null
  Object.assign(form, emptyForm())
  if (episodes.value.length > 0) {
    const last = episodes.value[episodes.value.length - 1]
    form.season_number = last.season_number
    form.episode_number = last.episode_number + 1
  }
}

function startEdit(ep: Episode) {
  editingId.value = ep.id
  Object.assign(form, {
    season_number: ep.season_number,
    episode_number: ep.episode_number,
    title: ep.title,
    description: ep.description ?? '',
    video_url: ep.video_url ?? '',
    duration_mins: ep.duration_mins ?? '',
  })
}

function cancelEdit() {
  startAdd()
}

function buildPayload() {
  return {
    season_number: Number(form.season_number),
    episode_number: Number(form.episode_number),
    title: form.title.trim(),
    description: form.description || null,
    video_url: form.video_url || null,
    duration_mins: form.duration_mins ? Number(form.duration_mins) : null,
  }
}

async function save() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    if (editingId.value) {
      await api.put(`/admin/episodes/${editingId.value}`, buildPayload())
      toast.add({ title: 'Episode updated', color: 'success' })
    } else {
      await api.post(`/admin/movies/${props.movieId}/episodes`, buildPayload())
      toast.add({ title: 'Episode added', color: 'success' })
    }
    startAdd()
    fetchEpisodes()
  } catch {
    toast.add({ title: 'Failed to save episode', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function uploadVideo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    const res = await api.postForm<{ url: string }>('/admin/uploads/video', body)
    form.video_url = res.url
    toast.add({ title: 'Video uploaded', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to upload video', color: 'error' })
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function remove(ep: Episode) {
  if (!confirm(`Delete "${ep.title}"?`)) return
  try {
    await api.del(`/admin/episodes/${ep.id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    if (editingId.value === ep.id) startAdd()
    fetchEpisodes()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}
</script>

<template>
  <UModal
    :open="open"
    :title="`Episodes — ${movieTitle}`"
    class="max-w-3xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="flex flex-col gap-6">

        <!-- Episode list -->
        <section>
          <div v-if="loading" class="text-sm text-(--ui-text-muted)">Loading...</div>
          <div v-else-if="!episodes.length" class="text-sm text-(--ui-text-muted)">No episodes yet.</div>
          <div v-else class="flex flex-col gap-4">
            <div v-for="[season, eps] in seasonGroups" :key="season">
              <p class="text-xs font-semibold uppercase tracking-wide text-(--ui-text-muted) mb-2">
                Season {{ season }}
              </p>
              <div class="flex flex-col gap-1">
                <div
                  v-for="ep in eps"
                  :key="ep.id"
                  class="flex items-center gap-3 p-2 rounded"
                  :class="editingId === ep.id ? 'bg-(--ui-bg-elevated) ring-1 ring-(--ui-primary)' : 'bg-(--ui-bg-elevated)'"
                >
                  <UBadge color="neutral" variant="subtle" class="shrink-0 w-8 justify-center">
                    {{ ep.episode_number }}
                  </UBadge>
                  <span class="text-sm font-medium flex-1 truncate">{{ ep.title }}</span>
                  <span v-if="ep.duration_mins" class="text-xs text-(--ui-text-muted) shrink-0">
                    {{ ep.duration_mins }}m
                  </span>
                  <UBadge v-if="ep.video_url" color="success" variant="subtle" class="shrink-0">video</UBadge>
                  <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="startEdit(ep)" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="remove(ep)" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <UDivider />

        <!-- Add / Edit form -->
        <section>
          <h3 class="text-sm font-semibold mb-3">
            {{ editingId ? 'Edit episode' : 'Add episode' }}
          </h3>
          <div class="grid grid-cols-12 gap-3">
            <UFormField label="Season" class="col-span-2">
              <UInput v-model="form.season_number" type="number" min="1" class="w-full" />
            </UFormField>
            <UFormField label="Episode" class="col-span-2">
              <UInput v-model="form.episode_number" type="number" min="1" class="w-full" />
            </UFormField>
            <UFormField label="Duration (mins)" class="col-span-2">
              <UInput v-model="form.duration_mins" type="number" min="1" placeholder="45" class="w-full" />
            </UFormField>
            <UFormField label="Title" class="col-span-6" required>
              <UInput v-model="form.title" placeholder="Episode title" class="w-full" />
            </UFormField>
            <UFormField label="Video URL" class="col-span-9">
              <UInput v-model="form.video_url" placeholder="https://example.com/ep1.m3u8" class="w-full" />
            </UFormField>
            <UFormField label="Upload" class="col-span-3">
              <UInput
                type="file"
                accept="video/mp4,.m3u8"
                class="w-full"
                :disabled="uploading"
                @change="uploadVideo"
              />
            </UFormField>
            <UFormField label="Description" class="col-span-12">
              <UTextarea v-model="form.description" placeholder="Short description..." :rows="2" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2 mt-3">
            <UButton v-if="editingId" color="neutral" variant="ghost" @click="cancelEdit">Cancel</UButton>
            <UButton :loading="saving || uploading" :disabled="!form.title.trim()" @click="save">
              {{ editingId ? 'Save changes' : 'Add episode' }}
            </UButton>
          </div>
        </section>

      </div>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton color="neutral" variant="ghost" @click="emit('update:open', false)">Close</UButton>
      </div>
    </template>
  </UModal>
</template>
