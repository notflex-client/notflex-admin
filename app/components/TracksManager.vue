<script setup lang="ts">
const props = defineProps<{
  movieId: string
  movieTitle: string
  open: boolean
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const toast = useToast()
const api = useApi()

interface Subtitle {
  id: string
  language: string
  label: string
  subtitle_url: string
  format: string
}

interface AudioTrack {
  id: string
  language: string
  label: string
  audio_url: string
  is_default: boolean
}

const subtitles = ref<Subtitle[]>([])
const audioTracks = ref<AudioTrack[]>([])
const loading = ref(false)

const newSub = reactive({ language: 'en', label: '', subtitle_url: '', format: 'vtt' })
const newAudio = reactive({ language: 'en', label: '', audio_url: '', is_default: false })
const subSaving = ref(false)
const audioSaving = ref(false)

async function fetchTracks() {
  if (!props.movieId) return
  loading.value = true
  try {
    const [subs, audios] = await Promise.all([
      api.get<{ items: Subtitle[] }>(`/movies/${props.movieId}/subtitles`),
      api.get<{ items: AudioTrack[] }>(`/movies/${props.movieId}/audio-tracks`),
    ])
    subtitles.value = subs.items ?? []
    audioTracks.value = audios.items ?? []
  } catch {
    toast.add({ title: 'Failed to load tracks', color: 'error' })
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (val) => {
  if (val) fetchTracks()
})

async function addSubtitle() {
  if (!newSub.language || !newSub.subtitle_url) return
  subSaving.value = true
  try {
    await api.post(`/admin/movies/${props.movieId}/subtitles`, { ...newSub })
    toast.add({ title: 'Subtitle added', color: 'success' })
    newSub.label = ''
    newSub.subtitle_url = ''
    fetchTracks()
  } catch {
    toast.add({ title: 'Failed to add subtitle', color: 'error' })
  } finally {
    subSaving.value = false
  }
}

async function removeSubtitle(id: string) {
  if (!confirm('Delete this subtitle?')) return
  try {
    await api.del(`/admin/subtitles/${id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    fetchTracks()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

async function addAudio() {
  if (!newAudio.language || !newAudio.audio_url) return
  audioSaving.value = true
  try {
    await api.post(`/admin/movies/${props.movieId}/audio-tracks`, { ...newAudio })
    toast.add({ title: 'Audio track added', color: 'success' })
    newAudio.label = ''
    newAudio.audio_url = ''
    newAudio.is_default = false
    fetchTracks()
  } catch {
    toast.add({ title: 'Failed to add audio', color: 'error' })
  } finally {
    audioSaving.value = false
  }
}

async function removeAudio(id: string) {
  if (!confirm('Delete this audio track?')) return
  try {
    await api.del(`/admin/audio-tracks/${id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    fetchTracks()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal :open="open" :title="`Tracks — ${movieTitle}`" @update:open="emit('update:open', $event)">
    <template #body>
      <div class="flex flex-col gap-6">

        <section>
          <h3 class="text-sm font-semibold mb-3">Subtitles</h3>
          <div class="flex flex-col gap-2 mb-3">
            <div
              v-for="sub in subtitles"
              :key="sub.id"
              class="flex items-center gap-2 p-2 rounded bg-(--ui-bg-elevated)"
            >
              <UBadge color="neutral" variant="subtle">{{ sub.language }}</UBadge>
              <span class="text-sm flex-1">{{ sub.label || '—' }}</span>
              <span class="text-xs text-(--ui-text-muted) truncate max-w-xs">{{ sub.subtitle_url }}</span>
              <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="removeSubtitle(sub.id)" />
            </div>
            <p v-if="!loading && !subtitles.length" class="text-sm text-(--ui-text-muted)">No subtitles yet.</p>
          </div>

          <div class="grid grid-cols-12 gap-2 items-end">
            <UFormField label="Language" class="col-span-2">
              <UInput v-model="newSub.language" placeholder="en" />
            </UFormField>
            <UFormField label="Label" class="col-span-3">
              <UInput v-model="newSub.label" placeholder="English" />
            </UFormField>
            <UFormField label="VTT URL" class="col-span-5">
              <UInput v-model="newSub.subtitle_url" placeholder="https://..." />
            </UFormField>
            <UButton class="col-span-2" :loading="subSaving" :disabled="!newSub.subtitle_url" @click="addSubtitle">
              Add
            </UButton>
          </div>
        </section>

        <section>
          <h3 class="text-sm font-semibold mb-3">Audio Tracks</h3>
          <div class="flex flex-col gap-2 mb-3">
            <div
              v-for="track in audioTracks"
              :key="track.id"
              class="flex items-center gap-2 p-2 rounded bg-(--ui-bg-elevated)"
            >
              <UBadge color="neutral" variant="subtle">{{ track.language }}</UBadge>
              <span class="text-sm flex-1">{{ track.label || '—' }}</span>
              <UBadge v-if="track.is_default" color="success" variant="subtle">Default</UBadge>
              <span class="text-xs text-(--ui-text-muted) truncate max-w-xs">{{ track.audio_url }}</span>
              <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="removeAudio(track.id)" />
            </div>
            <p v-if="!loading && !audioTracks.length" class="text-sm text-(--ui-text-muted)">No audio tracks yet.</p>
          </div>

          <div class="grid grid-cols-12 gap-2 items-end">
            <UFormField label="Language" class="col-span-2">
              <UInput v-model="newAudio.language" placeholder="en" />
            </UFormField>
            <UFormField label="Label" class="col-span-3">
              <UInput v-model="newAudio.label" placeholder="English" />
            </UFormField>
            <UFormField label="Audio URL" class="col-span-4">
              <UInput v-model="newAudio.audio_url" placeholder="https://..." />
            </UFormField>
            <UFormField label="Default" class="col-span-1">
              <USwitch v-model="newAudio.is_default" />
            </UFormField>
            <UButton class="col-span-2" :loading="audioSaving" :disabled="!newAudio.audio_url" @click="addAudio">
              Add
            </UButton>
          </div>
        </section>

      </div>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton color="neutral" variant="ghost" @click="close">Close</UButton>
      </div>
    </template>
  </UModal>
</template>
