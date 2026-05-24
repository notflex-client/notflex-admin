<script setup lang="ts">
definePageMeta({ layout: false, public: true })

const toast = useToast()
const auth = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function submit() {
  if (!email.value || !password.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(email.value, password.value)
    toast.add({ title: 'Welcome back', color: 'success' })
    router.push('/')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, message?: string }
    errorMsg.value = err.data?.message ?? err.message ?? 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-(--ui-bg) px-4">
    <div class="w-full max-w-md flex flex-col gap-6 p-8 rounded-xl border border-default bg-(--ui-bg-elevated)">
      <div class="flex flex-col items-center gap-2">
        <span class="text-3xl font-black text-(--ui-primary)">NOTFLEX</span>
        <span class="text-sm text-(--ui-text-muted)">Admin Dashboard</span>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <UFormField label="Email" required>
          <UInput
            v-model="email"
            type="email"
            placeholder="admin@notflex.com"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>
        <p v-if="errorMsg" class="text-sm text-(--ui-error)">
          {{ errorMsg }}
        </p>
        <UButton
          type="submit"
          color="primary"
          block
          :loading="loading"
          :disabled="!email || !password"
        >
          Sign in
        </UButton>
      </form>

      <p class="text-xs text-center text-(--ui-text-muted)">
        Only accounts with admin role can sign in here.
      </p>
    </div>
  </div>
</template>
